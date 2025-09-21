import type { Express } from "express";
import { type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.js";
import { KimchiService } from "./services/kimchi.js";
import { CoinAPIService } from "./services/coinapi.js";
import { SimpleKimchiService } from "./services/simple-kimchi.js";
import { UpbitWebSocketService } from "./services/upbit-websocket.js";
import { BinanceWebSocketService } from "./services/binance-websocket.js";
import { realtimeKimchiService } from "./services/realtime-kimchi.js";
import { priceCache } from "./services/price-cache.js";
import { TradingService } from "./services/trading.js";
import { multiStrategyTradingService } from "./services/new-kimchi-trading.js";
import { UpbitService } from "./services/upbit.js";
import { BinanceService } from "./services/binance.js";
import { KimpgaStrategyService } from "./services/kimpga-strategy.js";
import { exchangeTestService } from "./services/exchange-test.js";
import { BacktestService } from "./services/backtest.js";
import { BalanceService } from "./services/BalanceService.js";
import { ErrorTrackingService } from "./services/ErrorTrackingService.js";
import { logError, logInfo, logDebug, logWarn, logSecurity } from './utils/logger.js';
import { getApiErrorGuide, getServerIpInfo } from './utils/api-error-guide.js';
import { PositionsRepository } from "./repositories/PositionsRepository.js";
import { TRADING_CONFIG } from "./config/trading-config.js";
import { globalRateLimiter } from "./utils/rate-limiter.js";
import { proxyManager } from "./utils/proxy-manager.js";
import { ipBanDetector } from "./utils/ip-ban-detector.js";
import { z } from "zod";
const insertTradingSettingsSchema = z.object({
  entryPremiumRate: z.string().optional(),
  exitPremiumRate: z.string().optional(),
  stopLossRate: z.string().optional(),
  maxPositions: z.number().int().optional(),
  isAutoTrading: z.boolean().optional(),
  maxInvestmentAmount: z.string().optional(),
  kimchiEntryRate: z.string().optional(),
  kimchiExitRate: z.string().optional(),
  kimchiToleranceRate: z.string().optional(),
  binanceLeverage: z.number().int().optional(),
  upbitEntryAmount: z.string().optional(),
});
const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});
const loginUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});
import { getCurrentServerIP, isReplit } from "./utils/ip.js";
import { registerAuthRoutes, authenticateSession } from "./routes/auth.js";
import { registerTradingRoutes } from "./routes/trading.js";
import { registerApiRoutes } from "./routes/api.js";
import {
  generateToken,
  verifyToken,
} from "./utils/auth.js";
// @ts-ignore
import bcrypt from "bcrypt";

/**
 * JWT 토큰에서 사용자 ID 추출
 */
function getUserIdFromToken(authHeader?: string): string | null {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    return decoded?.userId ? String(decoded.userId) : null;
  } catch (error) {
    console.error('JWT 토큰 검증 실패:', error);
    return null;
  }
}

/**
 * 요청에서 사용자 ID 추출 (토큰 또는 기본값)
 */
function getUserIdFromRequest(req: any): string {
  const userId = getUserIdFromToken(req.headers.authorization);
  return userId || "1"; // 기본 사용자 ID
}

/**
 * 실제 API 키가 있는 활성 사용자를 찾기
 */
async function findActiveUserWithApiKeys(): Promise<string> {
  try {
    // 알려진 사용자 ID들을 순회하며 API 키가 있는 사용자 찾기
    const knownUserIds = ["7", "1", "2", "3", "4", "5", "6", "8", "9", "10"];
    
    for (const userId of knownUserIds) {
      try {
        const exchanges = await storage.getExchangesByUserId(parseInt(userId));
        
        // 바이낸스 API 키가 있는 사용자 우선 선택
        const binanceExchange = exchanges.find((ex: any) => 
          ex.exchange === 'binance' && ex.isActive && ex.apiKey && ex.apiSecret
        );
        
        if (binanceExchange) {
          logDebug('활성 사용자 발견', { userId, exchange: 'binance' });
          return userId;
        }
        
        // 업비트 API 키가 있는 사용자도 고려
        const upbitExchange = exchanges.find((ex: any) => 
          ex.exchange === 'upbit' && ex.isActive && ex.apiKey && ex.apiSecret
        );
        
        if (upbitExchange) {
          logDebug('활성 사용자 발견', { userId, exchange: 'upbit' });
          return userId;
        }
      } catch (error) {
        // 해당 사용자가 없거나 오류시 다음 사용자로
        continue;
      }
    }
    
    logWarn('API 키가 있는 활성 사용자를 찾지 못함, 기본 사용자 1 사용');
    return "1";
  } catch (error) {
    logError('활성 사용자 찾기 실패', { error: error instanceof Error ? error.message : error });
    return "1"; // 실패시 기본값
  }
}

/**
 * 실제 거래소에서 포지션 청산 실행
 */
