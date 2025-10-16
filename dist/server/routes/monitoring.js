import { storage } from "../storage.js";
export function registerMonitoringRoutes(app) {
    // === 거래 모니터링 API ===
    // 최근 거래 내역 (trade_logs와 조인)
    app.get('/api/monitoring/trades', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const data = await storage.getTradesWithLogs(limit);
            res.json({
                success: true,
                data,
                count: data.length
            });
        }
        catch (error) {
            console.error('거래 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 일별 거래 통계
    app.get('/api/monitoring/stats/daily', async (req, res) => {
        try {
            const days = parseInt(req.query.days) || 7;
            const data = await storage.getDailyTradeStats(days);
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('일별 통계 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 거래소별 성과 분석
    app.get('/api/monitoring/stats/exchanges', async (req, res) => {
        try {
            const hours = parseInt(req.query.hours) || 24;
            const data = await storage.getExchangeStats(hours);
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('거래소별 통계 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 김프 분석 (trade_logs 기반)
    app.get('/api/monitoring/kimp/analysis', async (req, res) => {
        try {
            const days = parseInt(req.query.days) || 7;
            const data = await storage.getKimpAnalysis(days);
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('김프 분석 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 실시간 거래 현황 대시보드
    app.get('/api/monitoring/dashboard', async (_req, res) => {
        try {
            const data = await storage.getDashboardData();
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('대시보드 데이터 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 거래 로그 분석 - 성공/실패 패턴
    app.get('/api/monitoring/logs/patterns', async (_req, res) => {
        try {
            const data = await storage.getTradeLogPatterns();
            res.json({
                success: true,
                data
            });
        }
        catch (error) {
            console.error('패턴 분석 조회 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 진입가가 0인 포지션 자동 수정
    app.post('/api/monitoring/fix-entry-prices', async (_req, res) => {
        try {
            console.log('🔧 진입가 0인 포지션 자동 수정 시작...');
            // 진입가가 0인 포지션 조회
            const zeroEntryPositions = await storage.pool.query(`
        SELECT id, entry_price, binance_entry_price, created_at
        FROM positions
        WHERE (entry_price = 0 OR binance_entry_price = 0)
          AND status = 'open'
        ORDER BY id DESC
        LIMIT 50
      `);
            if (zeroEntryPositions.rows.length === 0) {
                res.json({
                    success: true,
                    message: '수정할 포지션이 없습니다',
                    fixed: 0,
                    failed: 0
                });
                return;
            }
            console.log(`📊 수정 대상: ${zeroEntryPositions.rows.length}개 포지션`);
            const results = {
                fixed: 0,
                failed: 0,
                details: []
            };
            // 각 포지션별로 수정
            for (const position of zeroEntryPositions.rows) {
                try {
                    // trades 테이블에서 진입가 조회
                    const tradesResult = await storage.pool.query(`
            SELECT
              MAX(CASE WHEN exchange = 'upbit' AND side = 'buy' THEN price END) as upbit_entry_price,
              MAX(CASE WHEN exchange = 'binance' AND side IN ('sell', 'short') THEN price END) as binance_entry_price
            FROM trades
            WHERE position_id = $1
            GROUP BY position_id
          `, [position.id]);
                    if (tradesResult.rows.length === 0) {
                        console.warn(`⚠️ 포지션 ${position.id}: 거래 기록 없음`);
                        results.failed++;
                        results.details.push({
                            positionId: position.id,
                            status: 'failed',
                            reason: 'no_trades'
                        });
                        continue;
                    }
                    const { upbit_entry_price, binance_entry_price } = tradesResult.rows[0];
                    if (!upbit_entry_price || !binance_entry_price) {
                        console.warn(`⚠️ 포지션 ${position.id}: 진입가 데이터 불완전`, {
                            upbit: upbit_entry_price,
                            binance: binance_entry_price
                        });
                        results.failed++;
                        results.details.push({
                            positionId: position.id,
                            status: 'failed',
                            reason: 'incomplete_data',
                            upbit: upbit_entry_price,
                            binance: binance_entry_price
                        });
                        continue;
                    }
                    // 포지션 업데이트
                    await storage.pool.query(`
            UPDATE positions
            SET entry_price = $1, binance_entry_price = $2, updated_at = NOW()
            WHERE id = $3
          `, [upbit_entry_price, binance_entry_price, position.id]);
                    console.log(`✅ 포지션 ${position.id} 수정 완료:`, {
                        upbit: Number(upbit_entry_price),
                        binance: Number(binance_entry_price)
                    });
                    results.fixed++;
                    results.details.push({
                        positionId: position.id,
                        status: 'fixed',
                        upbit: Number(upbit_entry_price),
                        binance: Number(binance_entry_price)
                    });
                }
                catch (error) {
                    console.error(`❌ 포지션 ${position.id} 수정 실패:`, error);
                    results.failed++;
                    results.details.push({
                        positionId: position.id,
                        status: 'error',
                        error: error.message
                    });
                }
            }
            res.json({
                success: true,
                message: `수정 완료: ${results.fixed}개 성공, ${results.failed}개 실패`,
                fixed: results.fixed,
                failed: results.failed,
                details: results.details
            });
        }
        catch (error) {
            console.error('❌ 진입가 수정 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    // 바이낸스 API에서 실제 거래 데이터 가져와서 진입가 수정
    app.post('/api/monitoring/fix-entry-prices-from-api', async (req, res) => {
        try {
            console.log('🔧 바이낸스 API로부터 진입가 수정 시작...');
            const { userId } = req.body;
            if (!userId) {
                res.status(400).json({ success: false, error: 'userId is required' });
                return;
            }
            // 바이낸스 진입가가 0인 포지션 조회
            const zeroEntryPositions = await storage.pool.query(`
        SELECT id, symbol, binance_order_id, upbit_order_id, entry_price, binance_entry_price
        FROM positions
        WHERE binance_entry_price = 0
          AND status = 'open'
          AND user_id = $1
          AND binance_order_id IS NOT NULL
        ORDER BY id DESC
        LIMIT 50
      `, [userId]);
            if (zeroEntryPositions.rows.length === 0) {
                res.json({
                    success: true,
                    message: '수정할 포지션이 없습니다',
                    fixed: 0,
                    failed: 0
                });
                return;
            }
            console.log(`📊 수정 대상: ${zeroEntryPositions.rows.length}개 포지션`);
            // 바이낸스 서비스 초기화
            const { ExchangeServiceFactory } = await import('../services/exchange-factory.js');
            const services = await ExchangeServiceFactory.initializeByUserId(userId);
            if (!services.binanceService) {
                res.status(400).json({ success: false, error: '바이낸스 API 키가 설정되지 않았습니다' });
                return;
            }
            const results = {
                fixed: 0,
                failed: 0,
                details: []
            };
            // 각 포지션별로 바이낸스 API 조회
            for (const position of zeroEntryPositions.rows) {
                try {
                    const orderId = position.binance_order_id;
                    const symbol = position.symbol;
                    console.log(`🔍 포지션 ${position.id}: 바이낸스 주문 ${orderId} 조회 중...`);
                    // 바이낸스 API에서 주문 정보 조회
                    const orderInfo = await services.binanceService.getFuturesOrderDetail(symbol, parseInt(orderId));
                    if (!orderInfo) {
                        console.warn(`⚠️ 포지션 ${position.id}: 바이낸스 주문을 찾을 수 없음`);
                        results.failed++;
                        results.details.push({
                            positionId: position.id,
                            status: 'failed',
                            reason: 'order_not_found'
                        });
                        continue;
                    }
                    const avgPrice = parseFloat(orderInfo.avgPrice || '0');
                    if (avgPrice === 0) {
                        console.warn(`⚠️ 포지션 ${position.id}: 체결가가 0`);
                        results.failed++;
                        results.details.push({
                            positionId: position.id,
                            status: 'failed',
                            reason: 'zero_price',
                            orderInfo
                        });
                        continue;
                    }
                    // 포지션 업데이트
                    await storage.pool.query(`
            UPDATE positions
            SET binance_entry_price = $1, updated_at = NOW()
            WHERE id = $2
          `, [avgPrice, position.id]);
                    // trades 테이블에도 기록 추가 (없는 경우)
                    const existingTrade = await storage.pool.query(`
            SELECT id FROM trades
            WHERE position_id = $1 AND exchange = 'binance' AND side IN ('sell', 'short')
          `, [position.id]);
                    if (existingTrade.rows.length === 0) {
                        await storage.createTrade({
                            userId: userId,
                            positionId: position.id,
                            symbol: symbol,
                            side: 'sell',
                            exchange: 'binance',
                            quantity: orderInfo.executedQty || '0',
                            price: avgPrice,
                            fee: parseFloat(orderInfo.commission || '0'),
                            exchangeOrderId: orderId
                        });
                        console.log(`✅ 포지션 ${position.id}: trades 기록 추가`);
                    }
                    console.log(`✅ 포지션 ${position.id} 수정 완료: 바이낸스 진입가 ${avgPrice}`);
                    results.fixed++;
                    results.details.push({
                        positionId: position.id,
                        status: 'fixed',
                        binancePrice: avgPrice,
                        upbitPrice: Number(position.entry_price)
                    });
                }
                catch (error) {
                    console.error(`❌ 포지션 ${position.id} 수정 실패:`, error);
                    results.failed++;
                    results.details.push({
                        positionId: position.id,
                        status: 'error',
                        error: error.message
                    });
                }
            }
            res.json({
                success: true,
                message: `수정 완료: ${results.fixed}개 성공, ${results.failed}개 실패`,
                fixed: results.fixed,
                failed: results.failed,
                details: results.details
            });
        }
        catch (error) {
            console.error('❌ 바이낸스 API 진입가 수정 실패:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
    console.log('✅ 모니터링 API 라우터 등록 완료');
}