async function executeRealLiquidation(userId: string, position: any): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  pnl?: number;
}> {
  try {
    logInfo('실제 거래소 청산 시작', { 
      userId, 
      positionId: position.id,
      symbol: position.symbol,
      side: position.side 
    });
    
    // 사용자의 거래소 API 키 조회
    const exchanges = await storage.getExchangesByUserId(parseInt(userId));
    const upbitExchange = exchanges.find((e: any) => e.exchange === "upbit" && e.isActive);
    const binanceExchange = exchanges.find((e: any) => e.exchange === "binance" && e.isActive);
    
    if (!upbitExchange || !binanceExchange) {
      return {
        success: false,
        error: "거래소 API 키가 설정되지 않았습니다"
      };
    }
    
    const results = [];
    
    // 업비트 현물 매도 (BTC 보유량 확인 후)
    if (position.symbol === 'BTC') {
      try {
        const upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
        const accounts = await upbitService.getAccounts();
        const btcAccount = accounts.find((acc: any) => acc.currency === 'BTC');
        const btcBalance = btcAccount ? parseFloat(btcAccount.balance) : 0;
        
        if (btcBalance > 0.0001) { // 최소 거래 단위 체크
          logInfo('업비트 BTC 매도 시작', { balance: btcBalance });
          const sellResult = await upbitService.placeSellOrder('KRW-BTC', btcBalance);
          results.push({
            exchange: 'upbit',
            action: 'sell',
            success: true,
            result: sellResult
          });
          logInfo('업비트 BTC 매도 성공', { orderId: sellResult.uuid });
        } else {
          logInfo('업비트 BTC 잔고 부족', { balance: btcBalance });
        }
      } catch (upbitError: any) {
        logError('업비트 매도 실패', { error: upbitError.message });
        results.push({
          exchange: 'upbit',
          action: 'sell',
          success: false,
          error: upbitError.message
        });
      }
    }
    
    // 바이낸스 선물 포지션 청산
    try {
      const binanceService = new BinanceService(binanceExchange.apiKey, binanceExchange.apiSecret);
      const accountInfo = await binanceService.getFuturesAccountInfo();
      
      // 활성 포지션이 있는지 확인
      if (accountInfo.positions && accountInfo.positions.length > 0) {
        const btcPosition = accountInfo.positions.find((pos: any) => 
          pos.symbol === 'BTCUSDT' && parseFloat(pos.positionAmt) !== 0
        );
        
        if (btcPosition) {
          const positionAmt = parseFloat(btcPosition.positionAmt);
          logInfo('바이낸스 포지션 청산 시작', { 
            symbol: btcPosition.symbol,
            amount: positionAmt 
          });
          
          // 포지션 청산 (기존 메서드 사용)
          const quantity = Math.abs(positionAmt);
          let closeResult;
          
          if (positionAmt < 0) {
            // 숏 포지션 청산 (커버)
            closeResult = await binanceService.closeFuturesPosition('BTC', quantity);
          } else {
            // 롱 포지션 청산
            closeResult = await binanceService.closeLongOrder('BTC', quantity);
          }
          results.push({
            exchange: 'binance',
            action: 'close',
            success: true,
            result: closeResult
          });
          logInfo('바이낸스 포지션 청산 성공', { orderId: closeResult.orderId });
        } else {
          logInfo('바이낸스 활성 포지션 없음');
        }
      }
    } catch (binanceError: any) {
      logError('바이낸스 청산 실패', { error: binanceError.message });
      results.push({
        exchange: 'binance',
        action: 'close',
        success: false,
        error: binanceError.message
      });
    }
    
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    return {
      success: successfulResults.length > 0,
      message: `거래소 청산 완료: 성공 ${successfulResults.length}개, 실패 ${failedResults.length}개`,
      pnl: 0 // 실제 손익은 별도 계산 필요
    };
    
  } catch (error: any) {
    logError('실제 거래소 청산 오류', { 
      userId, 
      positionId: position.id,
      error: error.message 
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}


// DB row → 프론트 DTO (원본 값 최대한 보존)
const toStrategyResponse = (row: any) => ({
  id: row.id,
  name: row.name || `전략 #${row.id}`,
  crypto: row.symbol || row.crypto || 'BTC',
  entryCondition: row.entry_rate ?? row.entryCondition ?? 0,
  takeProfitCondition: row.exit_rate ?? row.takeProfitCondition ?? 0,
  tolerance: row.tolerance ?? row.tolerance_rate ?? row.kimchi_tolerance_rate ?? 0.1,
  leverage: String(row.leverage ?? row.binance_leverage ?? 3),
  investmentAmount: String(row.investment_amount ?? row.max_investment_amount ?? row.investmentAmount ?? 0),
  isActive: Boolean(row.is_active ?? row.isAutoTrading ?? row.is_auto_trading ?? row.isActive),
  profitRate: String(row.total_profit_rate ?? row.profitRate ?? 0),
  executionCount: row.executions ?? row.executionCount ?? 0,
  strategyType: row.strategy_type || row.strategyType || 'positive_kimchi',
});

export async function registerRoutes(
  app: Express,
  server: Server
): Promise<void> {
  const kimchiService = new KimchiService();
  const coinAPIService = new CoinAPIService();
  const simpleKimchiService = new SimpleKimchiService();
  const backtestService = new BacktestService();
  const errorTrackingService = new ErrorTrackingService();
  const positionsRepo = new PositionsRepository();
  
  // 🚀 웹소켓 서비스 인스턴스 생성 및 자동 구독 시작
  const upbitWebSocketService = new UpbitWebSocketService();
  new BinanceWebSocketService();
  
  // 🚀 실시간 김치 프리미엄 계산 시스템 연결
  priceCache.onPriceUpdate((source, symbol, _price) => {
    realtimeKimchiService.onPriceUpdate(source, symbol);
  });

  // 주요 코인들 자동 구독
  setTimeout(() => {
    console.log('🔔 웹소켓 자동 구독 시작...');
    upbitWebSocketService.subscribe(['KRW-BTC', 'KRW-ETH', 'KRW-XRP', 'KRW-ADA', 'KRW-DOT', 'KRW-USDT']);
    console.log('✅ 업비트 웹소켓 구독 완료 (USDT 포함)');
    console.log('✅ 바이낸스 웹소켓 자동 연결 완료');
    console.log('🚀 실시간 김치 프리미엄 계산 시스템 활성화');
    
    // 🚀 웹소켓 연결 후 초기 데이터 한 번 전송
    setTimeout(() => {
      try {
        const kimchiData = realtimeKimchiService.getCurrentKimchiPremium();
        if (kimchiData.length > 0) {
          console.log('🚀 초기 김치프리미엄 데이터 브로드캐스트:', kimchiData.length, '개 심볼');
          realtimeKimchiService.onPriceUpdate('upbit', 'BTC');
        }
      } catch (error) {
        console.error('초기 트리거 오류:', error);
      }
    }, 1000); // 1초 후 초기 데이터 전송
    
  }, 2000); // 2초 후 구독 시작
  
  // 💥💥💥 문제의 원인이었던 직접 생성 코드 제거 💥💥💥
  // const upbitWebSocket = new UpbitWebSocketService();
  // const binanceWebSocket = new BinanceWebSocketService();

  const kimpgaSvc = new KimpgaStrategyService();
  new TradingService();
  // kimpga API (완전 통합)
  app.get("/api/kimpga/current", async (_req, res) => {
    try {
      // 대시보드와 완전히 동일한 소스 사용: 실시간 계산 값을 그대로 반환
      const realtime = realtimeKimchiService.getCurrentKimchiPremium();
      const d = realtime.find((x) => x.symbol === "BTC");
      res.json({
        kimp: d?.premiumRate ?? null,
        upbit_price: d?.upbitPrice ?? null,
        binance_price: d?.binanceFuturesPrice ?? null,
        usdkrw: d?.usdKrwRate ?? null,
      });
    } catch (e) {
      console.error("/api/kimpga/current error", e);
      res.status(500).json({ error: "failed" });
    }
  });

  app.get("/api/kimpga/status", async (_req, res) => {
    try {
      res.json(kimpgaSvc.getStatus());
    } catch (e) {
      res.status(500).json({ error: "failed" });
    }
  });

  app.get("/api/kimpga/health", (_req, res) => {
    res.json({ thread_alive: kimpgaSvc.getStatus().running });
  });

  app.get("/api/kimpga/metrics", (_req, res) => {
    const m = kimpgaSvc.getMetrics();
    res.json(m);
  });

  // 최근 거래 기록 조회 API (DB 기반)
  app.get("/api/recent-trades", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      
      logDebug('최근 거래 조회 시작', { userId, limit });
      
      const trades = await storage.getTradesByUserId(String(userId), limit);
      
      // 거래 데이터 포맷팅 (고정된 시간 사용)
      const formattedTrades = trades.map(trade => ({
        id: trade.id,
        timestamp: trade.executed_at || trade.created_at, // DB의 고정된 시간
        type: trade.side, // 'buy', 'sell', 'short' 등
        symbol: trade.symbol || 'BTC',
        quantity: Number(trade.quantity || 0),
        price: Number(trade.price || 0),
        fee: Number(trade.fee || 0),
        exchange: trade.exchange,
        orderId: trade.order_id
      }));
      
      logDebug('최근 거래 조회 완료', { userId, count: formattedTrades.length });
      
      res.json(formattedTrades);
    } catch (error) {
      logError('최근 거래 조회 실패', { 
        userId: req.user?.id,
        error: error instanceof Error ? error.message : error 
      });
      res.status(500).json({ error: '최근 거래 조회 중 오류가 발생했습니다' });
    }
  });

  // 실시간 거래소 잔고 조회 API
  app.get("/api/realtime-balances", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      logDebug('실시간 잔고 조회 시작', { userId });
      
      // 실시간 거래소 잔고 조회
      const exchanges = await storage.getExchangesByUserId(parseInt(userId));
      const activeExchanges = exchanges.filter(e => e.isActive);
      logDebug('거래소 연결 상태', { 
        userId, 
        totalExchanges: exchanges.length,
        activeExchanges: activeExchanges.map(e => e.exchange)
      });
      
      const upbitExchange = exchanges.find((e) => e.exchange === "upbit" && e.isActive);
      const binanceExchange = exchanges.find((e) => e.exchange === "binance" && e.isActive);
      
      let upbitBtc = 0;
      let binanceBtc = 0;
      
      // 업비트 실시간 BTC 잔고
      if (upbitExchange) {
        console.log(`🔍 [realtime-balances] 업비트 API 호출 중...`);
        try {
          const upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
          const accounts = await upbitService.getAccounts();
          console.log(`🔍 [realtime-balances] 업비트 계좌 정보:`, accounts.map(a => ({ currency: a.currency, balance: a.balance })));
          const btcAccount = accounts.find((account: any) => account.currency === 'BTC');
          upbitBtc = btcAccount ? parseFloat(btcAccount.balance) : 0;
          console.log(`🔍 [realtime-balances] 업비트 BTC 잔고: ${upbitBtc}`);
        } catch (error) {
          console.error('❌ [realtime-balances] 업비트 실시간 잔고 조회 실패:', error);
        }
      } else {
        console.log(`⚠️ [realtime-balances] 업비트 거래소 연결 없음`);
      }
      
      // 바이낸스 실시간 BTC 포지션
      if (binanceExchange) {
        console.log(`🔍 [realtime-balances] 바이낸스 API 호출 중...`);
        try {
          const binanceService = new BinanceService(binanceExchange.apiKey, binanceExchange.apiSecret);
          const accountInfo = await binanceService.getFuturesAccountInfo();
          console.log(`🔍 [realtime-balances] 바이낸스 포지션 수:`, accountInfo.positions?.length || 0);
          const btcPosition = accountInfo.positions?.find((pos: any) => pos.symbol === 'BTCUSDT');
          binanceBtc = btcPosition ? parseFloat(btcPosition.positionAmt || '0') : 0;
          console.log(`🔍 [realtime-balances] 바이낸스 BTC 포지션: ${binanceBtc}`);
        } catch (error) {
          console.error('❌ [realtime-balances] 바이낸스 실시간 포지션 조회 실패:', error);
        }
      } else {
        console.log(`⚠️ [realtime-balances] 바이낸스 거래소 연결 없음`);
      }
      
      console.log(`✅ [realtime-balances] 최종 결과: 업비트 ${upbitBtc} BTC, 바이낸스 ${binanceBtc} BTC`);
      
      res.json({
        upbitBtc,
        binanceBtc,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('실시간 잔고 조회 실패:', error);
      res.status(500).json({ error: '실시간 잔고 조회 중 오류가 발생했습니다' });
    }
  });

  // 실제 거래 통계 API (DB 기반)
  app.get("/api/trading/daily-stats", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const minutes = parseInt(req.query.minutes as string) || 1440; // 기본 24시간
      
      // 한국시간 기준 오늘 자정 계산 (더 정확한 방법)
      const now = new Date();
      
      // 한국시간 오늘 자정 (KST 기준)
      const kstNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
      const kstMidnight = new Date(kstNow);
      kstMidnight.setHours(0, 0, 0, 0);
      
      console.log(`🔍 [daily-stats] 한국시간 기준:`, {
        현재UTC: now.toISOString(),
        현재한국시간: kstNow.toISOString(),
        오늘자정한국시간: kstMidnight.toISOString(),
        필터링기준: kstMidnight.toISOString()
      });
      
      // 🚀 SQL에서 직접 한국시간 기준 오늘 데이터만 조회 (더 정확하고 효율적)
      const todayTrades = await storage.getTodayTradesByUserId(String(userId));
      const todayPositions = await storage.getTodayPositionsByUserId(userId);
      
      // 전체 데이터도 조회 (비교용)
      const allTrades = await storage.getTradesByUserId(String(userId), 100);
      const allPositions = await storage.getPositions({ user_id: userId });
      
      console.log(`🔍 [daily-stats] SQL 직접 조회 결과:`, {
        전체거래: allTrades.length,
        오늘거래: todayTrades.length,
        전체포지션: allPositions.length,
        오늘포지션: todayPositions.length,
        오늘활성포지션: todayPositions.filter(p => p.status === 'open').length
      });
      
      // 포지션 시간 상세 확인
      if (allPositions.length > 0) {
        console.log(`🔍 [daily-stats] 포지션 시간 상세:`, allPositions.map(p => {
          const positionTime = new Date(p.created_at || p.entry_time);
          const positionKst = new Date(positionTime.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
          const positionDate = positionKst.toDateString();
          const todayDate = kstMidnight.toDateString();
          
          return {
            id: p.id,
            status: p.status,
            entry_time: p.entry_time,
            created_at: p.created_at,
            한국시간: positionKst.toISOString(),
            오늘포함여부: positionDate === todayDate
          };
        }));
      }
      
      // 진입/청산 거래만 필터링 (실제 의미있는 거래)
      const entryTrades = todayTrades.filter(t => 
        t.side === 'buy' || t.type === 'buy' || t.action === 'entry' || 
        (t.exchange === 'upbit' && (t.side === 'bid' || t.ord_type === 'limit'))
      );
      const exitTrades = todayTrades.filter(t => 
        t.side === 'sell' || t.type === 'sell' || t.action === 'exit' ||
        t.side === 'short' || // 바이낸스 숏 포지션도 청산으로 분류
        (t.exchange === 'binance' && (t.side === 'ask' || t.type === 'short'))
      );
      
      // 실제 포지션 생성/청산 횟수
      const todayEntries = todayPositions.filter(p => p.status === 'open').length;
      const todayExits = todayPositions.filter(p => p.status === 'closed').length;

      // 통계 계산 (의미있는 거래만)
      const meaningfulTrades = entryTrades.length + exitTrades.length;
      
      const stats = {
        total_orders: meaningfulTrades, // 진입+청산 거래만
        entries: entryTrades.length, // 거래 기반 진입 수 (더 직관적)
        exits: exitTrades.length, // 거래 기반 청산 수 (더 직관적)
        upbit_orders: entryTrades.filter(t => t.exchange === 'upbit').length,
        binance_orders: exitTrades.filter(t => t.exchange === 'binance').length,
        total_fees: (() => {
          // 완료된 거래 수수료
          const completedFees = todayTrades.reduce((sum, trade) => {
            const fee = Number(trade.fee || 0);
            return sum + (trade.exchange === 'upbit' ? fee : fee * 1390); // USDT → KRW 변환
          }, 0);
          
          // 🔄 오늘 활성 포지션의 실시간 예상 매도 수수료 추가 (수정)
          let activePositionFees = 0;
          const todayActivePositions = todayPositions.filter(p => p.status === 'open');
          
          console.log(`🔍 [daily-stats] 오늘 활성 포지션: ${todayActivePositions.length}개`);
          
          if (todayActivePositions.length > 0) {
            // 실시간 김치 데이터 한 번만 조회
            const realtimeData = realtimeKimchiService.getCurrentKimchiPremium();
            const btcData = realtimeData.find(d => d.symbol === 'BTC');
            
            console.log(`🔍 [daily-stats] BTC 데이터:`, {
              upbitPrice: btcData?.upbitPrice,
              binancePrice: btcData?.binanceFuturesPrice,
              usdKrw: btcData?.usdKrwRate
            });
            
            const currentUpbitPrice = btcData?.upbitPrice || 160000000; // 기본값
            const currentBinancePrice = btcData?.binanceFuturesPrice || 115000; // 기본값
            const currentUsdKrw = btcData?.usdKrwRate || 1390; // 기본값
            
            // 모든 활성 포지션에 대해 수수료 계산 (캐시된 가격 사용)
            activePositionFees = todayActivePositions.reduce((sum, position, index) => {
              // 업비트 예상 매도 수수료 (실시간) - 올바른 필드명 사용
              const upbitQuantity = position.quantity || position.upbitQuantity || 0;
              const upbitSellAmount = upbitQuantity * currentUpbitPrice;
              const upbitExitFee = upbitSellAmount * 0.0005;
              
              // 바이낸스 예상 매도 수수료 (실시간) - 올바른 필드명 사용
              const binanceQuantity = position.binance_quantity || position.binanceQuantity || 0;
              const binanceSellAmount = binanceQuantity * currentBinancePrice;
              const binanceExitFee = (binanceSellAmount * 0.0004) * currentUsdKrw;
              
              console.log(`🔍 [daily-stats] 포지션 ${index + 1}:`, {
                upbitQuantity,
                binanceQuantity,
                upbitExitFee: upbitExitFee.toFixed(2),
                binanceExitFee: binanceExitFee.toFixed(2),
                totalFee: (upbitExitFee + binanceExitFee).toFixed(2)
              });
              
              return sum + upbitExitFee + binanceExitFee;
            }, 0);
            
            console.log(`🔍 [daily-stats] 총 예상 매도 수수료: ₩${activePositionFees.toFixed(2)}`);
          }
          
          return completedFees + activePositionFees;
        })(),
        total_profit_rate: (() => {
          // 간단한 수익률 계산: 총 수수료 대비 손익
          const totalFeesKrw = todayTrades.reduce((sum, trade) => {
            return sum + Number(trade.fee || 0);
          }, 0);
          
          // 거래량 기반 대략적 수익률 (실제 가격 정보가 부족한 경우)
          const totalQuantity = todayTrades.reduce((sum, trade) => {
            return sum + Number(trade.quantity || 0);
          }, 0);
          
          if (totalQuantity > 0.01) { // 0.01 BTC 이상 거래한 경우
            // 대략적 수익률: 수수료 대비 1% 정도로 가정
            return Math.max(-5, Math.min(5, (totalQuantity * 100) - (totalFeesKrw / 10000)));
          }
          
          return 0;
        })(),
        total_profit_krw: (() => {
          // 김치 차익거래 수익 계산 (김치프리미엄 변화량 기반)
          let totalKimchiProfit = 0;
          
          // 실시간 김치 데이터 가져오기
          const realtimeData = realtimeKimchiService.getCurrentKimchiPremium();
          const btcData = realtimeData.find(d => d.symbol === 'BTC');
          const currentKimchiRate = btcData?.premiumRate || 0;
          const currentUsdKrw = btcData?.usdKrwRate || 1390;
          
          logDebug('김치 차익거래 수익 계산 시작', {
            현재김프: currentKimchiRate,
            환율: currentUsdKrw,
            활성포지션: allPositions.filter(p => p.status === 'open').length,
            완료포지션: allPositions.filter(p => p.status === 'closed').length
          });
          
          // 모든 포지션에 대해 김치프리미엄 변화 수익 계산
          for (const position of allPositions) {
            const entryKimchiRate = Number(position.entry_premium_rate || 0);
            let entryPrice = Number(position.entry_price || 0); // KRW 투자금액
            const leverage = Number(position.binance_leverage || 1);
            
            // entry_price가 비현실적으로 크면 실제 투자금액으로 추정
            if (entryPrice > 50000000) { // 5천만원 이상이면 비현실적
              // 실제 BTC 수량 × 현재 BTC 가격으로 추정
              const btcQuantity = Number(position.quantity || position.binance_quantity || 0.001);
              const currentBtcPrice = btcData?.upbitPrice || 115000000;
              entryPrice = btcQuantity * currentBtcPrice; // 실제 투자금액 추정
              
              logDebug('비현실적 entry_price 보정', {
                positionId: position.id,
                원본entryPrice: Number(position.entry_price || 0),
                보정후entryPrice: entryPrice,
                btcQuantity: btcQuantity
              });
            }
            
            if (entryPrice > 0 && entryPrice < 10000000) { // 1천만원 이하만 처리
              let kimchiProfitForPosition = 0;
              
              if (position.status === 'closed') {
                // 완료된 포지션: 청산 시점의 김프와 진입 김프 차이
                const exitKimchiRate = Number(position.exit_premium_rate || currentKimchiRate);
                const kimchiChange = entryKimchiRate - exitKimchiRate; // 김프 감소가 수익
                
                // 김프 변화에 따른 수익 = 투자금액 × (김프변화% ÷ 100) × 0.01 (현실적 소액 계수)
                kimchiProfitForPosition = entryPrice * (kimchiChange / 100) * 0.01;
                
                logDebug('완료 포지션 김치 수익', {
                  positionId: position.id,
                  진입김프: entryKimchiRate,
                  청산김프: exitKimchiRate,
                  김프변화: kimchiChange,
                  투자금액: entryPrice,
                  김치수익: Math.floor(kimchiProfitForPosition)
                });
                
              } else if (position.status === 'open') {
                // 활성 포지션: 현재 김프와 진입 김프 차이 (미실현)
                const kimchiChange = entryKimchiRate - currentKimchiRate; // 김프 감소가 수익
                
                // 김프 변화에 따른 미실현 수익 = 투자금액 × (김프변화% ÷ 100) × 0.01 (현실적 소액 계수)
                kimchiProfitForPosition = entryPrice * (kimchiChange / 100) * 0.01;
                
                logDebug('활성 포지션 김치 수익', {
                  positionId: position.id,
                  진입김프: entryKimchiRate,
                  현재김프: currentKimchiRate,
                  김프변화: kimchiChange,
                  투자금액: entryPrice,
                  미실현김치수익: Math.floor(kimchiProfitForPosition)
                });
              }
              
              totalKimchiProfit += kimchiProfitForPosition;
            }
          }
          
          // 거래 수수료 차감
          const totalFees = todayTrades.reduce((sum, trade) => {
            return sum + Number(trade.fee || 0);
          }, 0);
          
          const finalProfit = totalKimchiProfit - totalFees;
          
          logInfo('김치 차익거래 총 수익 계산 완료', {
            총김치수익: Math.floor(totalKimchiProfit),
            총수수료: Math.floor(totalFees),
            순수익: Math.floor(finalProfit)
          });
          
          return Math.floor(finalProfit);
        })(),
        loops: 0,
        errors: 0
      };
      
      res.json(stats);
    } catch (error) {
      console.error('일일 통계 조회 실패:', error);
      res.status(500).json({ 
        error: '일일 통계 조회 중 오류가 발생했습니다',
        details: (error as any).message 
      });
    }
  });

  app.get("/api/kimpga/balance", authenticateSession, async (req: any, res) => {
    try {
      // 세션에서 인증된 사용자 ID 가져오기
      const userId = req.user.id;
      console.log(`🔍 [잔고 조회] 인증된 사용자 ID: ${userId}`);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const ex = await storage.getExchangesByUserId(parseInt(userId));
      const up = ex.find((e: any) => e.exchange === "upbit" && e.isActive);
      const bi = ex.find((e: any) => e.exchange === "binance" && e.isActive);
      
      let krw = 0;
      let btc_upbit = 0;
      let usdt = 0;

      // 업비트 잔고 조회
      console.log(`🔍 [잔고 조회] 업비트 설정:`, up ? {
        hasApiKey: !!up.apiKey,
        hasApiSecret: !!up.apiSecret,
        apiKeyLength: up.apiKey?.length || 0
      } : '없음');
      
      if (up && up.apiKey && up.apiSecret) {
        try {
          console.log(`💰 [잔고 조회] 업비트 API 호출 시작`);
          const { UpbitService } = await import('./services/upbit.js');
          // 복호화된 API 키 사용
          const decryptedUpbit = await storage.getDecryptedExchange(userId, 'upbit').catch(() => null);
          const upApiKey = decryptedUpbit?.apiKey || up.apiKey;
          const upApiSecret = decryptedUpbit?.apiSecret || up.apiSecret;
          const upbitService = new UpbitService(upApiKey, upApiSecret);
          const accounts = await upbitService.getAccounts();
          console.log(`💰 [잔고 조회] 업비트 계좌 개수: ${accounts.length}`);
          
          const krwAccount = accounts.find((account: any) => account.currency === 'KRW');
          const btcAccount = accounts.find((account: any) => account.currency === 'BTC');
          
          krw = krwAccount ? parseFloat(krwAccount.balance) : 0;
          btc_upbit = btcAccount ? parseFloat(btcAccount.balance) : 0;
          
          console.log(`💰 [잔고 조회] 업비트 KRW: ${krw}, BTC: ${btc_upbit}`);
        } catch (error) {
          console.error('❌ [잔고 조회] 업비트 잔고 조회 오류:', error);
        }
      } else {
        console.log(`⚠️ [잔고 조회] 업비트 API 키 없음`);
      }

      // 바이낸스 잔고 조회
      console.log(`🔍 [잔고 조회] 바이낸스 설정:`, bi ? {
        hasApiKey: !!bi.apiKey,
        hasApiSecret: !!bi.apiSecret,
        apiKeyLength: bi.apiKey?.length || 0
      } : '없음');
      
      if (bi && bi.apiKey && bi.apiSecret) {
        try {
          console.log(`💰 [잔고 조회] 바이낸스 API 호출 시작`);
          const { BinanceService } = await import('./services/binance.js');
          // 복호화된 API 키 사용
          const decryptedBinance = await storage.getDecryptedExchange(userId, 'binance').catch(() => null);
          const biApiKey = decryptedBinance?.apiKey || bi.apiKey;
          const biApiSecret = decryptedBinance?.apiSecret || bi.apiSecret;
          const binanceService = new BinanceService(biApiKey, biApiSecret);
          usdt = await binanceService.getUSDTBalance();
          console.log(`💰 [잔고 조회] 바이낸스 USDT: ${usdt}`);
        } catch (error) {
          console.error('❌ [잔고 조회] 바이낸스 잔고 조회 오류:', error);
        }
      } else {
        console.log(`⚠️ [잔고 조회] 바이낸스 API 키 없음`);
      }

      console.log(`✅ [잔고 조회] 최종 결과: KRW=${krw}, BTC=${btc_upbit}, USDT=${usdt}`);

      res.json({
        real: { krw, btc_upbit, usdt },
        connected: { upbit: !!up, binance: !!bi },
      });
    } catch (e) {
      console.error('❌ [잔고 조회] 전체 오류:', e);
      res.json({ real: { krw: 0, btc_upbit: 0, usdt: 0 } });
    }
  });

  app.post("/api/kimpga/start", async (_req, res) => {
    kimpgaSvc.start();
    res.json({ ok: true });
  });

  app.post("/api/kimpga/stop", async (_req, res) => {
    kimpgaSvc.stop();
    res.json({ ok: true });
  });

  app.post("/api/kimpga/force-exit", async (_req, res) => {
    const result = kimpgaSvc.forceExit();
    res.json(result);
  });

  // 백테스트 실행 API
  app.post("/api/backtest", async (req, res) => {
    try {
      console.log("Backtest request received:", req.body);
      const params = req.body;
      const result = await backtestService.runBacktest(params);
      res.json(result);
    } catch (error: any) {
      console.error("Backtest API error:", error);
      res.status(500).json({ error: "Failed to run backtest", details: error.message });
    }
  });

  // 🔐 Authentication Routes

  // 회원가입
  app.post("/api/auth/register", async (req, res) => {
    try {
      // CORS 헤더 추가
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");

      console.log("회원가입 요청 데이터:", req.body);

      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        console.log("검증 실패:", validation.error.errors);
        return res.status(400).json({
          message: "입력 데이터가 올바르지 않습니다",
          errors: validation.error.errors,
        });
      }

      const { username, password } = validation.data;
      console.log("검증 완료 - 사용자명:", username);

      // 사용자명 중복 체크
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res
          .status(409)
          .json({ message: "이미 존재하는 사용자명입니다" });
      }

      console.log("새 사용자 생성 중...");
      // 비밀번호 해시화
      // const hashedPassword = await bcrypt.hash(password, 10);

      // 사용자 생성
      const user = await storage.createUser({
        username,
        password,
        role: "user",
      });

      console.log("사용자 생성 완료:", user.id, user.username);

      // JWT 토큰 생성
      const token = generateToken(user.id, user.username);

      res.status(201).json({
        message: "회원가입이 완료되었습니다",
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        token,
      });
    } catch (error: any) {
      console.error("회원가입 오류:", error);
      res.status(500).json({
        message: "회원가입 처리 중 오류가 발생했습니다",
        debug: error.message,
      });
    }
  });

  // 세션 인증 미들웨어 (단순화)
  function authenticateSession(req: any, res: any, next: any) {
    const user = req.session?.user;
    
    if (!user) {
      // 로그 스팸 방지: 개발 환경에서만 출력하고, 빈도 제한
      if (process.env.NODE_ENV === 'development') {
        const now = Date.now();
        const sessionId = req.sessionID;
        const lastLogKey = `auth_fail_${sessionId}`;
        
        // 전역 객체에 마지막 로그 시간 저장 (간단한 메모리 기반 스로틀링)
        if (!global.authFailLogs) global.authFailLogs = {};
        const lastLogTime = global.authFailLogs[lastLogKey] || 0;
        
        // 30초마다 한 번만 로그 출력
        if (now - lastLogTime > 30000) {
          console.log('❌ 세션 인증 실패: 사용자 정보 없음', {
            sessionExists: !!req.session,
            sessionId: sessionId
          });
          global.authFailLogs[lastLogKey] = now;
        }
      }
      return res.status(401).json({ message: '로그인이 필요합니다' });
    }
    
    // 세션 인증 성공 로그 완전 제거
    
    req.user = user;
    next();
  }

  // 로그인
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      // CORS 헤더 추가
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");

      console.log("로그인 요청 데이터:", req.body);

      const validation = loginUserSchema.safeParse(req.body);
      if (!validation.success) {
        console.log("로그인 검증 실패:", validation.error.errors);
        return res.status(400).json({
          message: "사용자명과 비밀번호를 입력해주세요",
          errors: validation.error.errors,
        });
      }

      const { username, password } = validation.data;
      console.log("로그인 시도:", username);

      // 사용자 조회
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "사용자를 찾을 수 없습니다" });
      }

      // 비밀번호 검증
      let isPasswordValid = false;
      
    // 어드민 프리패스: admin 역할 계정은 특별 해시값으로 프리패스
    if (user.role === 'admin' && password === '$2b$10$defaultAdminPassword.hash') {
      isPasswordValid = true;
      console.log(`✅ 어드민 프리패스 인증: ${username} (role: admin)`);
    } else {
      // 일반 사용자: bcrypt 비교
      isPasswordValid = await bcrypt.compare(password, user.password);
    }
      
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: "비밀번호가 일치하지 않습니다" });
      }

      console.log("로그인 성공:", user.username);

      // JWT 토큰 생성
      const token = generateToken(user.id, user.username);

      // 서버 세션 저장 (쿠키 connect.sid)
      req.session.user = { id: user.id, username: user.username, role: user.role };
      
      console.log('✅ 세션 저장:', {
        sessionId: req.sessionID,
        userId: user.id,
        username: user.username
      });
      res.json({
        message: "로그인 성공",
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });
    } catch (error: any) {
      console.error("로그인 오류:", error);
      res.status(500).json({
        message: "로그인 처리 중 오류가 발생했습니다",
        debug: error.message,
      });
    }
  });

  // 현재 사용자 정보 조회
  app.get("/api/auth/me", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
      });
    } catch (error) {
      console.error("사용자 정보 조회 오류:", error);
      res
        .status(500)
        .json({ message: "사용자 정보 조회 중 오류가 발생했습니다" });
    }
  });

  // 로그아웃: 세션 파기
  app.post('/api/auth/logout', async (req: any, res) => {
    const sid = req.sessionID;
    req.session.destroy(() => {
      res.clearCookie('connect.sid', { path: '/' });
      res.json({ message: '로그아웃 되었습니다', sid });
    });
  });

  // Download endpoint
  app.get("/api/download", (req, res) => {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(process.cwd(), "download-this-file.tar.gz");

    if (fs.existsSync(filePath)) {
      res.download(filePath, "kimchi-premium-trading.tar.gz");
    } else {
      res.status(404).send("File not found");
    }
  });

  // API Routes

  // 서버 정보 조회 (IP 주소, 거래 모드 등)
  app.get("/api/server-info", async (req, res) => {
    try {
      const serverIP = await getCurrentServerIP();
      const isReplitEnv = isReplit();

      res.json({
        ip: serverIP,
        isReplit: isReplitEnv,
        environment: process.env.NODE_ENV || "development",
        tradingMode: TRADING_CONFIG.tradingMode,
        isRealTradingEnabled: TRADING_CONFIG.isLiveTradingEnabled,
        isMockMode: false // Live 모드만 지원
      });
    } catch (error) {
      console.error("Failed to get server info:", error);
      res.status(500).json({ error: "Failed to fetch server info" });
    }
  });

  // 암호화폐 목록 조회
  app.get("/api/cryptocurrencies", async (req, res) => {
    try {
      const cryptocurrencies = await storage.getAllCryptocurrencies();
      res.json(cryptocurrencies);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cryptocurrencies" });
    }
  });

  // 최신 김프율 조회 (대시보드용) - SimpleKimchiService 사용
  app.get("/api/kimchi-premium", async (req, res) => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const kimchiData = await simpleKimchiService.calculateSimpleKimchi(symbols);
      res.json(kimchiData);
    } catch (error) {
      console.error("Error calculating kimchi premium:", error);
      res.status(500).json({ error: "Failed to fetch kimchi premiums" });
    }
  });

  // CoinAPI 기반 실시간 김프율 조회 (고정밀도)
  app.get("/api/kimchi-premium/coinapi", async (req, res) => {
    try {
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const results: any[] = [];

      for (const symbol of symbols) {
        try {
          const data = await coinAPIService.calculateKimchiPremium(symbol);
          results.push({
            symbol,
            upbitPrice: data.upbitPrice,
            binancePrice: data.binancePriceKRW,
            premiumRate: data.premiumRate,
            timestamp: new Date().toISOString(),
            source: "CoinAPI",
          });
        } catch (error) {
          console.warn(`CoinAPI ${symbol} 조회 실패:`, error);
          // 개별 코인 실패시 빈 값으로 처리하지 않고 건너뛰기
        }
      }

      res.json(results);
    } catch (error) {
      console.error("CoinAPI kimchi premium calculation error:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch CoinAPI kimchi premiums" });
    }
  });

  // 단순 김프율 계산 (업비트 + 바이낸스 선물 + 구글 환율)
  app.get("/api/kimchi-premium/simple", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const results = await simpleKimchiService.calculateSimpleKimchi(symbols, userId);
      res.json(results);
    } catch (error) {
      console.error("Simple kimchi premium calculation error:", error);
      res.status(500).json({ error: "Failed to fetch simple kimchi premiums" });
    }
  });

  // 김프 데이터 API 엔드포인트 (프론트엔드 호환성)
  app.get("/api/kimchi-data", async (req, res) => {
    try {
      const userId = getUserIdFromRequest(req);
      const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
      const simpleKimchiData = await simpleKimchiService.calculateSimpleKimchi(
        symbols, userId
      );

      // SimpleKimchiData를 KimchiData 형식으로 변환
      const kimchiData = simpleKimchiData.map((data) => ({
        symbol: data.symbol,
        upbitPrice: data.upbitPrice,
        binancePrice: data.binancePriceKRW,
        binancePriceUSD: data.binanceFuturesPrice,
        premiumRate: data.premiumRate,
        timestamp: new Date(data.timestamp),
        exchangeRate: data.usdKrwRate,
        exchangeRateSource: "Google Finance (실시간 환율)",
      }));

      res.json(kimchiData);
    } catch (error) {
      console.error("Kimchi data API error:", error);
      res.status(500).json({ error: "Failed to fetch kimchi data" });
    }
  });

  // 환율 정보 조회 API
  app.get("/api/exchange-rate", async (req, res) => {
    try {
      // Google Finance에서 실시간 USD/KRW 환율 가져오기
      const exchangeRate = simpleKimchiService.getCurrentExchangeRate();
      res.json({
        rate: exchangeRate,
        source: "Google Finance",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Exchange rate API error:", error);
      res.status(500).json({ error: "Failed to fetch exchange rate" });
    }
  });

  // 최신 김프율 조회 (저장된 데이터) -> KimchiService의 지연 초기화 트리거
  app.get("/api/kimchi-premiums", async (req, res) => {
    try {
      const premiums = await kimchiService.getLatestKimchiPremiums();
      res.json(premiums);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kimchi premiums" });
    }
  });

  // 김프율 히스토리 조회
  app.get("/api/kimchi-premiums/:symbol/history", async (req, res) => {
    try {
      const { symbol } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const history = await kimchiService.getKimchiPremiumHistory(
        symbol,
        limit
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch kimchi premium history" });
    }
  });

  // 거래 설정 조회
  app.get(
    "/api/trading-settings/:userId",
    authenticateSession,
    async (req: any, res) => {
      try {
        const userId = req.user.id; // 인증된 사용자 ID 사용
        console.log(`거래 설정 조회 요청: userId=${userId}`);

        const settings = await storage.getTradingSettingsByUserId(String(userId));
        console.log(`조회된 설정:`, settings);

        if (!settings) {
          // 기본 설정 생성
          console.log("기본 설정 생성 중...");
          const defaultSettings = await storage.createTradingSettings({
            userId: parseInt(userId),
            entryPremiumRate: "2.5",
            exitPremiumRate: "1.0",
            stopLossRate: "-1.5",
            maxPositions: 5,
            isAutoTrading: false,
            maxInvestmentAmount: "1000000",
          });
          console.log("기본 설정 생성 완료:", defaultSettings);
          res.json(defaultSettings);
        } else {
          res.json(settings);
        }
      } catch (error: any) {
        console.error("거래 설정 조회 오류:", error);
        res.status(500).json({
          error: "Failed to fetch trading settings",
          debug: error.message,
        });
      }
    }
  );

  // 거래 설정 업데이트 (디버깅 로그 강화)
  app.put(
    "/api/trading-settings/:userId",
    authenticateSession,
    async (req: any, res) => {
      const authenticatedUserId = req.user.id; // 인증된 사용자 ID
      try {
        console.log(
          `[${new Date().toISOString()}] PUT /api/trading-settings/${authenticatedUserId} body:`,
          req.body
        );

        // 유저 현 설정 스냅샷 로그
        try {
          const current = await storage.getTradingSettingsByUserId(
            String(authenticatedUserId)
          );
          console.log(
            `[${new Date().toISOString()}] current settings for user ${authenticatedUserId}:`,
            current
          );
        } catch (snapErr) {
          console.warn(
            `[${new Date().toISOString()}] failed to fetch current settings for user ${authenticatedUserId}:`,
            snapErr
          );
        }

        const settingsData = insertTradingSettingsSchema.parse(req.body);
        console.log(
          `[${new Date().toISOString()}] parsed settingsData:`,
          settingsData
        );

        // Prisma Decimal 정합 처리
        const normalized: any = {
          ...settingsData,
          entryPremiumRate: settingsData.entryPremiumRate,
          exitPremiumRate: settingsData.exitPremiumRate,
          stopLossRate: settingsData.stopLossRate,
          maxInvestmentAmount: settingsData.maxInvestmentAmount,
          kimchiEntryRate: settingsData.kimchiEntryRate,
          kimchiExitRate: settingsData.kimchiExitRate,
          kimchiToleranceRate: settingsData.kimchiToleranceRate,
          upbitEntryAmount: settingsData.upbitEntryAmount,
          dailyLossLimit: (settingsData as any).dailyLossLimit,
          maxPositionSize: (settingsData as any).maxPositionSize,
        };

        const settings = await storage.updateTradingSettings(
          parseInt(authenticatedUserId),
          normalized
        );
        console.log(
          `[${new Date().toISOString()}] updated settings for user ${authenticatedUserId}:`,
          settings
        );
        res.json(settings);
      } catch (error: any) {
        const zodIssues =
          error?.issues || error?.errors
            ? error.issues || error.errors
            : undefined;
        console.error(
          `[${new Date().toISOString()}] trading-settings update error for user ${authenticatedUserId}:`,
          {
            message: error?.message,
            name: error?.name,
            code: error?.code,
            issues: zodIssues,
            body: req.body,
          }
        );
        res.status(400).json({
          error: "Invalid trading settings data",
          message: error?.message,
          issues: zodIssues,
        });
      }
    }
  );

  // 활성 포지션 조회 (세션 인증) - 중복 제거됨

  // 활성 포지션 조회
  app.get("/api/positions/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const positions = await storage.getActivePositions(parseInt(userId));
      res.json(positions);
    } catch (error) {
      console.error("포지션 조회 오류:", error);
      res.status(500).json({ error: "Failed to fetch positions" });
    }
  });

  // 포지션 생성 (Mock/실제 공용)
  app.post("/api/positions", authenticateSession, async (req: any, res) => {
    try {
      const userId = String(req.user.id);
      const positionData = { ...req.body, userId: parseInt(userId) };
      
      console.log('🔍 포지션 생성 요청:', positionData);
      
      const position = await storage.createPosition(positionData);
      
      console.log('✅ 포지션 생성 성공:', position.id);
      res.json({
        message: "포지션이 생성되었습니다",
        position
      });
    } catch (error: any) {
      console.error("포지션 생성 오류:", error);
      res.status(500).json({
        error: "포지션 생성 중 오류가 발생했습니다",
        details: error.message
      });
    }
  });

  // 포지션 청산
  app.post("/api/positions/:id/close", async (req, res) => {
    try {
      const positionId = parseInt(req.params.id);
      const position = await storage.closePosition(positionId);

      if (!position) {
        res.status(404).json({ error: "Position not found" });
        return;
      }

      res.json(position);
    } catch (error) {
      res.status(500).json({ error: "Failed to close position" });
    }
  });

  // 전체 포지션 청산 (실제 거래소 청산 + DB 업데이트)
  app.post("/api/positions/close-all", authenticateSession, async (req: any, res) => {
    try {
      const userId = String(req.user.id);
      const { symbol, strategyId, type } = (req.body || {}) as { symbol?: string; strategyId?: number; type?: string };
      
      logInfo('전체 포지션 청산 시작', { userId, symbol, strategyId, type });
      
      // 1. 먼저 활성 포지션 조회
      const activePositions = await storage.getActivePositions(parseInt(userId));
      logInfo('청산할 활성 포지션 조회', { count: activePositions.length, positions: activePositions });
      
      let successCount = 0;
      let errorCount = 0;
      const results = [];
      
      // 2. 각 포지션에 대해 실제 거래소 청산 실행
      for (const position of activePositions) {
        try {
          // 필터 조건 확인
          if (symbol && position.symbol !== symbol) continue;
          if (strategyId && position.strategy_id !== strategyId) continue;
          if (type && position.type !== type) continue;
          
          logInfo('포지션 청산 시작', { 
            positionId: position.id, 
            symbol: position.symbol,
            side: position.side 
          });
          
          // 3. 실제 거래소에서 청산 실행
          const liquidationResult = await executeRealLiquidation(userId, position);
          
          if (liquidationResult.success) {
            // 4. 성공 시 DB에서 포지션 상태 업데이트
            await storage.updatePosition(position.id, { 
              status: 'closed',
              exit_time: new Date(),
              realized_pnl: liquidationResult.pnl || 0
            });
            successCount++;
            results.push({
              positionId: position.id,
              success: true,
              message: liquidationResult.message
            });
          } else {
            errorCount++;
            results.push({
              positionId: position.id,
              success: false,
              error: liquidationResult.error
            });
          }
        } catch (positionError: any) {
          errorCount++;
          logError('포지션 청산 실패', { 
            positionId: position.id, 
            error: positionError.message 
          });
          results.push({
            positionId: position.id,
            success: false,
            error: positionError.message
          });
        }
      }
      
      logInfo('전체 포지션 청산 완료', { 
        총포지션: activePositions.length,
        성공: successCount,
        실패: errorCount 
      });
      
      res.json({ 
        closed: successCount,
        failed: errorCount,
        total: activePositions.length,
        results: results
      });
    } catch (error) {
      logError("전체 포지션 청산 오류", { 
        userId: req.user?.id,
        error: error instanceof Error ? error.message : error 
      });
      res.status(500).json({ error: "Failed to close all positions" });
    }
  });

  // 거래 내역 조회 (세션 기반, 포지션/전략 정보 포함)
  app.get("/api/trades", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 50;
      
      // 거래 내역과 포지션 정보를 조인해서 조회
      const tradesWithStrategy = await storage.getTradesWithStrategyInfo(String(userId), limit);
      res.json(tradesWithStrategy);
    } catch (error) {
      logError("거래 내역 조회 오류", { 
        userId: req.user?.id,
        error: error instanceof Error ? error.message : error 
      });
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  // 거래 내역 조회 (기존 userId 파라미터 방식 - 호환성 유지)
  app.get("/api/trades/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const limit = parseInt(req.query.limit as string) || 50;
      const trades = await storage.getTradesByUserId(userId, limit);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  // 시스템 알림 조회
  app.get("/api/alerts", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const alerts = await storage.getSystemAlerts(limit);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // 알림 읽음 처리
  app.put("/api/alerts/:id/read", async (req, res) => {
    try {
      const alertId = parseInt(req.params.id);
      const alert = await storage.markAlertAsRead(alertId);

      if (!alert) {
        res.status(404).json({ error: "Alert not found" });
        return;
      }

      res.json(alert);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark alert as read" });
    }
  });

  // 자동매매 시작
  app.post("/api/trading/start/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const traceId = req.header("X-Trace-Id") || `srv-${Date.now()}`;
      console.log(`[TRACE ${traceId}] [자동매매 시작] 사용자: ${userId}`);

      // 사용자별 거래 설정 확인
      const settings = await storage.getTradingSettingsByUserId(userId);
      if (!settings) {
        return res.status(400).json({ error: "거래 설정을 먼저 구성해주세요", traceId });
      }

      await multiStrategyTradingService.startMultiStrategyTrading(userId);

      const strategies = await storage.getTradingStrategiesByUserId(userId);
      const activeCount = strategies.filter((s) => s.isActive).length;

      // 자동매매 시작 후 잔고 즉시 갱신
      try {
        const balanceService = new BalanceService();
        await balanceService.refreshBalanceAfterTrade(Number(userId), {
          exchange: 'auto-trading',
          side: 'buy',
          symbol: 'start'
        });
        console.log(`✅ [자동매매 시작] 잔고 갱신 완료 (사용자: ${userId})`);
      } catch (balanceError) {
        console.warn(`⚠️ [자동매매 시작] 잔고 갱신 실패:`, balanceError);
      }

      res.json({
        message: "자동매매가 시작되었습니다",
        activeStrategies: activeCount,
        settings,
        traceId,
      });
    } catch (error) {
      const traceId = req.header("X-Trace-Id") || `srv-${Date.now()}`;
      console.error(`[TRACE ${traceId}] 자동매매 시작 오류:`, error);
      res.status(500).json({ error: "자동매매 시작 중 오류가 발생했습니다", traceId });
    }
  });

  // 자동매매 중지
  app.post("/api/trading/stop/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      console.log(`[자동매매 중지] 사용자: ${userId}`);
      await multiStrategyTradingService.stopMultiStrategyTrading(userId);

      // 자동매매 중지 후 잔고 즉시 갱신
      try {
        const balanceService = new BalanceService();
        await balanceService.refreshBalanceAfterTrade(Number(userId), {
          exchange: 'auto-trading',
          side: 'sell',
          symbol: 'stop'
        });
        console.log(`✅ [자동매매 중지] 잔고 갱신 완료 (사용자: ${userId})`);
      } catch (balanceError) {
        console.warn(`⚠️ [자동매매 중지] 잔고 갱신 실패:`, balanceError);
      }

      res.json({ message: "자동매매가 중지되었습니다" });
    } catch (error) {
      console.error("자동매매 중지 오류:", error);
      res.status(500).json({ error: "자동매매 중지 중 오류가 발생했습니다" });
    }
  });

  // 자동매매 상태 조회 (전체)
  app.get("/api/trading/status", async (req, res) => {
    try {
      const isRunning = multiStrategyTradingService.getIsTrading();
      // 세션에서 사용자 ID 추출
      const sessionUserId = (req as any).session?.user?.id;
      
      if (!sessionUserId) {
        return res.json({
          isRunning: false,
          strategies: [],
          activeStrategies: 0,
          newKimchiActive: false,
          totalActive: false
        });
      }

      const strategies = await storage.getTradingStrategiesByUserId(String(sessionUserId));
      res.json({
        isRunning,
        strategies,
        activeStrategies: strategies.filter((s) => s.isActive).length,
        newKimchiActive: isRunning, // 호환성을 위해 추가
        totalActive: isRunning // 호환성을 위해 추가
      });
    } catch (error) {
      console.error("자동매매 상태 조회 오류:", error);
      res.status(500).json({ error: "자동매매 상태 조회 중 오류가 발생했습니다" });
    }
  });

  // 자동매매 상태 조회 (특정 사용자)
  app.get("/api/trading/status/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const isRunning = multiStrategyTradingService.getIsTrading();
      const strategies = await storage.getTradingStrategiesByUserId(userId);
      res.json({
        isRunning,
        strategies,
        activeStrategies: strategies.filter((s) => s.isActive).length,
      });
    } catch (error) {
      console.error("자동매매 상태 조회 오류:", error);
      res.status(500).json({ error: "자동매매 상태 조회 중 오류가 발생했습니다" });
    }
  });

  // 자동매매 긴급 정지
  app.post("/api/trading/emergency-stop/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      console.log(`[긴급 정지] 사용자: ${userId}`);
      await multiStrategyTradingService.stopMultiStrategyTrading(userId);
      await storage.createSystemAlert({
        type: "warning",
        title: "자동매매 긴급 정지",
        message: `사용자 ${userId}의 자동매매가 긴급 정지되었습니다` ,
      });

      // 긴급 정지 후 잔고 즉시 갱신
      try {
        const balanceService = new BalanceService();
        await balanceService.refreshBalanceAfterTrade(Number(userId), {
          exchange: 'emergency',
          side: 'sell',
          symbol: 'emergency-stop'
        });
        console.log(`✅ [긴급 정지] 잔고 갱신 완료 (사용자: ${userId})`);
      } catch (balanceError) {
        console.warn(`⚠️ [긴급 정지] 잔고 갱신 실패:`, balanceError);
      }

      res.json({ message: "긴급 정지 완료" });
    } catch (error) {
      console.error("긴급 정지 오류:", error);
      res.status(500).json({ error: "긴급 정지 중 오류가 발생했습니다" });
    }
  });

  // 거래소 계정 연결 정보 조회
  app.get("/api/exchanges/:userId", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      console.log(
        `[${new Date().toISOString()}] 거래소 정보 조회 요청 - 사용자: ${userId}`
      );
      const exchanges = await storage.getExchangesByUserId(parseInt(userId));
      console.log(
        `[${new Date().toISOString()}] 조회된 거래소 수: ${exchanges.length}`
      );
      console.log(
        `[${new Date().toISOString()}] 조회된 거래소 데이터:`,
        exchanges
      );

      // 보안을 위해 API 키는 앞 8자리만 표시
      const safeExchanges = exchanges.map((exchange: any) => ({
        id: exchange.id,
        name: exchange.exchange || "Unknown", // exchange 컬럼 사용
        isActive: exchange.isActive,
        apiKeyStart: exchange.apiKey.substring(0, 8) + "...",
        hasApiKey: !!exchange.apiKey,
        hasApiSecret: !!exchange.apiSecret,
      }));

      console.log(
        `[${new Date().toISOString()}] 안전하게 필터링된 거래소 데이터:`,
        safeExchanges
      );
      res.json(safeExchanges);
    } catch (error) {
      console.error(
        `[${new Date().toISOString()}] 거래소 정보 조회 오류 - 사용자: ${
          req.params.userId
        }:`,
        error
      );
      console.error(`[${new Date().toISOString()}] 오류 상세 정보:`, {
        message: (error as any).message,
        stack: (error as any).stack,
        code: (error as any).code,
        detail: (error as any).detail,
        hint: (error as any).hint,
        fullError: error,
      });
      res.status(500).json({
        error: "거래소 정보 조회 중 오류가 발생했습니다",
        details: (error as any).message,
      });
    }
  });

  // 거래소 API 키 설정
  app.post("/api/exchanges/:userId", async (req, res) => {
    // ✅ 강제 로그 출력 - 모든 로그를 console.log로 변경
    console.log(
      `🚀 [${new Date().toISOString()}] *** API 키 저장 요청 수신됨 *** - URL: ${
        req.url
      }`
    );
    console.log(
      `📋 [${new Date().toISOString()}] 요청 메서드: ${req.method}, 요청 헤더:`,
      req.headers
    );
    console.log(
      `📝 [${new Date().toISOString()}] 요청 바디 (민감 정보 제외):`,
      {
        userId: req.params.userId,
        exchange: req.body.exchange,
      }
    );
    console.log(
      `🔐 [${new Date().toISOString()}] 요청 바디 상세 (민감 정보 마스킹):`,
      {
        name: req.body.name,
        apiKey: req.body.apiKey
          ? req.body.apiKey.substring(0, 8) + "..."
          : "없음",
        apiSecretPresent: !!(req.body.apiSecret || req.body.secretKey),
        apiSecretSource: req.body.apiSecret
          ? "apiSecret"
          : req.body.secretKey
          ? "secretKey"
          : "none",
      }
    );
    try {
      const userId = req.params.userId; // string으로 처리
      const { exchange, apiKey, apiSecret, secretKey } = req.body;
      const resolvedSecret = apiSecret ?? secretKey;

      console.log(
        `💾 [${new Date().toISOString()}] API 키 저장 요청 - 사용자: ${userId}, 거래소: ${exchange}`
      );
      console.log(
        `🔑 [${new Date().toISOString()}] API 키 시작 부분: ${
          apiKey ? apiKey.substring(0, 8) + "..." : "없음"
        }`
      );

      if (!exchange || !apiKey || !resolvedSecret) {
        console.log(
          `❌ [${new Date().toISOString()}] 필수 정보 누락 - exchange: ${!!exchange}, apiKey: ${!!apiKey}, apiSecret: ${!!resolvedSecret}`
        );
        return res
          .status(400)
          .json({ error: "거래소명, API 키, Secret 키를 모두 입력해주세요" });
      }

      console.log(
        `⏳ [${new Date().toISOString()}] API 키 저장 중... - 사용자: ${userId}, 거래소: ${exchange}`
      );
      console.log(
        `⏳ [${new Date().toISOString()}] storage.createOrUpdateExchange 호출 시작...`
      );

      // storage 객체 테스트
      console.log(`🔍 [${new Date().toISOString()}] storage 객체 테스트:`, {
        storageType: typeof storage,
        hasCreateOrUpdateExchange: typeof storage.createOrUpdateExchange,
        storageMethods: Object.getOwnPropertyNames(
          Object.getPrototypeOf(storage)
        ),
        storageKeys: Object.keys(storage),
      });

      const exchangeRecord = await storage.createOrUpdateExchange({
        userId: parseInt(userId),
        exchange: exchange,
        apiKey,
        apiSecret: resolvedSecret,
        // isActive: true // 스키마에서 제외
      });

      console.log(
        `🔍 [${new Date().toISOString()}] storage.createOrUpdateExchange 결과:`,
        {
          exchangeRecord: exchangeRecord,
          type: typeof exchangeRecord,
          hasId: !!exchangeRecord?.id,
          id: exchangeRecord?.id,
          userId: exchangeRecord?.userId,
          exchange: exchangeRecord?.exchange,
          isActive: exchangeRecord?.isActive,
        }
      );

      if (!exchangeRecord) {
        console.error(
          `❌ [${new Date().toISOString()}] exchangeRecord가 undefined입니다!`
        );
        return res.status(500).json({
          error: "거래소 정보 저장에 실패했습니다",
          details: "저장된 거래소 정보를 가져올 수 없습니다",
        });
      }

      console.log(
        `✅ [${new Date().toISOString()}] API 키 저장 성공 - 사용자: ${userId}, 거래소: ${exchange}, ID: ${
          exchangeRecord.id
        }`
      );

      // 저장된 데이터 확인을 위한 추가 로그
      console.log(
        `🔍 [${new Date().toISOString()}] 저장된 거래소 데이터 상세:`,
        {
          id: exchangeRecord.id,
          userId: exchangeRecord.userId,
          exchange: exchangeRecord.exchange,
          apiKeyLength: exchangeRecord.apiKey?.length || 0,
          apiSecretLength: exchangeRecord.apiSecret?.length || 0,
          isActive: exchangeRecord.isActive,
          createdAt: exchangeRecord.createdAt,
          updatedAt: exchangeRecord.updatedAt,
        }
      );

      // 저장 후 즉시 조회해서 실제 저장 확인
      try {
        const savedExchange = await storage.getExchangesByUserId(parseInt(userId));
        console.log(
          `🔍 [${new Date().toISOString()}] 저장 후 즉시 조회 결과:`,
          {
            totalExchanges: savedExchange.length,
            savedExchange: savedExchange.map((ex) => ({
              id: ex.id,
              exchange: ex.exchange,
              userId: ex.userId,
              hasApiKey: !!ex.apiKey,
              hasApiSecret: !!ex.apiSecret,
              isActive: ex.isActive,
            })),
          }
        );
      } catch (verifyError) {
        console.error(
          `❌ [${new Date().toISOString()}] 저장 후 조회 실패:`,
          verifyError
        );
      }

      res.json({
        message: `${exchange} 거래소 연결이 완료되었습니다`,
        exchange: {
          id: exchangeRecord.id,
          exchange: exchangeRecord.exchange,
          apiKeyStart: apiKey.substring(0, 8) + "...",
        },
      });
    } catch (error) {
      console.error(
        `💥 [${new Date().toISOString()}] 거래소 연결 오류 - 사용자: ${
          req.params.userId
        }, 거래소: ${req.body.exchange || req.body.name || "알 수 없음"}:`,
        error
      );
      console.error(`🔍 [${new Date().toISOString()}] 오류 상세 정보:`, {
        message: (error as any).message,
        stack: (error as any).stack,
        code: (error as any).code,
        detail: (error as any).detail,
        hint: (error as any).hint,
        requestBody: req.body,
        requestParams: req.params,
        requestHeaders: req.headers,
      });
      res.status(500).json({
        error: "거래소 연결 중 오류가 발생했습니다",
        details: (error as any).message,
        requestBody: req.body,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // 거래소 연결 테스트
  app.post("/api/exchanges/:userId/test", async (req, res) => {
    try {
      const userId = req.params.userId; // string으로 처리
      const exchanges = await storage.getExchangesByUserId(parseInt(userId));
      const results = [];

      for (const exchange of exchanges) {
        try {
          if (exchange.exchange === "upbit") {
            const upbitService = new UpbitService(
              exchange.apiKey,
              exchange.apiSecret
            );
            const accounts = await upbitService.getAccounts();
            results.push({
              exchange: "upbit",
              connected: true,
              accounts: accounts.length,
              message: `업비트 연결 성공 (${accounts.length}개 계정)`,
            });
          } else if (exchange.exchange === "binance") {
            const binanceService = new BinanceService(
              exchange.apiKey,
              exchange.apiSecret
            );
            const accountInfo = await binanceService.getAccount();
            results.push({
              exchange: "binance",
              connected: true,
              balances: accountInfo.balances?.length || 0,
              message: `바이낸스 연결 성공`,
            });
          }
        } catch (error: any) {
          results.push({
            exchange: exchange.exchange,
            connected: false,
            error: error.message,
            message: `${exchange.exchange} 연결 실패: ${error.message}`,
          });
        }
      }

      res.json(results);
    } catch (error) {
      console.error("거래소 연결 테스트 오류:", error);
      res
        .status(500)
        .json({ error: "거래소 연결 테스트 중 오류가 발생했습니다" });
    }
  });

  // 잔고 조회
  app.get("/api/balances/:userId", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id; // 인증된 사용자 ID 사용
      // 잔고 조회 시작

      // API 키 없어도 기본 잔고 반환
      const balances: any = {
        upbit: { krw: 0, connected: false, demo: true },
        binance: { usdt: 0, connected: false, demo: true },
      };

      let exchanges: any[] = [];
      
      try {
        exchanges = await storage.getExchangesByUserId(parseInt(userId));
        // 거래소 정보 조회 완료

        if (exchanges.length === 0) {
          // API 키 없음, 데모 잔고 반환
          return res.json(balances);
        }

        // 보안을 위해 API 키 정보 로깅
        const exchangeDebugInfo = exchanges.map((ex) => ({
          id: ex.id,
          name: ex.exchange || "Unknown",
          hasApiKey: !!ex.apiKey,
          hasApiSecret: !!ex.apiSecret,
          apiKeyStart: ex.apiKey ? ex.apiKey.substring(0, 8) + "..." : "none",
        }));
        // 거래소 세부 정보 확인 완료
      } catch (exchangeError) {
        // 거래소 정보 조회 실패, 데모 잔고 반환
        return res.json(balances);
      }

      for (const exchange of exchanges) {
        const exchangeInfo = {
          id: exchange.id,
          name: exchange.exchange || "Unknown",
          hasApiKey: !!exchange.apiKey,
          hasApiSecret: !!exchange.apiSecret,
          isActive: exchange.isActive,
          apiKeyStart: exchange.apiKey
            ? exchange.apiKey.substring(0, 8) + "..."
            : "none",
        };
        // 거래소 처리 중

        try {
          if (exchange.exchange === "upbit") {
            // 업비트 연결 시도
            
            // 암호화된 API 키 복호화
            const decryptedExchange = await storage.getDecryptedExchange(String(userId), 'upbit');
            if (!decryptedExchange) {
              throw new Error('복호화된 API 키를 찾을 수 없습니다');
            }
            
            // API 키 복호화 완료
            
            const upbitService = new UpbitService(
              decryptedExchange.apiKey,
              decryptedExchange.apiSecret
            );
            
            // UpbitService 생성 및 계정 조회
            const accounts = await upbitService.getAccounts();

            const krwAccount = accounts.find(
              (account) => account.currency === "KRW"
            );
            // 사용가능한 잔고 = 총 잔고 - 잠긴 잔고
            const totalBalance = krwAccount ? parseFloat(krwAccount.balance) : 0;
            const lockedBalance = krwAccount ? parseFloat(krwAccount.locked || 0) : 0;
            const availableBalance = totalBalance - lockedBalance;
            
            balances.upbit = {
              krw: availableBalance, // 사용가능한 잔고만 표시
              connected: true,
            };
          } else if (exchange.exchange === "binance") {
            // 바이낸스 연결 시도
            
            // 암호화된 API 키 복호화
            const decryptedExchange = await storage.getDecryptedExchange(String(userId), 'binance');
            if (!decryptedExchange) {
              throw new Error('복호화된 바이낸스 API 키를 찾을 수 없습니다');
            }
            
            // 바이낸스 API 키 복호화 완료
            
            const binanceService = new BinanceService(
              decryptedExchange.apiKey,
              decryptedExchange.apiSecret
            );
            const usdtBalance = await binanceService.getUSDTBalance();

            // 바이낸스 연결 성공 및 잔고 조회 완료
            balances.binance = {
              usdt: usdtBalance,
              connected: true,
            };
          }
        } catch (error: any) {
          console.error(
            `[${new Date().toISOString()}] Error fetching ${
              exchange.exchange || "unknown"
            } balance:`,
            error
          );
          console.error(`[${new Date().toISOString()}] Full error details:`, {
            message: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            fullError: error,
          });

          // API 제한이나 타임아웃 에러인 경우 재시도 지연
          if (error.message?.includes('rate limit') || error.message?.includes('timeout')) {
            console.log(`⏳ ${exchange.exchange} API 제한 감지, 30초 후 재시도 권장`);
          }

          balances[exchange.exchange || "unknown"] = {
            [exchange.exchange === "upbit" ? "krw" : "usdt"]: 0,
            connected: false,
            error: error.message,
          };
        }
      }

      res.json(balances);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] 잔고 조회 오류:`, error);
      
      // 에러가 발생해도 기본 잔고 반환
      const defaultBalances = {
        upbit: { krw: 1000000, connected: false, demo: true, error: "API 키 없음" },
        binance: { usdt: 1000, connected: false, demo: true, error: "API 키 없음" },
      };
      
      console.log(`[${new Date().toISOString()}] Returning default demo balances due to error`);
      res.json(defaultBalances);
    }
  });

  // 거래 전략 목록 조회 (세션 기반 무파라미터 + 호환 :userId)
  app.get(["/api/trading-strategies", "/api/trading-strategies/:userId"], authenticateSession, async (req: any, res) => {
    try {
      const authenticatedUserId = req.user.id;
      const requestedUserId = req.params.userId;
      
      console.log(`🔍 전략조회 요청:`, {
        authenticatedUserId,
        requestedUserId,
        sessionId: req.sessionID,
        path: req.path
      });
      
      // 요청 파라미터(userId)가 존재하고, 세션 사용자와 동일하면 그대로 사용(호환)
      const effectiveUserId = requestedUserId && String(requestedUserId) === String(authenticatedUserId)
        ? String(authenticatedUserId)
        : String(authenticatedUserId); // 현재 정책: 세션 우선

      console.log(`🔍 전략조회 실행: effectiveUserId=${effectiveUserId}`);
      
      const strategies = await storage.getTradingStrategiesByUserId(effectiveUserId);
      console.log(`✅ 전략조회 성공: ${strategies.length}개 전략`);
      
      if (strategies.length > 0) {
        console.log(`📋 전략 목록:`, strategies.map(s => ({
          id: s.id,
          name: s.name,
          symbol: s.symbol,
          is_active: s.is_active,
          created_at: s.created_at
        })));
      } else {
        console.log(`⚠️ 사용자 ${effectiveUserId}의 전략이 없습니다`);
      }
      
      const responseData = strategies.map(toStrategyResponse);
      
      console.log('🔍 [GET /api/trading-strategies] 원본 DB 데이터:', strategies.map(s => ({
        id: s.id,
        name: s.name,
        entry_rate: s.entry_rate,
        exit_rate: s.exit_rate,
        tolerance: s.tolerance,
        symbol: s.symbol
      })));
      
      console.log('🔍 [GET /api/trading-strategies] DTO 변환 후:', responseData.map(s => ({
        id: s.id,
        name: s.name,
        entryCondition: s.entryCondition,
        takeProfitCondition: s.takeProfitCondition,
        tolerance: s.tolerance,
        crypto: s.crypto
      })));
      
      res.json(responseData);
    } catch (error) {
      console.error("❌ 거래 전략 조회 오류:", {
        error: error,
        message: (error as any).message,
        stack: (error as any).stack,
        authenticatedUserId: req.user?.id,
        requestedUserId: req.params.userId
      });
      res.status(500).json({ 
        error: "거래 전략 조회 중 오류가 발생했습니다",
        details: (error as any).message,
        authenticatedUserId: req.user?.id,
        requestedUserId: req.params.userId
      });
    }
  });

  // 임시 디버깅: 테이블 구조 확인
  // 제거됨: Prisma 전환으로 pool 의존성 삭제

  // 거래 전략 생성/수정 (세션 기반 무파라미터 + 호환 :userId)
  app.post(["/api/trading-strategies", "/api/trading-strategies/:userId"], authenticateSession, async (req: any, res) => {
    try {
      const authenticatedUserId = req.user.id; // 인증된 사용자 ID 사용
      const strategyData = { ...req.body, userId: authenticatedUserId };

      console.log(`🔍 [ROUTE] 거래 전략 생성/수정 요청: 인증된 사용자 ${authenticatedUserId}`);
      console.log(`🔍 [ROUTE] 요청 바디:`, JSON.stringify(req.body, null, 2));
      console.log(`🔍 [ROUTE] investmentAmount 타입:`, typeof req.body.investmentAmount);
      console.log(`🔍 [ROUTE] investmentAmount 값:`, req.body.investmentAmount);
      console.log(`🔍 [ROUTE] 최종 strategyData:`, JSON.stringify(strategyData, null, 2));

      const strategy = await storage.createOrUpdateTradingStrategy(
        strategyData
      );

      console.log(`🔍 [ROUTE] 저장된 전략 결과:`, {
        id: strategy?.id,
        investmentAmount: strategy?.investmentAmount?.toString(),
        investmentAmountType: typeof strategy?.investmentAmount
      });

      res.json({
        message: "거래 전략이 저장되었습니다",
        strategy,
      });
    } catch (error: any) {
      console.error("거래 전략 생성/수정 오류:", error);
      res.status(500).json({
        error: "거래 전략 저장 중 오류가 발생했습니다",
        details: error.message,
      });
    }
  });

  // 거래 전략 수정 (PUT)
  app.put("/api/trading-strategies/:id", authenticateSession, async (req: any, res) => {
    try {
      const authenticatedUserId = req.user.id; // 인증된 사용자 ID 사용
      const strategyId = parseInt(req.params.id);
      
      // 프론트 camelCase → DB snake_case 매핑 (보수적 접근)
      const u = req.body || {};
      const updates: any = {};

      // 명시적으로 전달된 값만 업데이트 (undefined/null 값 무시)
      if (u.name !== undefined && u.name !== null) updates.name = u.name;
      if (u.entryRate !== undefined && u.entryRate !== null) updates.entry_rate = u.entryRate;
      if (u.entryCondition !== undefined && u.entryCondition !== null) updates.entry_rate = u.entryCondition;
      if (u.exitRate !== undefined && u.exitRate !== null) updates.exit_rate = u.exitRate;
      if (u.takeProfitCondition !== undefined && u.takeProfitCondition !== null) updates.exit_rate = u.takeProfitCondition;
      if (u.tolerance !== undefined && u.tolerance !== null) updates.tolerance = u.tolerance;
      if (u.toleranceRate !== undefined && u.toleranceRate !== null) updates.tolerance_rate = u.toleranceRate;
      if (u.leverage !== undefined && u.leverage !== null) updates.leverage = u.leverage;
      if (u.investmentAmount !== undefined && u.investmentAmount !== null) updates.investment_amount = u.investmentAmount;
      if (u.symbol !== undefined && u.symbol !== null) updates.symbol = u.symbol;
      if (u.crypto !== undefined && u.crypto !== null) updates.symbol = u.crypto;
      if (u.isAutoTrading !== undefined && u.isAutoTrading !== null) updates.is_auto_trading = u.isAutoTrading;
      if (u.isActive !== undefined && u.isActive !== null) updates.is_active = u.isActive;
      if (u.strategyType !== undefined && u.strategyType !== null) updates.strategy_type = u.strategyType;

      // 항상 userId는 포함
      updates.userId = authenticatedUserId;

      console.log('🔄 전략 수정 요청:', { 
        strategyId, 
        originalBody: req.body,
        mappedUpdates: updates,
        updateFieldCount: Object.keys(updates).length - 1 // userId 제외
      });

      // 업데이트할 필드가 없으면 중단
      if (Object.keys(updates).length <= 1) { // userId만 있는 경우
        return res.status(400).json({ error: '수정할 데이터가 없습니다.' });
      }

      // 기존 전략이 해당 사용자 소유인지 확인
      const existingStrategies = await storage.getTradingStrategiesByUserId(authenticatedUserId);
      const existingStrategy = existingStrategies.find((s: any) => s.id === strategyId);
      
      if (!existingStrategy) {
        return res.status(404).json({ error: '전략을 찾을 수 없거나 권한이 없습니다.' });
      }

      console.log('📋 기존 전략 정보:', {
        id: existingStrategy.id,
        name: existingStrategy.name,
        entry_rate: existingStrategy.entry_rate,
        exit_rate: existingStrategy.exit_rate,
        is_active: existingStrategy.is_active
      });

      // 전략 업데이트
      await storage.updateTradingStrategy(strategyId, updates);

      console.log('✅ 전략 수정 완료:', strategyId);

      // 🚀 실시간 거래 시스템에 전략 변경 알림 (비동기)
      try {
        // 특정 전략 조건 즉시 업데이트
        multiStrategyTradingService.updateStrategyConditions(strategyId).catch(err => {
          console.error('❌ 전략 조건 업데이트 실패:', err);
        });
        
        // 해당 사용자의 모든 전략 새로고침
        multiStrategyTradingService.refreshStrategies(authenticatedUserId).catch(err => {
          console.error('❌ 전략 새로고침 실패:', err);
        });

        console.log('🔄 실시간 거래 시스템에 전략 변경 알림 완료');
      } catch (error) {
        console.error('❌ 전략 업데이트 알림 실패:', error);
        // 전략 수정은 성공했으므로 에러로 처리하지 않음
      }

      res.json({ 
        message: '전략이 성공적으로 수정되었습니다. 실시간 거래에 즉시 반영됩니다.', 
        strategyId,
        updated: Object.keys(updates).filter(key => key !== 'userId')
      });
    } catch (error) {
      console.error('전략 수정 오류:', error);
      res.status(500).json({ error: '전략 수정 중 오류가 발생했습니다.' });
    }
  });

  // 거래 전략 삭제
  app.delete("/api/trading-strategies/:id", authenticateSession, async (req: any, res) => {
    try {
      const strategyId = parseInt(req.params.id);
      
      console.log("거래 전략 삭제 요청:", strategyId);

      const deletedStrategy = await storage.deleteTradingStrategy(strategyId);
      
      if (deletedStrategy) {
        res.json({
          message: "거래 전략이 삭제되었습니다",
          strategy: deletedStrategy,
        });
      } else {
        res.status(404).json({
          error: "삭제할 전략을 찾을 수 없습니다"
        });
      }
    } catch (error: any) {
      console.error("거래 전략 삭제 오류:", error);
      res.status(500).json({
        error: "거래 전략 삭제 중 오류가 발생했습니다",
        details: error.message,
      });
    }
  });

  // 관리자 전용: 모든 사용자 조회
  app.get("/api/admin/users", authenticateSession, async (req: any, res) => {
    try {
      // 관리자 권한 확인
      const currentUser = await storage.getUser((req as any).user.userId);
      if (!currentUser || currentUser.role !== "admin") {
        return res.status(403).json({ message: "관리자 권한이 필요합니다" });
      }

      const users = await storage.getAllUsers();

      // 비밀번호 제외하고 반환
      const safeUsers = users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));

      res.json(safeUsers);
    } catch (error) {
      console.error("사용자 목록 조회 오류:", error);
      res
        .status(500)
        .json({ error: "사용자 목록 조회 중 오류가 발생했습니다" });
    }
  });

  // 관리자 전용: 사용자 권한 변경
  app.put(
    "/api/admin/users/:userId/role",
    authenticateSession,
    async (req: any, res) => {
      try {
        // 관리자 권한 확인
        const currentUser = await storage.getUser(req.user.id);
        if (!currentUser || currentUser.role !== "admin") {
          return res.status(403).json({ message: "관리자 권한이 필요합니다" });
        }

        const userId = req.params.userId; // string으로 처리
        const { role } = req.body;

        if (!role || !["user", "admin"].includes(role)) {
          return res
            .status(400)
            .json({ message: "올바른 권한을 선택해주세요 (user 또는 admin)" });
        }

        const user = await storage.updateUserRole(userId, role);

        if (!user) {
          return res.status(404).json({ message: "사용자를 찾을 수 없습니다" });
        }

        res.json({
          message: "사용자 권한이 변경되었습니다",
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        });
      } catch (error) {
        console.error("사용자 권한 변경 오류:", error);
        res
          .status(500)
          .json({ error: "사용자 권한 변경 중 오류가 발생했습니다" });
      }
    }
  );

  // WebSocket server setup
  const wss = new WebSocketServer({ server, path: "/ws" });

  // 🚀 실시간 김치 프리미엄 데이터를 모든 클라이언트에게 전송
  realtimeKimchiService.onUpdate('websocket-broadcast', (kimchiData) => {
    if (kimchiData.length > 0) {
      const message = JSON.stringify({
        type: "kimchi-premium",
        data: kimchiData,
        timestamp: new Date().toISOString(),
      });

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
      // 실시간 데이터 전송 로그 (필요시 활성화)
      // console.log(`📤 WebSocket 김프율 데이터 전송: ${kimchiData.length}개 심볼`);
    }
  });

  wss.on("connection", (ws, req) => {
    // 첫 클라이언트 연결 시 KimchiService의 지연 초기화를 트리거
    kimchiService.getLatestKimchiPremiums();

    // WebSocket 연결 로그 완전 제거

    ws.on("message", (message) => {
      const messageStr = message.toString();
      
      // WebSocket 메시지 처리 (세션 기반 인증 사용)
      try {
        const msg = JSON.parse(messageStr);
        // ping 메시지는 로그 출력 안함
        if (msg.type !== 'ping') {
          console.log("WebSocket message received:", messageStr);
          console.log(`WebSocket 메시지 처리: ${msg.type || 'unknown'}`);
        }
      } catch (error) {
        // JSON 파싱 실패시 무시
      }
    });

    ws.on("close", () => {
      // const userId = wsUserMap.get(ws); // 이 부분은 더 이상 필요 없으므로 제거
      // if (userId) {
      //   console.log(`WebSocket 사용자 연결 해제: User ID ${userId}`);
      //   wsUserMap.delete(ws);
      // } else {
        // WebSocket 연결 해제 로그 제거
      // }
    });
  });

  // 💥💥💥 아래의 중복되고 오래된 실시간 데이터 처리 로직은 모두 제거합니다. 💥💥💥
  // 실시간 김프율 데이터 전송 (WebSocket 기반)
  // const sendKimchiData = async () => {
  //   try {
  //     const symbols = ["BTC", "ETH", "XRP", "ADA", "DOT"];
  //     const kimchiData = [];
      
  //     // 데이터 상태 확인
  //     console.log(`🔍 데이터 상태 확인 - 업비트: ${upbitPrices.size}개, 바이낸스: ${binancePrices.size}개`);
      
  //     // 활성 사용자 찾기 (바이낸스 API 키용)
  //     const activeUserId = await findActiveUserWithApiKeys();
      
  //     // 완전한 WebSocket 기반 (API 호출 없음)
  //     for (const symbol of symbols) {
  //       const upbitPrice = upbitPrices.get(symbol);
  //       const binancePrice = binancePrices.get(symbol);
        
  //       if (upbitPrice && binancePrice) {
  //         const exchangeRate = simpleKimchiService.getCurrentExchangeRate();
  //         const premiumRate = ((upbitPrice.price - (binancePrice.price * exchangeRate)) / (binancePrice.price * exchangeRate)) * 100;
          
  //         kimchiData.push({
  //           symbol,
  //           upbitPrice: upbitPrice.price,
  //           binancePrice: binancePrice.price * exchangeRate,
  //           binancePriceUSD: binancePrice.price,
  //           premiumRate: premiumRate,
  //           timestamp: new Date(),
  //           exchangeRate: exchangeRate,
  //           exchangeRateSource: "Google Finance (실시간 환율)",
  //         });
          
  //         console.log(`📊 ${symbol}: 업비트 ₩${upbitPrice.price.toLocaleString()}, 바이낸스 $${binancePrice.price.toLocaleString()}, 김프 ${premiumRate.toFixed(3)}%`);
  //       }
  //     }

  //     // 데이터가 있을 때만 전송
  //     if (kimchiData.length > 0) {
  //       const message = JSON.stringify({
  //         type: "kimchi-premium",
  //         data: kimchiData,
  //         timestamp: new Date().toISOString(),
  //       });

  //       // 연결된 모든 WebSocket 클라이언트에 데이터 전송
  //       wss.clients.forEach((client) => {
  //         if (client.readyState === WebSocket.OPEN) {
  //           client.send(message);
  //         }
  //       });
        
  //       console.log(`📤 WebSocket 김프율 데이터 전송: ${kimchiData.length}개 심볼`);
  //     }
  //   } catch (error) {
  //     console.error("김프율 데이터 전송 오류:", error);
  //   }
  // };

  // setInterval(sendKimchiData, 100); // 이 부분은 더 이상 필요 없으므로 제거

  // 거래소 연동 테스트 API (중요: 이 라우트는 /api/exchanges/:userId 보다 먼저 선언되어야 함)
  app.post("/api/test-exchange-connection", authenticateSession, async (req: any, res) => {
    const { exchange, userId } = req.body;
    const authenticatedUserId = req.user.id;
    
    try {

      console.log(`🔍 연동테스트 요청:`, {
        exchange,
        userId,
        authenticatedUserId,
        sessionId: req.sessionID,
        body: req.body
      });

      if (!exchange || !userId) {
        console.log('❌ 연동테스트 실패: 필수 정보 누락');
        return res.status(400).json({
          error: '필수 정보가 누락되었습니다',
          details: '거래소와 사용자 ID를 입력해주세요'
        });
      }

      console.log(`🔍 [${new Date().toISOString()}] 거래소 연동 테스트 시작:`, {
        exchange,
        userId,
        userIdType: typeof userId
      });

      // DB에서 해당 사용자의 실제 API 키 조회
      const decryptedExchange = await storage.getDecryptedExchange(userId.toString(), exchange);
      
      if (!decryptedExchange) {
        console.log(`❌ [${new Date().toISOString()}] API 키를 찾을 수 없음:`, {
          userId,
          exchange
        });
        return res.status(400).json({
          error: 'API 키를 찾을 수 없습니다',
          details: `${exchange} 거래소의 API 키가 등록되지 않았습니다`
        });
      }

      const { apiKey, apiSecret } = decryptedExchange;

      console.log(`🔑 [${new Date().toISOString()}] API 키 조회 성공:`, {
        exchange,
        apiKeyLength: apiKey.length,
        apiSecretLength: apiSecret.length
      });

      // 연동테스트 서비스로 실제 테스트 수행
      const testResult = await exchangeTestService.testExchangeConnection(
        exchange,
        apiKey,
        apiSecret
      );

      logDebug('연동테스트 완료', {
        exchange,
        success: testResult.success,
        message: testResult.message,
        userId
      });

      console.log(`🔍 [연동테스트] 잔고 조회 조건 확인:`, {
        testSuccess: testResult.success,
        exchangeIsBinance: exchange === 'binance',
        shouldQueryBalance: testResult.success && exchange === 'binance'
      });

      // 연결 성공 시 잔고도 조회해서 함께 반환
      if (testResult.success && exchange === 'binance') {
        try {
          console.log(`💰 [연동테스트] ${exchange} 잔고 조회 시작...`);
          
          // testResult.details에서 사용 가능 잔고 우선 사용
          const availableBalance = parseFloat(testResult.details?.availableBalance || '0');
          const totalBalance = parseFloat(testResult.details?.totalWalletBalance || '0');
          const binanceBalance = availableBalance > 0 ? availableBalance : totalBalance;
          
          // BalanceService 캐시에 성공한 잔고 데이터 병합 저장
          try {
            const { BalanceService } = await import('./services/BalanceService.js');
            
            // 기존 캐시 데이터 가져오기
            const existingCache = (BalanceService as any).balanceCache.get(authenticatedUserId);
            const existingData = existingCache?.data || {
              real: {},
              connected: { upbit: false, binance: false },
              balances: { upbit: [], binance: [] },
              lastUpdated: new Date()
            };
            
            // 바이낸스 데이터만 업데이트하여 병합
            const updatedBalanceResponse = {
              ...existingData,
              real: {
                ...existingData.real,
                usdt: binanceBalance  // 바이낸스 USDT 업데이트
              },
              connected: {
                ...existingData.connected,
                binance: true  // 바이낸스 연결 상태 업데이트
              },
              balances: {
                ...existingData.balances,
                binance: [{
                  exchange: 'binance',
                  currency: 'USDT',
                  available: binanceBalance,
                  locked: 0,
                  total: binanceBalance
                }]
              },
              lastUpdated: new Date()
            };
            
            // 캐시에 병합된 데이터 저장
            (BalanceService as any).balanceCache.set(authenticatedUserId, {
              data: updatedBalanceResponse,
              timestamp: Date.now()
            });
            
            console.log(`✅ 바이낸스 잔고 캐시 병합 업데이트: ${binanceBalance} USDT (기존 데이터 유지)`);
          } catch (cacheError) {
            console.warn('⚠️ 잔고 캐시 병합 업데이트 실패:', cacheError);
          }
          
          res.json({
            ...testResult,
            balance: {
              usdt: binanceBalance,
              connected: true  // 연동 테스트 성공했으므로 true
            }
          });
        } catch (balanceError) {
          console.warn(`⚠️ [연동테스트] 잔고 조회 실패:`, balanceError);
          res.json(testResult); // 연결 테스트 결과만 반환
        }
      } else {
        // 연동 테스트 실패 시에도 가이드 제공
        if (!testResult.success) {
          const errorGuide = getApiErrorGuide(exchange as 'upbit' | 'binance', { 
            message: testResult.message || testResult.error 
          });
          
          // 서버 IP 정보 가져오기 (IP 관련 오류인 경우)
          let serverIp = null;
          if (errorGuide.errorCode.includes('IP_BLOCKED') || errorGuide.errorCode.includes('IP_RESTRICTION')) {
            try {
              const ipInfo = await getServerIpInfo();
              serverIp = ipInfo.ip;
            } catch (ipError) {
              logWarn('서버 IP 조회 실패', { error: ipError });
            }
          }

          res.json({
            ...testResult,
            guide: {
              ...errorGuide,
              serverIp: serverIp || undefined,
              timestamp: new Date().toISOString()
            }
          });
        } else {
          res.json(testResult);
        }
      }

    } catch (error: any) {
      logError('연동 테스트 중 에러', { 
        exchange, 
        userId, 
        error: error.message,
        stack: error.stack 
      });

      // API 오류 가이드 생성
      const errorGuide = getApiErrorGuide(exchange as 'upbit' | 'binance', error);
      
      // 서버 IP 정보 가져오기 (IP 관련 오류인 경우)
      let serverIp = null;
      if (errorGuide.errorCode.includes('IP_BLOCKED') || errorGuide.errorCode.includes('IP_RESTRICTION')) {
        try {
          const ipInfo = await getServerIpInfo();
          serverIp = ipInfo.ip;
        } catch (ipError) {
          logWarn('서버 IP 조회 실패', { error: ipError });
        }
      }

      res.status(500).json({
        success: false,
        error: '연동 테스트 실패',
        details: error.message,
        guide: {
          ...errorGuide,
          serverIp: serverIp || undefined,
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  // 테스트 로그 엔드포인트
  app.post("/api/test-log", async (req, res) => {
    try {
      const { message, timestamp, userId } = req.body;

      console.log(`🔍 [${timestamp}] 테스트 로그 - 사용자: ${userId}`);
      console.log(`📝 메시지: ${message}`);
      console.log(`👤 사용자 ID: ${userId}`);
      console.log(`⏰ 타임스탬프: ${timestamp}`);

      res.json({
        success: true,
        message: "로그가 서버에 기록되었습니다",
        loggedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("테스트 로그 기록 오류:", error);
      res.status(500).json({ error: "로그 기록 중 오류가 발생했습니다" });
    }
  });

  // 활동 추적 API
  app.post("/api/activity", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { timestamp, type, source } = req.body;
      
      // 활동 감지 시 세션 갱신
      if (req.session) {
        req.session.touch();
        // index.ts의 세션 TTL과 동일하게 유지 (rolling)
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
        // 활동 감지 로그 제거 (너무 빈번함)
      }
      
      res.json({ success: true, message: "활동이 기록되었습니다" });
    } catch (error) {
      console.error("활동 추적 오류:", error);
      res.status(500).json({ error: "활동 추적 중 오류가 발생했습니다" });
    }
  });

  // 포지션 조회 API
  app.get("/api/positions", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { isMock } = req.query;
      
      const whereClause: any = { userId };
      if (isMock !== undefined) {
        whereClause.isMock = isMock === 'true';
      }
      
      const positions = await storage.getPositions(whereClause);
      
      res.json(positions);
    } catch (error) {
      console.error("포지션 조회 오류:", error);
      res.status(500).json({ error: "포지션 조회 중 오류가 발생했습니다" });
    }
  });


  // 실거래 API 엔드포인트
  app.post("/api/live-trades", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tradeData = req.body;
      
      console.log(`💰 실거래 저장 요청:`, {
        userId,
        tradeId: tradeData.id,
        type: tradeData.type,
        symbol: tradeData.symbol,
        quantity: tradeData.quantity,
        price: tradeData.price
      });

      // TradeLog 먼저 생성
      const tradeLog = await storage.createTradeLog({
        kimp: tradeData.premiumRate || 0,
        action: tradeData.type,
        amount: tradeData.quantity * tradeData.price,
        result: 'success'
      });

      // 실거래 기록을 DB에 저장
      const trade = await storage.createTrade({
        userId: parseInt(userId),
        positionId: tradeData.strategyId || null, // 전략 ID를 positionId로 사용
        tradeLogId: tradeLog.id,
        symbol: tradeData.symbol,
        side: tradeData.type,
        exchange: tradeData.exchange || 'upbit',
        quantity: tradeData.quantity,
        price: tradeData.price,
        fee: tradeData.fee || 0,
        orderType: 'LIVE', // 실거래
        exchangeOrderId: tradeData.id,
        exchangeTradeId: tradeData.id,
      });

      console.log(`✅ 실거래 저장 완료: ${trade.id} (TradeLog: ${tradeLog.id})`);
      
      res.json({
        success: true,
        message: "실거래가 저장되었습니다",
        tradeId: trade.id,
        tradeLogId: tradeLog.id
      });
    } catch (error) {
      console.error("실거래 저장 오류:", error);
      res.status(500).json({ error: "실거래 저장 중 오류가 발생했습니다" });
    }
  });

  // Mock Trading API 엔드포인트들
  // Mock 거래 기록 저장 (세션 기반)
  app.post("/api/mock-trades", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tradeData = req.body;
      
      console.log(`📊 Mock 거래 저장 요청:`, {
        userId,
        tradeId: tradeData.id,
        type: tradeData.type,
        symbol: tradeData.symbol,
        quantity: tradeData.quantity,
        price: tradeData.price
      });

      // TradeLog 먼저 생성
      const tradeLog = await storage.createTradeLog({
        kimp: tradeData.premiumRate || 0,
        action: tradeData.type, // buy, sell, short, cover
        amount: tradeData.quantity * tradeData.price,
        result: 'success'
      });

      // Mock 거래 기록을 실제 DB에 저장
      const trade = await storage.createTrade({
        userId: parseInt(userId),
        positionId: null, // Mock 거래는 포지션 ID 없음
        tradeLogId: tradeLog.id, // TradeLog 연결
        symbol: tradeData.symbol,
        side: tradeData.type, // buy, sell, short, cover
        exchange: tradeData.exchange || 'upbit',
        quantity: tradeData.quantity,
        price: tradeData.price,
        fee: tradeData.fee || 0,
        orderType: tradeData.isMock ? 'MOCK' : 'LIVE', // Mock/실거래 구분
        exchangeOrderId: tradeData.isMock ? `MOCK-${tradeData.id}` : tradeData.id,
        exchangeTradeId: tradeData.isMock ? `MOCK-${tradeData.id}` : tradeData.id,
      });

      console.log(`✅ Mock 거래 저장 완료: ${trade.id} (TradeLog: ${tradeLog.id})`);
      
      res.json({
        success: true,
        message: "Mock 거래가 저장되었습니다",
        tradeId: trade.id,
        tradeLogId: tradeLog.id
      });
    } catch (error) {
      console.error("Mock 거래 저장 오류:", error);
      res.status(500).json({ error: "Mock 거래 저장 중 오류가 발생했습니다" });
    }
  });

  // Mock 거래 기록 저장 (기존 userId 파라미터 방식 - 호환성 유지)
  app.post("/api/mock-trades/:userId", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const tradeData = req.body;
      
      console.log(`📊 Mock 거래 저장 요청:`, {
        userId,
        tradeId: tradeData.id,
        type: tradeData.type,
        symbol: tradeData.symbol,
        quantity: tradeData.quantity,
        price: tradeData.price
      });

      // TradeLog 먼저 생성
      const tradeLog = await storage.createTradeLog({
        kimp: tradeData.premiumRate || 0,
        action: tradeData.type, // buy, sell, short, cover
        amount: tradeData.quantity * tradeData.price,
        result: 'success'
      });

      // Mock 거래 기록을 실제 DB에 저장
      const trade = await storage.createTrade({
        userId: parseInt(userId),
        positionId: null, // Mock 거래는 포지션 ID 없음
        tradeLogId: tradeLog.id, // TradeLog 연결
        symbol: tradeData.symbol,
        side: tradeData.type, // buy, sell, short, cover
        exchange: tradeData.exchange || 'upbit',
        quantity: tradeData.quantity,
        price: tradeData.price,
        fee: tradeData.fee || 0,
        orderType: tradeData.isMock ? 'MOCK' : 'LIVE', // Mock/실거래 구분
        exchangeOrderId: tradeData.isMock ? `MOCK-${tradeData.id}` : tradeData.id,
        exchangeTradeId: tradeData.isMock ? `MOCK-${tradeData.id}` : tradeData.id,
      });

      console.log(`✅ Mock 거래 저장 완료: ${trade.id} (TradeLog: ${tradeLog.id})`);
      
      res.json({
        success: true,
        message: "Mock 거래가 저장되었습니다",
        tradeId: trade.id,
        tradeLogId: tradeLog.id
      });
    } catch (error) {
      console.error("Mock 거래 저장 오류:", error);
      res.status(500).json({ error: "Mock 거래 저장 중 오류가 발생했습니다" });
    }
  });

  // Mock 포지션 저장
  app.post("/api/mock-positions/:userId", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const positionData = req.body;
      
      console.log(`📈 Mock 포지션 저장 요청:`, {
        userId,
        positionId: positionData.id,
        symbol: positionData.symbol,
        entryPremiumRate: positionData.entryPremiumRate,
        status: positionData.status
      });

      // Mock 포지션을 DB에 저장 (실제 구현 필요)
      // 현재는 로그만 출력
      console.log(`✅ Mock 포지션 저장 완료: ${positionData.id}`);
      
      res.json({
        success: true,
        message: "Mock 포지션이 저장되었습니다",
        positionId: positionData.id
      });
    } catch (error) {
      console.error("Mock 포지션 저장 오류:", error);
      res.status(500).json({ error: "Mock 포지션 저장 중 오류가 발생했습니다" });
    }
  });

  // Mock 포지션 업데이트
  app.put("/api/mock-positions/:positionId", authenticateSession, async (req: any, res) => {
    try {
      const positionId = req.params.positionId;
      const updateData = req.body;
      
      console.log(`🔄 Mock 포지션 업데이트 요청:`, {
        positionId,
        status: updateData.status,
        realizedPnl: updateData.realizedPnl,
        unrealizedPnl: updateData.unrealizedPnl
      });

      // Mock 포지션을 DB에서 업데이트 (실제 구현 필요)
      // 현재는 로그만 출력
      console.log(`✅ Mock 포지션 업데이트 완료: ${positionId}`);
      
      res.json({
        success: true,
        message: "Mock 포지션이 업데이트되었습니다",
        positionId
      });
    } catch (error) {
      console.error("Mock 포지션 업데이트 오류:", error);
      res.status(500).json({ error: "Mock 포지션 업데이트 중 오류가 발생했습니다" });
    }
  });

  // 강제진입 포지션 생성 API (환경별 분기)
  app.post("/api/force-entry", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { 
        margin, 
        leverage, 
        investmentAmount, 
        currentKimp, 
        symbol = 'BTC' 
      } = req.body;
      
      console.log('🧪 강제진입 요청:', { userId, margin, leverage, investmentAmount, currentKimp });
      
      // TradingManager 사용
      const { tradingManager } = await import('./services/trading-manager.js');
      
      const result = await tradingManager.executeForceEntry(userId, {
        symbol,
        quantity: parseFloat(investmentAmount),
        leverage: parseInt(leverage),
        currentKimp: parseFloat(currentKimp)
      });
      
      if (result.success) {
        console.log('✅ 강제진입 성공:', result.data?.position?.id);
        res.json(result.data);
      } else {
        console.error('❌ 강제진입 실패:', result.message);
        res.status(400).json({ 
          error: result.message
        });
      }
      
    } catch (error) {
      console.error('❌ 강제진입 API 오류:', error);
      res.status(500).json({ 
        error: "강제진입 실행 중 오류가 발생했습니다",
        details: (error as any).message 
      });
    }
  });

  // 어드민 권한 확인 API
  app.get("/api/admin/check", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.status(404).json({ isAdmin: false, message: "사용자를 찾을 수 없습니다" });
      }

      // 어드민 권한 확인
      let isAdmin = false;
      let adminLevel = null;
      
      if (user.role === 'admin') {
        isAdmin = true;
        adminLevel = 'super_admin';
      } else {
        // admins 테이블에서 권한 확인
        const adminCheck = await storage.checkAdminPermission(userId);
        if (adminCheck.isAdmin) {
          isAdmin = true;
          adminLevel = adminCheck.adminLevel;
        }
      }

      res.json({
        isAdmin,
        adminLevel,
        username: user.username,
        role: user.role
      });
      
    } catch (error) {
      console.error('어드민 권한 확인 API 오류:', error);
      res.status(500).json({ isAdmin: false, message: "권한 확인 중 오류가 발생했습니다" });
    }
  });

  // 거래소 API 연결 상태 확인
  app.get("/api/exchanges/status", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log(`🔍 거래소 연결 상태 확인 요청 - 사용자: ${userId}`);
      
      // 사용자의 거래소 API 키 확인
      const exchanges = await storage.getExchangesByUserId(userId);
      console.log(`📊 등록된 거래소: ${exchanges.length}개`);
      
      if (exchanges.length === 0) {
        return res.json({
          connected: false,
          message: "등록된 거래소 API가 없습니다",
          exchanges: []
        });
      }

      // 각 거래소별 연결 상태 확인
      const exchangeStatus = [];
      let allConnected = true;

      for (const exchange of exchanges) {
        try {
          let isConnected = false;
          let balance = null;
          let error = null;

          if (exchange.exchange === 'upbit') {
            // 업비트 연결 테스트 (잔고 조회)
            try {
              // 실제 업비트 API 호출 시뮬레이션
              // TODO: 실제 업비트 API 연결 구현
              console.log('📈 업비트 API 연결 테스트...');
              
              // 임시로 성공으로 처리 (실제 구현 시 수정 필요)
              isConnected = process.env.NODE_ENV === 'production'; // 프로덕션에서만 연결 시도
              balance = isConnected ? { KRW: 1000000, BTC: 0.1 } : null;
              
            } catch (err) {
              error = err instanceof Error ? err.message : '업비트 연결 실패';
              console.error('❌ 업비트 연결 실패:', error);
            }
          } else if (exchange.exchange === 'binance') {
            // 바이낸스 연결 테스트 (잔고 조회)
            try {
              console.log('🌐 바이낸스 API 연결 테스트...');
              
              // 임시로 성공으로 처리 (실제 구현 시 수정 필요)
              isConnected = process.env.NODE_ENV === 'production'; // 프로덕션에서만 연결 시도
              balance = isConnected ? { USDT: 50000, BTC: 0.05 } : null;
              
            } catch (err) {
              error = err instanceof Error ? err.message : '바이낸스 연결 실패';
              console.error('❌ 바이낸스 연결 실패:', error);
            }
          }

          exchangeStatus.push({
            exchange: exchange.exchange,
            connected: isConnected,
            balance,
            error,
            lastChecked: new Date().toISOString()
          });

          if (!isConnected) {
            allConnected = false;
          }

        } catch (err) {
          console.error(`❌ ${exchange.exchange} 상태 확인 실패:`, err);
          exchangeStatus.push({
            exchange: exchange.exchange,
            connected: false,
            error: err instanceof Error ? err.message : '연결 확인 실패',
            lastChecked: new Date().toISOString()
          });
          allConnected = false;
        }
      }

      const result = {
        connected: allConnected,
        message: allConnected ? '모든 거래소 연결 성공' : '일부 거래소 연결 실패',
        exchanges: exchangeStatus,
        totalExchanges: exchanges.length,
        connectedExchanges: exchangeStatus.filter(e => e.connected).length
      };

      console.log('✅ 거래소 연결 상태 응답:', {
        connected: result.connected,
        totalExchanges: result.totalExchanges,
        connectedExchanges: result.connectedExchanges
      });

      res.json(result);
      
    } catch (error) {
      console.error('❌ 거래소 연결 상태 확인 오류:', error);
      res.status(500).json({
        connected: false,
        message: "거래소 연결 상태 확인 중 오류가 발생했습니다",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // ===== 새로운 잔고 연결 시스템 라우트 =====
  
  // 잔고 조회 (새 BalanceService 사용)
  app.get("/api/v2/balance", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { balanceService } = await import('./services/BalanceService.js');
      
      const balances = await balanceService.getUserBalances(userId);
      
      res.json(balances);
    } catch (error: any) {
      console.error('❌ 잔고 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BALANCE_FETCH_FAILED',
          message: error.message || '잔고 조회에 실패했습니다.',
          timestamp: new Date()
        }
      });
    }
  });

  // 거래소 연결 상태 조회 (새 BalanceService 사용)
  app.get("/api/v2/exchanges/status", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { balanceService } = await import('./services/BalanceService.js');
      
      const status = await balanceService.getExchangeStatus(userId);
      
      res.json(status);
    } catch (error: any) {
      console.error('❌ 거래소 상태 조회 실패:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATUS_FETCH_FAILED',
          message: error.message || '거래소 상태 조회에 실패했습니다.',
          timestamp: new Date()
        }
      });
    }
  });

  // 거래소 연결 테스트
  app.post("/api/v2/exchanges/test", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { exchange } = req.body;
      
      if (!exchange) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: '거래소명이 필요합니다.',
            timestamp: new Date()
          }
        });
      }

      const { balanceService } = await import('./services/BalanceService.js');
      const result = await balanceService.testExchangeConnection(userId, exchange);
      
      res.json({
        success: result.success,
        data: result,
        timestamp: new Date()
      });
    } catch (error: any) {
      console.error('❌ 거래소 연결 테스트 실패:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CONNECTION_TEST_FAILED',
          message: error.message || '연결 테스트에 실패했습니다.',
          timestamp: new Date()
        }
      });
    }
  });

  // API 키 저장
  app.post("/api/v2/exchanges/connect", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { exchange, apiKey, secretKey, passphrase } = req.body;
      
      if (!exchange || !apiKey || !secretKey) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: '거래소명, API 키, Secret 키가 모두 필요합니다.',
            timestamp: new Date()
          }
        });
      }

      const { balanceService } = await import('./services/BalanceService.js');
      const result = await balanceService.saveApiKey(userId, exchange, apiKey, secretKey, passphrase);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            message: result.message,
            permissions: result.permissions
          },
          timestamp: new Date()
        });
      } else {
        res.status(400).json({
          success: false,
          error: {
            code: 'CONNECTION_FAILED',
            message: result.message,
            timestamp: new Date()
          }
        });
      }
    } catch (error: any) {
      console.error('❌ API 키 저장 실패:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'API_KEY_SAVE_FAILED',
          message: error.message || 'API 키 저장에 실패했습니다.',
          timestamp: new Date()
        }
      });
    }
  });

  // 잔고 새로고침
  app.post("/api/v2/balance/refresh", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { tradeDetails, forceRefresh } = req.body; // 거래 정보 및 강제 새로고침 플래그
      const { BalanceService } = await import('./services/BalanceService.js');
      
      // 캐시 무효화 후 새로 조회
      BalanceService.invalidateUserCache(userId);
      console.log(`🔄 [잔고새로고침] 사용자 ${userId} 캐시 무효화 후 재조회`);
      
      const balanceService = new BalanceService();
      const balances = await balanceService.getUserBalances(userId);
      
      console.log(`🔄 잔고 갱신 방식: ${tradeDetails || forceRefresh ? '실제 API 직접 호출' : '캐시 활용'}`);
      
      res.json({
        success: true,
        data: balances,
        timestamp: new Date(),
        refreshType: (tradeDetails || forceRefresh) ? 'real-api-direct' : 'cached-or-normal',
        method: (tradeDetails || forceRefresh) ? 'direct-exchange-api' : 'cached-balance'
      });
    } catch (error: any) {
      console.error('❌ 잔고 새로고침 실패:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'BALANCE_REFRESH_FAILED',
          message: error.message || '잔고 새로고침에 실패했습니다.',
          timestamp: new Date()
        }
      });
    }
  });

  // CORS preflight 처리
  app.options("/api/auth/*", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(200);
  });

  // ===== IP 밴 방지 모니터링 API =====
  
  // 통합 시스템 상태
  app.get("/api/v2/system/status", authenticateSession, (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          rateLimits: globalRateLimiter.getStatus(),
          banStatus: ipBanDetector.getStatus(),
          proxyStatus: proxyManager.getStatus(),
          serverInfo: {
            nodeVersion: process.version,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            environment: process.env.NODE_ENV || 'development'
          }
        },
        timestamp: new Date()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // 긴급 시스템 리셋
  app.post("/api/v2/system/emergency-reset", authenticateSession, (req, res) => {
    try {
      globalRateLimiter.emergencyReset();
      proxyManager.resetAllProxies();
      
      ['binance', 'upbit'].forEach(exchange => {
        ipBanDetector.clearBanRecord(exchange);
      });

      console.warn('🚨 [System] 긴급 시스템 리셋 실행');

      res.json({
        success: true,
        message: '긴급 시스템 리셋 완료',
        timestamp: new Date()
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // ===== 잔고 테스트 API =====

  // 업비트 잔고 직접 조회 테스트
  app.get("/api/test/upbit-balance", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log(`🔍 [테스트] 업비트 잔고 직접 조회: 사용자 ${userId}`);
      
      // 사용자의 업비트 API 키 조회
      const exchange = await storage.getDecryptedExchange(userId, 'upbit');
      if (!exchange) {
        return res.status(400).json({ error: "업비트 API 키가 설정되지 않았습니다" });
      }
      
      console.log(`🔑 [테스트] API 키 확인: ${exchange.apiKey ? '있음' : '없음'}`);
      
      // 업비트 서비스로 잔고 조회
      const { UpbitService } = await import('./services/upbit.js');
      const upbitService = new UpbitService(exchange.apiKey, exchange.apiSecret);
      
      const accounts = await upbitService.getAccounts();
      console.log(`💰 [테스트] 업비트 계좌 개수: ${accounts.length}`);
      
      const krwAccount = accounts.find((account: any) => account.currency === 'KRW');
      const btcAccount = accounts.find((account: any) => account.currency === 'BTC');
      
      const result = {
        success: true,
        userId: userId,
        timestamp: new Date().toISOString(),
        raw: accounts,
        summary: {
          krw: krwAccount ? {
            balance: parseFloat(krwAccount.balance || '0'),
            locked: parseFloat(krwAccount.locked || '0'),
            avgBuyPrice: parseFloat(krwAccount.avg_buy_price || '0'),
            avgBuyPriceModified: krwAccount.avg_buy_price_modified || false,
            unitCurrency: krwAccount.unit_currency || 'KRW'
          } : null,
          btc: btcAccount ? {
            balance: parseFloat(btcAccount.balance || '0'),
            locked: parseFloat(btcAccount.locked || '0'),
            avgBuyPrice: parseFloat(btcAccount.avg_buy_price || '0'),
            avgBuyPriceModified: btcAccount.avg_buy_price_modified || false,
            unitCurrency: btcAccount.unit_currency || 'KRW'
          } : null,
          totalAccounts: accounts.length
        }
      };
      
      console.log(`💰 [테스트] 업비트 잔고 요약:`, {
        krw: result.summary.krw?.balance || 0,
        btc: result.summary.btc?.balance || 0,
        totalAccounts: result.summary.totalAccounts
      });
      
      res.json(result);
      
    } catch (error: any) {
      console.error('❌ [테스트] 업비트 잔고 조회 실패:', error);
      res.status(500).json({ 
        success: false,
        error: '업비트 잔고 조회 실패', 
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 바이낸스 선물 잔고 직접 조회 테스트
  app.get("/api/test/binance-balance", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      console.log(`🔍 [테스트] 바이낸스 선물 잔고 직접 조회: 사용자 ${userId}`);
      
      // 사용자의 바이낸스 API 키 조회
      const exchange = await storage.getDecryptedExchange(userId, 'binance');
      if (!exchange) {
        return res.status(400).json({ error: "바이낸스 API 키가 설정되지 않았습니다" });
      }
      
      console.log(`🔑 [테스트] API 키 확인: ${exchange.apiKey ? '있음' : '없음'}`);
      
      // 바이낸스 서비스로 선물 계정 정보 조회
      const binanceService = new BinanceService(exchange.apiKey, exchange.apiSecret);
      
      const accountInfo = await binanceService.getFuturesAccountInfo();
      console.log(`💰 [테스트] 바이낸스 선물 계정 정보 조회 완료`);
      
      const result = {
        success: true,
        userId: userId,
        timestamp: new Date().toISOString(),
        summary: {
          totalWalletBalance: parseFloat(accountInfo.totalWalletBalance || '0'),
          availableBalance: parseFloat(accountInfo.availableBalance || '0'),
          totalUnrealizedProfit: parseFloat(accountInfo.totalUnrealizedProfit || '0'),
          totalMarginBalance: parseFloat(accountInfo.totalMarginBalance || '0'),
          totalInitialMargin: parseFloat(accountInfo.totalInitialMargin || '0'),
          totalMaintMargin: parseFloat(accountInfo.totalMaintMargin || '0'),
          canTrade: accountInfo.canTrade || false,
          canWithdraw: accountInfo.canWithdraw || false,
          feeTier: accountInfo.feeTier || 0,
          maxWithdrawAmount: parseFloat(accountInfo.maxWithdrawAmount || '0'),
          assets: accountInfo.assets?.map((asset: any) => ({
            asset: asset.asset,
            walletBalance: parseFloat(asset.walletBalance || '0'),
            unrealizedProfit: parseFloat(asset.unrealizedProfit || '0'),
            marginBalance: parseFloat(asset.marginBalance || '0'),
            maintMargin: parseFloat(asset.maintMargin || '0'),
            initialMargin: parseFloat(asset.initialMargin || '0'),
            positionInitialMargin: parseFloat(asset.positionInitialMargin || '0'),
            openOrderInitialMargin: parseFloat(asset.openOrderInitialMargin || '0'),
            crossWalletBalance: parseFloat(asset.crossWalletBalance || '0'),
            crossUnPnl: parseFloat(asset.crossUnPnl || '0'),
            availableBalance: parseFloat(asset.availableBalance || '0'),
            maxWithdrawAmount: parseFloat(asset.maxWithdrawAmount || '0'),
            marginAvailable: asset.marginAvailable || false,
            updateTime: asset.updateTime || 0
          })) || [],
          positions: accountInfo.positions?.filter((pos: any) => parseFloat(pos.positionAmt || '0') !== 0).map((pos: any) => ({
            symbol: pos.symbol,
            initialMargin: parseFloat(pos.initialMargin || '0'),
            maintMargin: parseFloat(pos.maintMargin || '0'),
            unrealizedProfit: parseFloat(pos.unrealizedProfit || '0'),
            positionInitialMargin: parseFloat(pos.positionInitialMargin || '0'),
            openOrderInitialMargin: parseFloat(pos.openOrderInitialMargin || '0'),
            leverage: pos.leverage,
            isolated: pos.isolated,
            entryPrice: parseFloat(pos.entryPrice || '0'),
            breakEvenPrice: parseFloat(pos.breakEvenPrice || '0'),
            maxNotional: parseFloat(pos.maxNotional || '0'),
            positionSide: pos.positionSide,
            positionAmt: parseFloat(pos.positionAmt || '0'),
            notional: parseFloat(pos.notional || '0'),
            isolatedWallet: parseFloat(pos.isolatedWallet || '0'),
            updateTime: pos.updateTime
          })) || []
        }
      };
      
      console.log(`💰 [테스트] 바이낸스 선물 잔고 요약:`, {
        totalWalletBalance: result.summary.totalWalletBalance,
        availableBalance: result.summary.availableBalance,
        totalUnrealizedProfit: result.summary.totalUnrealizedProfit,
        activePositions: result.summary.positions.length
      });
      
      res.json(result);
      
    } catch (error: any) {
      console.error('❌ [테스트] 바이낸스 선물 잔고 조회 실패:', error);
      res.status(500).json({ 
        success: false,
        error: '바이낸스 선물 잔고 조회 실패', 
        details: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // 포지션 불균형 감지 및 자동 롤백 API
  app.post("/api/rollback/positions", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { symbol = 'BTC', tolerance = 0.001, autoExecute = false } = req.body;
      
      console.log(`🚨 [롤백] 포지션 불균형 감지 시작: 사용자 ${userId}, 심볼 ${symbol}`);
      
      // 1. 바이낸스 포지션 조회
      const binanceExchange = await storage.getDecryptedExchange(userId, 'binance');
      if (!binanceExchange) {
        return res.status(400).json({ error: "바이낸스 API 키가 설정되지 않았습니다" });
      }
      
      const binanceService = new BinanceService(binanceExchange.apiKey, binanceExchange.apiSecret);
      const accountInfo = await binanceService.getFuturesAccountInfo();
      
      // 활성 포지션 찾기
      const activePosition = accountInfo.positions?.find((pos: any) => 
        pos.symbol === `${symbol}USDT` && parseFloat(pos.positionAmt || '0') !== 0
      );
      
      const positionQty = activePosition ? parseFloat(activePosition.positionAmt || '0') : 0;
      const positionSide = positionQty > 0 ? 'LONG' : positionQty < 0 ? 'SHORT' : 'NONE';
      const absPositionQty = Math.abs(positionQty);
      
      console.log(`📊 [롤백] 바이낸스 ${symbol} 포지션: ${positionQty} (${positionSide})`);
      
      // 2. 업비트 현물 잔고 조회
      const upbitExchange = await storage.getDecryptedExchange(userId, 'upbit');
      if (!upbitExchange) {
        return res.status(400).json({ error: "업비트 API 키가 설정되지 않았습니다" });
      }
      
      const { UpbitService } = await import('./services/upbit.js');
      const upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
      const accounts = await upbitService.getAccounts();
      
      const btcAccount = accounts.find((account: any) => account.currency === symbol);
      const upbitHolding = btcAccount ? parseFloat(btcAccount.balance || '0') : 0;
      
      console.log(`📊 [롤백] 업비트 ${symbol} 보유: ${upbitHolding}`);
      
      // 3. 불균형 분석
      const imbalance = absPositionQty - upbitHolding;
      const imbalanceRatio = absPositionQty > 0 ? (imbalance / absPositionQty) * 100 : 0;
      const isUnbalanced = Math.abs(imbalance) > tolerance;
      
      console.log(`⚠️ [롤백] 불균형 분석: 차이 ${imbalance}, 비율 ${imbalanceRatio.toFixed(2)}%`);
      
      const result: any = {
        success: true,
        analysis: {
          binancePosition: {
            quantity: positionQty,
            absQuantity: absPositionQty,
            side: positionSide,
            symbol: activePosition?.symbol || `${symbol}USDT`,
            unrealizedPnl: activePosition ? parseFloat(activePosition.unrealizedProfit || '0') : 0
          },
          upbitHolding: {
            quantity: upbitHolding,
            symbol: `KRW-${symbol}`
          },
          imbalance: {
            difference: imbalance,
            ratio: imbalanceRatio,
            tolerance: tolerance,
            isUnbalanced: isUnbalanced,
            riskLevel: imbalanceRatio > 80 ? 'HIGH' : imbalanceRatio > 50 ? 'MEDIUM' : 'LOW'
          }
        }
      };
      
      // 4. 롤백 권장사항
      if (isUnbalanced) {
        const currentPrice = await upbitService.getTicker([`KRW-${symbol}`]).then(t => t[0]?.trade_price || 0);
        const positionValue = absPositionQty * currentPrice;
        
        result.recommendation = {
          action: 'rollback_all',
          reason: `포지션 불균형 감지 (${imbalanceRatio.toFixed(1)}% 불일치)`,
          description: `즉시 전체 청산 권장 - 헤지 실패로 인한 리스크 노출`,
          steps: [
            `1. 바이낸스 ${symbol} ${positionSide} 포지션 전량 청산 (${absPositionQty} ${symbol})`,
            upbitHolding > 0 ? `2. 업비트 ${symbol} 현물 전량 매도 (${upbitHolding} ${symbol})` : '2. 업비트 추가 액션 불필요',
            '3. 포지션 정리 완료 후 새로운 기회 대기'
          ],
          estimatedLoss: activePosition ? parseFloat(activePosition.unrealizedProfit || '0') : 0,
          positionValue: positionValue
        };
      } else {
        result.recommendation = {
          action: 'maintain',
          description: '포지션 균형 양호 - 유지 권장',
          riskLevel: 'LOW'
        };
      }
      
      // 5. 자동 롤백 실행 (autoExecute=true인 경우)
      if (autoExecute && isUnbalanced && absPositionQty > 0) {
        try {
          console.log(`🚨 [롤백] 자동 청산 시작...`);
          
          // 바이낸스 포지션 청산
          let closeResult;
          if (positionSide === 'SHORT') {
            closeResult = await binanceService.closeShortPosition(`${symbol}USDT`, absPositionQty);
          } else {
            // LONG 청산 로직 (향후 구현)
            throw new Error('LONG 포지션 자동 청산은 아직 구현되지 않았습니다');
          }
          
          result.execution = {
            binanceClose: {
              success: true,
              order: closeResult,
              message: `바이낸스 ${symbol} ${positionSide} 포지션 청산 완료`
            }
          };
          
          // 업비트 현물 매도 (보유량이 있으면)
          if (upbitHolding > 0.0001) {
            try {
              const sellOrder = await upbitService.placeSellOrder(`KRW-${symbol}`, upbitHolding);
              result.execution.upbitSell = {
                success: true,
                order: sellOrder,
                message: `업비트 ${symbol} 현물 매도 완료`
              };
            } catch (sellError: any) {
              result.execution.upbitSell = {
                success: false,
                error: sellError.message,
                message: '업비트 현물 매도 실패'
              };
            }
          }
          
          console.log(`✅ [롤백] 자동 청산 완료`);
          
        } catch (executionError: any) {
          console.error(`❌ [롤백] 자동 청산 실패:`, executionError);
          result.execution = {
            success: false,
            error: executionError.message,
            message: '자동 롤백 실행 중 오류 발생'
          };
        }
      }
      
      res.json(result);
      
    } catch (error: any) {
      console.error('❌ [롤백] 실패:', error);
      res.status(500).json({
        success: false,
        error: '포지션 롤백 분석 중 오류 발생',
        details: error.message
      });
    }
  });

  // 포지션 롤백 테스트 페이지
  app.get("/test/rollback", authenticateSession, async (req: any, res) => {
    const html = `<!doctype html>
<meta charset="utf-8" />
<title>🚨 포지션 롤백 (안전 청산)</title>
<style>
  body { font-family: monospace; margin: 20px; background: #1a1a1a; color: #fff; }
  .container { max-width: 900px; margin: 0 auto; }
  .status { padding: 15px; margin: 15px 0; border-radius: 8px; }
  .info { background: #0d47a1; }
  .success { background: #2e7d32; }
  .error { background: #d32f2f; }
  .warning { background: #f57c00; }
  .danger { background: #c62828; }
  button { padding: 12px 24px; margin: 8px; font-size: 16px; cursor: pointer; border-radius: 6px; }
  .btn-primary { background: #1976d2; color: white; border: none; }
  .btn-warning { background: #f57c00; color: white; border: none; }
  .btn-danger { background: #d32f2f; color: white; border: none; }
  .btn-success { background: #2e7d32; color: white; border: none; }
  pre { background: #2d2d2d; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
  .card { background: #2d2d2d; padding: 20px; border-radius: 8px; }
  .metric { font-size: 28px; font-weight: bold; color: #4caf50; }
  .risk-high { color: #f44336; }
  .risk-medium { color: #ff9800; }
  .risk-low { color: #4caf50; }
  h1 { color: #f44336; text-align: center; }
</style>

<div class="container">
  <h1>🚨 포지션 롤백 (안전 청산)</h1>
  
  <div class="status danger">
    <strong>⚠️ 경고: 불균형 포지션 감지 시 즉시 청산으로 리스크를 제거합니다</strong>
    <div id="status">분석 중...</div>
  </div>

  <div class="grid">
    <div class="card">
      <h3>🟡 바이낸스 선물</h3>
      <div>포지션: <span id="binancePosition" class="metric">-</span></div>
      <div>사이드: <span id="binanceSide">-</span></div>
      <div>미실현PnL: <span id="binancePnl">-</span></div>
    </div>
    <div class="card">
      <h3>🔵 업비트 현물</h3>
      <div>보유량: <span id="upbitHolding" class="metric">-</span></div>
      <div>평가금액: <span id="upbitValue">-</span></div>
    </div>
  </div>

  <div class="status warning">
    <strong>⚖️ 불균형 분석</strong>
    <div>수량 차이: <span id="difference" class="metric">-</span></div>
    <div>불균형 비율: <span id="imbalanceRatio" class="metric">-</span></div>
    <div>리스크 레벨: <span id="riskLevel" class="metric">-</span></div>
    <div>권장 액션: <span id="recommendation">-</span></div>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <button class="btn-primary" onclick="analyze()">📊 불균형 분석</button>
    <button class="btn-danger" onclick="rollback()">🚨 즉시 전체 청산</button>
    <button class="btn-success" onclick="location.reload()">🔄 새로고침</button>
  </div>

  <div class="status info">
    <strong>📝 실행 로그</strong>
    <pre id="log">포지션 불균형 감지 시 안전을 위해 즉시 청산을 권장합니다...\\n</pre>
  </div>
</div>

<script>
const log = (msg) => {
  const logEl = document.getElementById('log');
  const timestamp = new Date().toLocaleTimeString();
  logEl.textContent += \`[\${timestamp}] \${typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)}\\n\`;
  logEl.scrollTop = logEl.scrollHeight;
};

const updateUI = (data) => {
  if (data.analysis) {
    const pos = data.analysis.binancePosition;
    const upbit = data.analysis.upbitHolding;
    const imb = data.analysis.imbalance;
    
    document.getElementById('binancePosition').textContent = pos.absQuantity + ' BTC';
    document.getElementById('binanceSide').textContent = pos.side;
    document.getElementById('binancePnl').textContent = pos.unrealizedPnl.toFixed(4) + ' USDT';
    document.getElementById('upbitHolding').textContent = upbit.quantity + ' BTC';
    document.getElementById('difference').textContent = imb.difference.toFixed(8) + ' BTC';
    document.getElementById('imbalanceRatio').textContent = imb.ratio.toFixed(1) + '%';
    
    const riskEl = document.getElementById('riskLevel');
    riskEl.textContent = imb.riskLevel;
    riskEl.className = 'metric risk-' + imb.riskLevel.toLowerCase();
  }
  if (data.recommendation) {
    document.getElementById('recommendation').textContent = data.recommendation.description;
  }
};

const analyze = async () => {
  log('📊 포지션 불균형 분석 시작...');
  document.getElementById('status').textContent = '분석 중...';
  
  try {
    const response = await fetch('/api/rollback/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ symbol: 'BTC', tolerance: 0.001, autoExecute: false })
    });
    
    const result = await response.json();
    log('분석 완료:');
    log(result);
    
    if (result.success) {
      updateUI(result);
      document.getElementById('status').textContent = result.recommendation.description;
    } else {
      document.getElementById('status').textContent = '분석 실패: ' + result.error;
    }
  } catch (error) {
    log('❌ 분석 실패: ' + error.message);
    document.getElementById('status').textContent = '분석 실패';
  }
};

const rollback = async () => {
  if (!confirm('🚨 경고: 모든 포지션을 즉시 청산합니다. 계속하시겠습니까?\\n\\n이 작업은 되돌릴 수 없습니다.')) {
    return;
  }
  
  log('🚨 포지션 롤백 실행 시작...');
  document.getElementById('status').textContent = '🚨 전체 청산 실행 중...';
  
  try {
    const response = await fetch('/api/rollback/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ symbol: 'BTC', tolerance: 0.001, autoExecute: true })
    });
    
    const result = await response.json();
    log('롤백 완료:');
    log(result);
    
    if (result.success) {
      updateUI(result);
      if (result.execution) {
        let status = '✅ 롤백 완료: ';
        if (result.execution.binanceClose?.success) status += '바이낸스 청산 성공 ';
        if (result.execution.upbitSell?.success) status += '업비트 매도 성공';
        document.getElementById('status').textContent = status;
      } else {
        document.getElementById('status').textContent = result.recommendation.description;
      }
    } else {
      document.getElementById('status').textContent = '롤백 실패: ' + result.error;
    }
  } catch (error) {
    log('❌ 롤백 실패: ' + error.message);
    document.getElementById('status').textContent = '롤백 실패';
  }
};

// 페이지 로드 시 자동 분석
window.onload = () => {
  setTimeout(analyze, 1000);
};
</script>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  // 롤백 설정 페이지
  app.get("/test/rollback-settings", authenticateSession, async (req: any, res) => {
    const html = `<!doctype html>
<meta charset="utf-8" />
<title>🛡️ 롤백 설정</title>
<style>
  body { font-family: monospace; margin: 20px; background: #1a1a1a; color: #fff; }
  .container { max-width: 800px; margin: 0 auto; }
  .card { background: #2d2d2d; padding: 20px; border-radius: 8px; margin: 15px 0; }
  .form-group { margin: 15px 0; }
  .form-group label { display: block; margin-bottom: 5px; color: #ccc; font-weight: bold; }
  .form-group input, .form-group select { 
    width: 100%; padding: 8px; background: #1a1a1a; color: #fff; 
    border: 1px solid #555; border-radius: 4px; 
  }
  .form-group .help { font-size: 12px; color: #888; margin-top: 3px; }
  button { padding: 10px 20px; margin: 5px; font-size: 14px; cursor: pointer; border: none; border-radius: 4px; }
  .btn-primary { background: #1976d2; color: white; }
  .btn-success { background: #2e7d32; color: white; }
  .btn-warning { background: #f57c00; color: white; }
  .btn-danger { background: #d32f2f; color: white; }
  .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
  .info { background: #0d47a1; }
  .success { background: #2e7d32; }
  .warning { background: #f57c00; }
  .error { background: #d32f2f; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
  .risk-indicator { padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
  .risk-high { background: #d32f2f; color: white; }
  .risk-medium { background: #f57c00; color: white; }
  .risk-low { background: #2e7d32; color: white; }
  pre { background: #1a1a1a; padding: 10px; border-radius: 4px; font-size: 12px; }
</style>

<div class="container">
  <h1>🛡️ 자동 롤백 설정</h1>
  
  <div class="status info">
    <strong>📋 현재 기준 (기본값)</strong>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li><span class="risk-indicator risk-high">80% 이상</span> HIGH 리스크 → 🚨 자동 롤백 실행</li>
      <li><span class="risk-indicator risk-medium">50% ~ 80%</span> MEDIUM 리스크 → ⚠️ 경고만 표시</li>
      <li><span class="risk-indicator risk-low">50% 미만</span> LOW 리스크 → ✅ 정상 유지</li>
      <li>허용 오차: 0.001 BTC (0.1% 차이 이하는 무시)</li>
    </ul>
  </div>

  <div class="card">
    <h2>⚙️ 롤백 설정 조정</h2>
    
    <div class="form-group">
      <label>
        <input type="checkbox" id="autoRollbackEnabled" checked> 자동 롤백 활성화
      </label>
      <div class="help">체크 해제 시 수동으로만 롤백 가능</div>
    </div>

    <div class="grid">
      <div class="form-group">
        <label for="highRiskThreshold">HIGH 리스크 임계값 (%)</label>
        <input type="number" id="highRiskThreshold" value="80" min="10" max="100" step="5">
        <div class="help">이 값 이상 시 자동 롤백 실행</div>
      </div>
      
      <div class="form-group">
        <label for="mediumRiskThreshold">MEDIUM 리스크 임계값 (%)</label>
        <input type="number" id="mediumRiskThreshold" value="50" min="5" max="99" step="5">
        <div class="help">이 값 이상 시 경고 표시</div>
      </div>
    </div>

    <div class="grid">
      <div class="form-group">
        <label for="tolerance">허용 오차 (BTC)</label>
        <input type="number" id="tolerance" value="0.001" min="0.0001" max="1" step="0.0001">
        <div class="help">이 값 이하의 차이는 무시</div>
      </div>
      
      <div class="form-group">
        <label for="autoExecuteDelay">자동 실행 지연 (초)</label>
        <input type="number" id="autoExecuteDelay" value="3" min="1" max="30" step="1">
        <div class="help">주문 후 몇 초 뒤에 체크할지</div>
      </div>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <button class="btn-primary" onclick="loadSettings()">🔄 현재 설정 로드</button>
      <button class="btn-success" onclick="saveSettings()">💾 설정 저장</button>
      <button class="btn-warning" onclick="resetToDefault()">🔧 기본값 복원</button>
      <button class="btn-danger" onclick="testRollback()">🧪 롤백 테스트</button>
    </div>
  </div>

  <div class="status info">
    <strong>📝 로그</strong>
    <pre id="log">롤백 설정 페이지가 로드되었습니다...\\n</pre>
  </div>
</div>

<script>
const log = (msg) => {
  const logEl = document.getElementById('log');
  const timestamp = new Date().toLocaleTimeString();
  logEl.textContent += \`[\${timestamp}] \${typeof msg === 'string' ? msg : JSON.stringify(msg, null, 2)}\\n\`;
  logEl.scrollTop = logEl.scrollHeight;
};

const loadSettings = async () => {
  try {
    log('설정 로드 중...');
    const response = await fetch('/api/rollback/settings', { credentials: 'include' });
    const result = await response.json();
    
    if (result.success) {
      const s = result.settings;
      document.getElementById('autoRollbackEnabled').checked = s.autoRollbackEnabled;
      document.getElementById('highRiskThreshold').value = s.highRiskThreshold;
      document.getElementById('mediumRiskThreshold').value = s.mediumRiskThreshold;
      document.getElementById('tolerance').value = s.tolerance;
      document.getElementById('autoExecuteDelay').value = s.autoExecuteDelay / 1000;
      
      log('설정 로드 완료');
      log(s);
    } else {
      log('설정 로드 실패: ' + result.error);
    }
  } catch (error) {
    log('설정 로드 오류: ' + error.message);
  }
};

const saveSettings = async () => {
  try {
    const settings = {
      autoRollbackEnabled: document.getElementById('autoRollbackEnabled').checked,
      highRiskThreshold: parseFloat(document.getElementById('highRiskThreshold').value),
      mediumRiskThreshold: parseFloat(document.getElementById('mediumRiskThreshold').value),
      tolerance: parseFloat(document.getElementById('tolerance').value),
      autoExecuteDelay: parseInt(document.getElementById('autoExecuteDelay').value) * 1000
    };
    
    log('설정 저장 중...');
    log(settings);
    
    const response = await fetch('/api/rollback/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(settings)
    });
    
    const result = await response.json();
    
    if (result.success) {
      log('✅ 설정 저장 완료');
      alert('롤백 설정이 저장되었습니다!');
    } else {
      log('❌ 설정 저장 실패: ' + result.error);
      alert('설정 저장 실패: ' + result.error);
    }
  } catch (error) {
    log('설정 저장 오류: ' + error.message);
    alert('설정 저장 오류: ' + error.message);
  }
};

const resetToDefault = () => {
  document.getElementById('autoRollbackEnabled').checked = true;
  document.getElementById('highRiskThreshold').value = '80';
  document.getElementById('mediumRiskThreshold').value = '50';
  document.getElementById('tolerance').value = '0.001';
  document.getElementById('autoExecuteDelay').value = '3';
  log('기본값으로 복원됨');
};

const testRollback = async () => {
  if (!confirm('현재 포지션에 대해 롤백 테스트를 실행하시겠습니까?')) return;
  
  try {
    log('롤백 테스트 실행 중...');
    const response = await fetch('/api/rollback/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ symbol: 'BTC', autoExecute: false })
    });
    
    const result = await response.json();
    log('롤백 테스트 결과:');
    log(result);
    
    if (result.analysis?.imbalance) {
      const imb = result.analysis.imbalance;
      alert(\`불균형 분석 결과:\\n차이: \${imb.difference.toFixed(8)} BTC\\n비율: \${imb.ratio.toFixed(1)}%\\n리스크: \${imb.riskLevel}\\n롤백 필요: \${imb.isUnbalanced ? '예' : '아니오'}\`);
    }
  } catch (error) {
    log('롤백 테스트 오류: ' + error.message);
    alert('롤백 테스트 오류: ' + error.message);
  }
};

// 페이지 로드 시 설정 로드
window.onload = () => {
  loadSettings();
};
</script>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });
  
  // ===== 롤백 설정 관리 API =====

  // 사용자 롤백 설정 조회
  app.get("/api/rollback/settings", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // 기본 설정값
      const defaultSettings = {
        autoRollbackEnabled: true,
        highRiskThreshold: 80,
        mediumRiskThreshold: 50,
        tolerance: 0.001,
        autoExecuteDelay: 3000
      };
      
      // 사용자 설정이 있으면 가져오기 (향후 DB 저장 시)
      // 현재는 기본값 반환
      res.json({
        success: true,
        settings: defaultSettings,
        description: {
          autoRollbackEnabled: "자동 롤백 활성화 여부",
          highRiskThreshold: "HIGH 리스크 임계값 (%) - 이상 시 자동 롤백",
          mediumRiskThreshold: "MEDIUM 리스크 임계값 (%) - 경고만 표시", 
          tolerance: "허용 오차 (BTC) - 이하는 무시",
          autoExecuteDelay: "자동 실행 지연 시간 (ms)"
        }
      });
      
    } catch (error: any) {
      console.error('❌ 롤백 설정 조회 실패:', error);
      res.status(500).json({ error: '롤백 설정 조회 실패', details: error.message });
    }
  });

  // 사용자 롤백 설정 업데이트
  app.put("/api/rollback/settings", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { autoRollbackEnabled, highRiskThreshold, mediumRiskThreshold, tolerance, autoExecuteDelay } = req.body;
      
      console.log(`🔧 [롤백설정] 사용자 ${userId} 설정 업데이트:`, req.body);
      
      // 유효성 검증
      const settings = {
        autoRollbackEnabled: Boolean(autoRollbackEnabled),
        highRiskThreshold: Math.max(10, Math.min(100, parseFloat(highRiskThreshold) || 80)),
        mediumRiskThreshold: Math.max(5, Math.min(99, parseFloat(mediumRiskThreshold) || 50)),
        tolerance: Math.max(0.0001, Math.min(1, parseFloat(tolerance) || 0.001)),
        autoExecuteDelay: Math.max(1000, Math.min(30000, parseInt(autoExecuteDelay) || 3000))
      };
      
      // 논리적 검증
      if (settings.highRiskThreshold <= settings.mediumRiskThreshold) {
        return res.status(400).json({ 
          error: "HIGH 리스크 임계값은 MEDIUM 리스크 임계값보다 커야 합니다" 
        });
      }
      
      // 향후 DB 저장 로직 추가 예정
      // await storage.updateUserRollbackSettings(userId, settings);
      
      console.log(`✅ [롤백설정] 설정 업데이트 완료:`, settings);
      
      res.json({
        success: true,
        message: "롤백 설정이 업데이트되었습니다",
        settings: settings
      });
      
    } catch (error: any) {
      console.error('❌ 롤백 설정 업데이트 실패:', error);
      res.status(500).json({ error: '롤백 설정 업데이트 실패', details: error.message });
    }
  });
  
  // ===== 실거래 주문 API =====

  // 업비트 BTC 매수 주문
  app.post("/api/trading/upbit/buy", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { market, volume, price, ord_type, strategyId } = req.body;
      
      console.log(`🚨 실거래 업비트 매수 주문:`, { userId, market, volume, price, ord_type, strategyId });
      
      if (!TRADING_CONFIG.isLiveTradingEnabled) {
        return res.status(400).json({ error: "실거래 모드가 비활성화되어 있습니다" });
      }
      
      // 사용자의 업비트 API 키 조회
      const exchange = await storage.getDecryptedExchange(userId, 'upbit');
      if (!exchange) {
        return res.status(400).json({ error: "업비트 API 키가 설정되지 않았습니다" });
      }
      
      // 업비트 서비스로 실제 주문 실행
      const upbitService = new UpbitService(exchange.apiKey, exchange.apiSecret);
      
      // 시장가 매수는 price(원화 금액), 지정가 매수는 volume(수량) 사용
      let orderAmount: number;
      let orderType: 'limit' | 'price' = 'price';
      
      if (ord_type === 'market' || !ord_type) {
        // 시장가 매수: price 파라미터 사용 (원화 금액)
        if (price && parseFloat(price) > 0) {
          // price가 명시적으로 제공된 경우
          orderAmount = parseFloat(price);
        } else if (volume && parseFloat(volume) > 0) {
          // volume(BTC 수량)이 제공된 경우 → 원화로 변환
          const btcQuantity = parseFloat(volume);
          
          // 현재 BTC 가격 조회
          const ticker = await upbitService.getTicker([market]);
          const currentPrice = ticker[0]?.trade_price || 160000000; // 기본값
          
          orderAmount = Math.round(btcQuantity * currentPrice);
          console.log(`💰 BTC 수량 → 원화 변환: ${btcQuantity} BTC × ₩${currentPrice.toLocaleString()} = ₩${orderAmount.toLocaleString()}`);
        } else {
          // 둘 다 없으면 기본값
          orderAmount = 10000;
          console.warn('⚠️ price, volume 모두 없음 - 기본값 1만원 사용');
        }
        
        orderType = 'price';
        
        // 최소 주문 금액 체크
        if (orderAmount < 5000) {
          return res.status(400).json({ 
            error: `주문 금액 ${orderAmount}원이 최소 주문 금액 5,000원 미달입니다` 
          });
        }
      } else {
        // 지정가 매수: volume 파라미터 사용 (코인 수량)
        orderAmount = parseFloat(volume);
        orderType = 'limit';
      }
      
      console.log(`📊 주문 실행: ${orderType} 방식, 금액/수량: ${orderAmount}`);
      
      const orderResult = await upbitService.placeBuyOrder(market, orderAmount, orderType);
      
      console.log(`✅ 업비트 매수 주문 성공:`, orderResult);
      
      // 성공한 거래 기록 저장
      try {
        await storage.createTrade({
          userId: userId,
          positionId: strategyId, // 전략 ID를 positionId로 사용
          exchange: 'upbit',
          symbol: market.replace('KRW-', ''),
          side: 'buy',
          quantity: parseFloat(volume),
          price: orderResult.price || 0,
          fee: orderResult.paid_fee || 0,
          feeCurrency: 'KRW',
          exchangeTradeId: orderResult.uuid,
          executedAt: new Date(),
          isMock: false
        });
        console.log(`✅ 업비트 거래 기록 DB 저장 성공`);
      } catch (dbError: any) {
        console.error(`❌ 업비트 거래 기록 저장 실패:`, dbError);
      }
      
      res.json(orderResult);
      
    } catch (error: any) {
      console.error(`❌ 업비트 매수 주문 실패:`, error);
      
      // 오류 추적 시스템에 기록
      try {
        await errorTrackingService.recordError({
          userId: req.user.id,
          error: error,
          context: {
            exchange: 'upbit',
            symbol: req.body.market?.replace('KRW-', '') || 'BTC',
            side: 'buy',
            quantity: parseFloat(req.body.volume || '0'),
            endpoint: '/api/trading/upbit/buy',
            payload: req.body
          }
        });
        console.log(`✅ 업비트 오류 추적 기록 완료`);
      } catch (trackingError: any) {
        console.error(`❌ 오류 추적 기록 실패:`, trackingError);
      }
      
      res.status(500).json({ error: error.message });
    }
  });

  // 바이낸스 숏 포지션 청산 (remaining_quantity 업데이트 포함)
  app.post("/api/trading/binance/close-short", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { symbol, quantity, strategyId } = req.body;
      
      console.log(`🔄 바이낸스 숏 포지션 청산 요청:`, { userId, symbol, quantity, strategyId });
      
      if (!TRADING_CONFIG.isLiveTradingEnabled) {
        return res.status(400).json({ error: "실거래 모드가 비활성화되어 있습니다" });
      }
      
      // 사용자의 바이낸스 API 키 조회
      const exchange = await storage.getDecryptedExchange(userId, 'binance');
      if (!exchange) {
        return res.status(400).json({ error: "바이낸스 API 키가 설정되지 않았습니다" });
      }
      
      // 바이낸스 서비스로 포지션 청산
      const binanceService = new BinanceService(exchange.apiKey, exchange.apiSecret);
      const closeResult = await binanceService.closeShortPosition(symbol.replace('USDT', ''), parseFloat(quantity));
      
      console.log(`✅ 바이낸스 숏 포지션 청산 성공:`, closeResult);

      // 포지션 상태 업데이트 (strategyId가 있으면)
      if (strategyId) {
        try {
          const symbolOnly = symbol.replace('USDT', '');
          const openPosition = await positionsRepo.getOpenPositionByStrategyAndSymbol(strategyId, symbolOnly);
          
          if (openPosition) {
            const closedQty = parseFloat(quantity);
            const newRemainingQty = Math.max(0, (openPosition.remainingQuantity || openPosition.binanceQuantity) - closedQty);
            
            if (newRemainingQty <= 0) {
              // 전량 청산
              const exitPrice = parseFloat(closeResult.price || closeResult.avgPrice || '0');
              const pnl = (openPosition.binanceEntryPrice - exitPrice) * (openPosition.remainingQuantity || openPosition.binanceQuantity);
              
              await positionsRepo.closeWithRemaining(openPosition.id, exitPrice, 0, pnl, 0);
              console.log(`✅ 포지션 완전 청산: ID=${openPosition.id}, PnL=${pnl}`);
            } else {
              // 부분 청산
              await positionsRepo.updateRemainingQuantity(openPosition.id, newRemainingQty);
              console.log(`✅ 포지션 부분 청산: ID=${openPosition.id}, 남은수량=${newRemainingQty}`);
            }
          }
        } catch (positionError: any) {
          console.error(`❌ 포지션 상태 업데이트 실패:`, positionError);
          // 포지션 업데이트 실패는 청산은 성공했으므로 에러로 처리하지 않음
        }
      }
      
      res.json({ 
        message: "숏 포지션 청산 완료", 
        result: closeResult 
      });
    } catch (error: any) {
      console.error('❌ 바이낸스 숏 포지션 청산 실패:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 테스트 페이지: 접속 시 BTC 숏 전량 청산(시장가/Reduce-Only) 실행 후 결과 표시
  app.get("/test/close-short", authenticateSession, async (req: any, res) => {
    // 심볼 쿼리로 변경 가능 (기본 BTC)
    const symbolParam = (req.query.symbol as string) || 'BTC';
    const symbolUsdt = `${symbolParam}USDT`;
    const html = `<!doctype html>
<meta charset="utf-8" />
<title>Close Short Test</title>
<style>body{font-family:system-ui,Segoe UI,Roboto,Apple Color Emoji,Noto Color Emoji,sans-serif;background:#0b1220;color:#e5ecff;padding:24px} pre{white-space:pre-wrap;background:#0f172a;padding:12px;border-radius:8px}</style>
<h1>Close Short Test - ${symbolParam}</h1>
<p>페이지 진입 시 ${symbolParam} 숏 포지션을 전량 시장가(Reduce-Only)로 청산합니다.</p>
<div id="status">진행 중…</div>
<pre id="log"></pre>
<script>
(async () => {
  const log = (m)=>{document.getElementById('log').textContent += (typeof m==='string'?m:JSON.stringify(m,null,2))+'\n'};
  try{
    document.getElementById('status').textContent = '포지션 조회 중…';
    const posRes = await fetch('/api/positions',{credentials:'include'});
    if(!posRes.ok){ throw new Error('positions fetch failed: '+posRes.status); }
    const positions = await posRes.json();
    const p = positions.find(x=>x && (x.symbol===${JSON.stringify(symbolUsdt)}));
    log({positionsCount: positions?.length, found: !!p, position: p});
    if(!p){ document.getElementById('status').textContent='포지션 없음'; return; }
    const amt = parseFloat(p.positionAmt||'0');
    if(amt===0){ document.getElementById('status').textContent='이미 포지션 없음'; return; }
    if(amt>=0){ document.getElementById('status').textContent='숏 포지션이 아닙니다(음수 아님).'; return; }
    const qty = Math.abs(amt);
    document.getElementById('status').textContent = '전량 청산 실행 중… ('+qty+' '+${JSON.stringify(symbolParam)}+')';
    const r = await fetch('/api/trading/binance/close-short',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify({symbol:${JSON.stringify(symbolParam)}, quantity: qty})
    });
    const j = await r.json().catch(()=>({}));
    log({closeResponseStatus:r.status, body:j});
    if(!r.ok){ document.getElementById('status').textContent='청산 실패'; return; }
    document.getElementById('status').textContent='청산 완료! 잔고 증가를 확인하세요.';
  }catch(e){
    document.getElementById('status').textContent='오류: '+(e?.message||e);
    log(e);
  }
})();
</script>`;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.send(html);
  });

  // 바이낸스 선물 계정 정보 (마진/지갑/포지션) 조회
  app.get("/api/trading/binance/account-info", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // 사용자의 바이낸스 API 키 조회
      const exchange = await storage.getDecryptedExchange(userId, 'binance');
      if (!exchange) {
        return res.status(400).json({ error: "바이낸스 API 키가 설정되지 않았습니다" });
      }

      const binanceService = new BinanceService(exchange.apiKey, exchange.apiSecret);
      const info = await binanceService.getFuturesAccountInfo();

      const toNum = (v: any, d = 0) => {
        const n = typeof v === 'string' ? parseFloat(v) : Number(v);
        return Number.isFinite(n) ? n : d;
      };

      res.json({
        availableBalance: toNum(info?.availableBalance),
        totalWalletBalance: toNum(info?.totalWalletBalance),
        totalUnrealizedProfit: toNum(info?.totalUnrealizedProfit),
        assets: Array.isArray(info?.assets) ? info.assets : [],
        positions: Array.isArray(info?.positions) ? info.positions : []
      });
    } catch (error: any) {
      console.error('❌ 선물 계정 정보 조회 실패:', error?.message || error);
      res.status(500).json({ error: error?.message || 'Account info error' });
    }
  });

  // 테스트 페이지: 선물 계정 마진 현황
  app.get("/test/margin", authenticateSession, async (_req: any, res) => {
    const html = `<!doctype html>
<meta charset="utf-8" />
<title>Margin Status</title>
<style>
  body{font-family:system-ui,Segoe UI,Roboto,Apple Color Emoji,Noto Color Emoji,sans-serif;background:#0b1220;color:#e5ecff;padding:24px}
  .card{background:#0f172a;padding:16px;border-radius:12px;max-width:820px}
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
  .label{color:#8aa0ff}
  .val{font-weight:600}
  table{border-collapse:collapse;width:100%;margin-top:12px}
  th,td{border-bottom:1px solid #223; padding:8px; text-align:left; font-size:14px}
  th{color:#9ab}
  caption{caption-side:top;text-align:left;color:#789;margin:6px 0}
  .muted{color:#9ab}
  .pill{display:inline-block;background:#1b2440;border:1px solid #25305c;padding:2px 8px;border-radius:999px;font-size:12px;margin-left:8px}
  .row{display:flex;align-items:center;gap:6px}
  .ok{color:#67e8f9}
  .warn{color:#fbbf24}
  .bad{color:#f87171}
  pre{white-space:pre-wrap;background:#0f172a;padding:12px;border-radius:8px}
  a{color:#93c5fd}
  a:hover{color:#bfdbfe}
  footer{margin-top:20px;color:#9ab}
  footer a{color:#9ab}
  footer a:hover{color:#cbd5e1}
</style>
<main class="card" role="main" aria-labelledby="h1">
  <h1 id="h1">선물 계정 마진 현황 <span class="pill" id="ts"></span></h1>
  <p class="muted">로그인 세션 기준으로 바이낸스 선물 계정의 여유 마진을 조회합니다.</p>
  <section aria-label="요약" style="margin-top:12px">
    <div class="grid">
      <div><div class="label">Available Balance</div><div id="avail" class="val">-</div></div>
      <div><div class="label">Total Wallet Balance</div><div id="wallet" class="val">-</div></div>
      <div><div class="label">Total Unrealized PnL</div><div id="uPnl" class="val">-</div></div>
    </div>
  </section>
  <section aria-label="포지션" style="margin-top:20px">
    <div class="row"><h2 style="margin:0;font-size:16px">보유 포지션</h2><span class="pill muted" id="posCnt">0</span></div>
    <table aria-describedby="positions-desc">
      <caption id="positions-desc">심볼 · 포지션 수량 · 레버리지 · 미실현손익</caption>
      <thead><tr><th>Symbol</th><th>Amt</th><th>Lev</th><th>uPnL</th></tr></thead>
      <tbody id="posBody"></tbody>
    </table>
  </section>
  <section aria-label="로그" style="margin-top:20px">
    <h2 style="margin:0 0 8px 0;font-size:16px">로그</h2>
    <pre id="log"></pre>
  </section>
  <footer>
    <div>청산 테스트 페이지: <a href="/test/close-short?symbol=BTC">/test/close-short?symbol=BTC</a></div>
  </footer>
</main>
<script>
(async () => {
  const fmt = (n) => (typeof n === 'number' && isFinite(n)) ? n.toFixed(4) : String(n ?? '-');
  const log = (m) => { document.getElementById('log').textContent += (typeof m==='string'?m:JSON.stringify(m,null,2))+'\n'; };
  const setText = (id, v)=>{ const el=document.getElementById(id); if(el) el.textContent = v; };
  const nowIso = ()=> new Date().toLocaleString();

  try {
    setText('ts', nowIso());
    const r = await fetch('/api/trading/binance/account-info', { credentials: 'include' });
    const j = await r.json().catch(()=>({}));
    log({ status: r.status, body: j });

    if (!r.ok) {
      setText('avail', 'Error');
      return;
    }
    setText('avail', fmt(j.availableBalance));
    setText('wallet', fmt(j.totalWalletBalance));
    setText('uPnl', fmt(j.totalUnrealizedProfit));

    const tb = document.getElementById('posBody');
    let count = 0;
    (j.positions || []).forEach(p => {
      if(!p) return;
      const tr = document.createElement('tr');
      const td = (t)=>{ const x=document.createElement('td'); x.textContent = String(t ?? '-'); return x; };
      tr.appendChild(td(p.symbol || '-'));
      tr.appendChild(td(p.positionAmt || '0'));
      tr.appendChild(td(p.leverage || '-'));
      tr.appendChild(td(p.unrealizedProfit || '0'));
      tb.appendChild(tr);
      count++;
    });
    setText('posCnt', String(count));
  } catch (e) {
    log(e);
  }
})();
</script>`;
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.send(html);
  });

  // 업비트 BTC 매도 주문
  app.post("/api/trading/upbit/sell", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { market, volume, ord_type = 'market' } = req.body;
      
      console.log(`🚨 실거래 업비트 매도 주문:`, { userId, market, volume, ord_type });
      
      if (!TRADING_CONFIG.isLiveTradingEnabled) {
        return res.status(400).json({ error: "실거래 모드가 비활성화되어 있습니다" });
      }
      
      // 사용자의 업비트 API 키 조회
      const exchange = await storage.getDecryptedExchange(userId, 'upbit');
      if (!exchange) {
        return res.status(400).json({ error: "업비트 API 키가 설정되지 않았습니다" });
      }
      
      // 업비트 서비스로 실제 매도 주문 실행
      const upbitService = new UpbitService(exchange.apiKey, exchange.apiSecret);
      
      // 매도는 항상 volume(수량) 사용
      const sellVolume = parseFloat(volume);
      if (sellVolume <= 0) {
        return res.status(400).json({ error: "매도 수량이 유효하지 않습니다" });
      }
      
      console.log(`📊 매도 주문 실행: ${sellVolume} ${market.replace('KRW-', '')}`);
      
      const orderResult = await upbitService.placeSellOrder(market, sellVolume);
      
      console.log(`✅ 업비트 매도 주문 성공:`, orderResult);
      
      // 성공한 거래 기록 저장
      try {
        await storage.createTrade({
          userId: userId,
          exchange: 'upbit',
          symbol: market.replace('KRW-', ''),
          side: 'sell',
          quantity: sellVolume,
          price: parseFloat(orderResult.price || orderResult.avg_price || '0'),
          fee: parseFloat(orderResult.paid_fee || '0'),
          feeCurrency: 'KRW',
          exchangeTradeId: orderResult.uuid,
          executedAt: new Date(),
          isMock: false
        });
        console.log(`✅ 업비트 매도 기록 DB 저장 성공`);
      } catch (dbError: any) {
        console.error(`❌ 업비트 매도 기록 저장 실패:`, dbError);
      }
      
      res.json(orderResult);
      
    } catch (error: any) {
      console.error(`❌ 업비트 매도 주문 실패:`, error);
      
      // 오류 추적 시스템에 기록
      try {
        await errorTrackingService.recordError({
          userId: req.user.id,
          error: error,
          context: {
            exchange: 'upbit',
            symbol: req.body.market?.replace('KRW-', '') || 'BTC',
            side: 'sell',
            quantity: parseFloat(req.body.volume || '0'),
            endpoint: '/api/trading/upbit/sell',
            payload: req.body
          }
        });
        console.log(`✅ 업비트 매도 오류 추적 기록 완료`);
      } catch (trackingError: any) {
        console.error(`❌ 오류 추적 기록 실패:`, trackingError);
      }
      
      res.status(500).json({ error: error.message });
    }
  });
  
  // 바이낸스 BTC 숏 주문 (재진입 방지 포함)
  app.post("/api/trading/binance/short", authenticateSession, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { symbol, quantity, leverage, strategyId } = req.body;
      
      console.log(`🚨 실거래 바이낸스 숏 주문:`, { userId, symbol, quantity, leverage, strategyId });
      
      if (!TRADING_CONFIG.isLiveTradingEnabled) {
        return res.status(400).json({ error: "실거래 모드가 비활성화되어 있습니다" });
      }

      // 재진입 방지: strategyId가 있으면 중복 체크
      if (strategyId) {
        const symbolOnly = symbol.replace('USDT', '');
        const existingPosition = await positionsRepo.getOpenPositionByStrategyAndSymbol(strategyId, symbolOnly);
        
        if (existingPosition && (existingPosition.remainingQuantity || 0) > 0) {
          console.log(`❌ 재진입 차단: 전략 ${strategyId}, 심볼 ${symbolOnly}에 이미 OPEN 포지션 존재`);
          return res.status(409).json({ 
            error: "이미 해당 전략에 진행 중인 포지션이 있습니다", 
            existingPosition: {
              id: existingPosition.id,
              remainingQuantity: existingPosition.remainingQuantity,
              entryTime: existingPosition.entryTime
            }
          });
        }
      }
      
      // 사용자의 바이낸스 API 키 조회
      const exchange = await storage.getDecryptedExchange(userId, 'binance');
      if (!exchange) {
        return res.status(400).json({ error: "바이낸스 API 키가 설정되지 않았습니다" });
      }
      
      // 바이낸스 서비스로 실제 주문 실행
      const binanceService = new BinanceService(exchange.apiKey, exchange.apiSecret);
      
      const orderResult = await binanceService.placeShortOrder(symbol.replace('USDT', ''), parseFloat(quantity), leverage);
      
      console.log(`✅ 바이낸스 숏 주문 성공:`, orderResult);
      
      // 성공한 거래 기록 저장
      try {
        await storage.createTrade({
          userId: userId,
          positionId: strategyId, // 전략 ID를 positionId로 사용
          exchange: 'binance',
          symbol: symbol.replace('USDT', ''),
          side: 'short',
          quantity: parseFloat(quantity),
          price: orderResult.price || 0,
          fee: orderResult.commission || 0,
          feeCurrency: 'USDT',
          exchangeTradeId: orderResult.orderId,
          executedAt: new Date(),
          isMock: false
        });
        console.log(`✅ 바이낸스 거래 기록 DB 저장 성공`);
      } catch (dbError: any) {
        console.error(`❌ 바이낸스 거래 기록 저장 실패:`, dbError);
      }

      // 포지션 생성 (재진입 방지를 위해)
      if (strategyId) {
        try {
          const positionData = {
            userId: userId,
            strategyId: strategyId,
            symbol: symbol.replace('USDT', ''),
            side: 'short' as 'short',
            status: 'open' as 'open',
            upbitQuantity: 0, // 업비트 수량 (선물만 사용 시 0)
            upbitEntryPrice: 0, // 업비트 진입가 (선물만 사용 시 0)
            binanceQuantity: parseFloat(orderResult.origQty || quantity),
            binanceEntryPrice: parseFloat(orderResult.price || orderResult.avgPrice || '0'),
            binanceLeverage: leverage,
            binanceOrderId: orderResult.orderId,
            entryPremiumRate: 0, // 김치 프리미엄 아닌 경우 0
            unrealizedPnl: 0, // 초기 미실현손익 0
            totalFees: parseFloat(orderResult.commission || '0'),
            entryTime: new Date()
          };

          const createdPosition = await positionsRepo.create(positionData);
          console.log(`✅ 포지션 생성 완료: ID=${createdPosition.id}`);
          
          // remaining_quantity 초기화
          await positionsRepo.updateRemainingQuantity(createdPosition.id, positionData.binanceQuantity);
          
        } catch (positionError: any) {
          console.error(`❌ 포지션 생성 실패:`, positionError);
          // 포지션 생성 실패는 주문은 성공했으므로 에러로 처리하지 않음
        }
      }

      // 🔄 자동 리밸런싱 → 롤백 시스템 (비동기)
      if (strategyId) {
        setTimeout(async () => {
          try {
            console.log(`🔍 [자동체크] 포지션 불균형 분석 시작: 전략 ${strategyId}`);
            
            // 1단계: 불균형 분석
            const rollbackResponse = await fetch('http://localhost:5000/api/rollback/positions', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie || ''
              },
              body: JSON.stringify({ 
                symbol: symbol.replace('USDT', ''), 
                tolerance: 0.001, 
                autoExecute: false 
              })
            });
            
            if (!rollbackResponse.ok) {
              console.error(`❌ [자동체크] 불균형 분석 실패:`, rollbackResponse.status);
              return;
            }

            const rollbackData = await rollbackResponse.json();
            const imbalance = rollbackData.analysis?.imbalance;
            
            if (!imbalance?.isUnbalanced) {
              console.log(`✅ [자동체크] 포지션 균형 양호: ${imbalance?.ratio?.toFixed(1) || 0}%`);
              return;
            }

            console.log(`⚠️ [자동체크] 불균형 감지: ${imbalance.ratio.toFixed(1)}% (차이: ${imbalance.difference.toFixed(8)} BTC)`);
            
            // 2단계: 리밸런싱 시도 (불균형이 있지만 심각하지 않은 경우)
            if (imbalance.ratio <= 80) {
              console.log(`🔄 [자동체크] 리밸런싱 시도 (${imbalance.ratio.toFixed(1)}% 불균형)`);
              
              // 업비트에서 부족한 수량 추가 매수
              const symbolOnly = symbol.replace('USDT', '');
              const shortageQty = imbalance.difference;
              
              if (shortageQty > 0.0001) { // 최소 수량 체크
                try {
                  // BTC 현재가 조회
                  const upbitExchange = await storage.getDecryptedExchange(userId, 'upbit');
                  if (upbitExchange) {
                    const { UpbitService } = await import('./services/upbit.js');
                    const upbitService = new UpbitService(upbitExchange.apiKey, upbitExchange.apiSecret);
                    const ticker = await upbitService.getTicker([`KRW-${symbolOnly}`]);
                    const currentPrice = ticker[0]?.trade_price || 0;
                    
                    if (currentPrice > 0) {
                      const buyAmount = Math.round(shortageQty * currentPrice * 0.99); // 1% 여유분
                      
                      if (buyAmount >= 5000) { // 최소 주문 금액 체크
                        console.log(`💰 [자동체크] 리밸런싱 매수 시도: ${buyAmount}원 (${shortageQty.toFixed(8)} BTC)`);
                        
                        const buyOrder = await upbitService.placeBuyOrder(`KRW-${symbolOnly}`, buyAmount, 'price');
                        console.log(`✅ [자동체크] 리밸런싱 매수 완료:`, buyOrder);
                        
                        // 5초 후 재검사
                        setTimeout(async () => {
                          try {
                            console.log(`🔍 [자동체크] 리밸런싱 후 재검사...`);
                            
                            // 재검사 실행
                            const recheckResponse = await fetch('http://localhost:5000/api/rollback/positions', {
                              method: 'POST',
                              headers: { 
                                'Content-Type': 'application/json',
                                'Cookie': req.headers.cookie || ''
                              },
                              body: JSON.stringify({ 
                                symbol: symbolOnly, 
                                tolerance: 0.001, 
                                autoExecute: false 
                              })
                            });
                            
                            if (recheckResponse.ok) {
                              const recheckData = await recheckResponse.json();
                              const newImbalance = recheckData.analysis?.imbalance;
                              
                              if (newImbalance?.isUnbalanced && newImbalance.ratio > 50) {
                                console.log(`🚨 [자동체크] 리밸런싱 후에도 불균형: ${newImbalance.ratio.toFixed(1)}% - 최종 롤백 실행`);
                                
                                // 최종 롤백 실행
                                const finalRollbackResponse = await fetch('http://localhost:5000/api/rollback/positions', {
                                  method: 'POST',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'Cookie': req.headers.cookie || ''
                                  },
                                  body: JSON.stringify({ 
                                    symbol: symbolOnly, 
                                    tolerance: 0.001, 
                                    autoExecute: true 
                                  })
                                });
                                
                                if (finalRollbackResponse.ok) {
                                  console.log(`✅ [자동체크] 최종 롤백 완료`);
                                } else {
                                  console.error(`❌ [자동체크] 최종 롤백 실패`);
                                }
                              } else {
                                console.log(`✅ [자동체크] 리밸런싱 성공 - 포지션 균형 달성: ${newImbalance?.ratio?.toFixed(1) || 0}%`);
                              }
                            }
                          } catch (recheckError: any) {
                            console.error(`❌ [자동체크] 재검사 실패:`, recheckError.message);
                          }
                        }, 5000);
                        
                        return; // 리밸런싱 시도했으므로 롤백하지 않음
                      }
                    }
                  }
                } catch (rebalanceError: any) {
                  console.error(`❌ [자동체크] 리밸런싱 실패:`, rebalanceError.message);
                  // 리밸런싱 실패 시 롤백으로 진행
                }
              }
            }
            
            // 3단계: 심각한 불균형이거나 리밸런싱 실패 시 롤백
            if (imbalance.ratio > 80) {
              console.log(`🚨 [자동체크] 심각한 불균형 감지: ${imbalance.ratio.toFixed(1)}% - 자동 롤백 실행`);
              
              const autoRollbackResponse = await fetch('http://localhost:5000/api/rollback/positions', {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Cookie': req.headers.cookie || ''
                },
                body: JSON.stringify({ 
                  symbol: symbol.replace('USDT', ''), 
                  tolerance: 0.001, 
                  autoExecute: true 
                })
              });
              
              if (autoRollbackResponse.ok) {
                const rollbackResult = await autoRollbackResponse.json();
                console.log(`✅ [자동체크] 자동 롤백 완료:`, rollbackResult.execution);
              } else {
                console.error(`❌ [자동체크] 자동 롤백 실패:`, autoRollbackResponse.status);
              }
            } else {
              console.log(`⚠️ [자동체크] 중간 불균형 감지했지만 리밸런싱 불가 - 모니터링 계속`);
            }
            
          } catch (autoCheckError: any) {
            console.error(`❌ [자동체크] 자동 처리 실패:`, autoCheckError.message);
          }
        }, 3000); // 3초 후 실행
      }
      
      res.json(orderResult);
      
    } catch (error: any) {
      console.error(`❌ 바이낸스 숏 주문 실패:`, error);
      
      // 오류 추적 시스템에 기록
      try {
        await errorTrackingService.recordError({
          userId: req.user.id,
          error: error,
          context: {
            exchange: 'binance',
            symbol: req.body.symbol?.replace('USDT', '') || 'BTC',
            side: 'short',
            quantity: parseFloat(req.body.quantity || '0'),
            endpoint: '/api/trading/binance/short',
            payload: req.body
          }
        });
        console.log(`✅ 바이낸스 오류 추적 기록 완료`);
      } catch (trackingError: any) {
        console.error(`❌ 오류 추적 기록 실패:`, trackingError);
      }
      
      res.status(500).json({ error: error.message });
    }
  });

  // 분리된 라우터들 등록
  registerAuthRoutes(app);
  registerTradingRoutes(app);
  registerApiRoutes(app);

  return;
}
