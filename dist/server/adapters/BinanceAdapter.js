import crypto from 'crypto';
import { BaseExchangeAdapter } from './ExchangeAdapter.js';
import { TRADING_FEES } from '../types/constants.js';
import { globalRateLimiter } from '../utils/rate-limiter.js';
import { proxyManager } from '../utils/proxy-manager.js';
import { ipBanDetector } from '../utils/ip-ban-detector.js';
/**
 * 바이낸스 거래소 어댑터
 * 바이낸스 API와 연동하여 실거래 기능 제공 (현물 + 선물)
 */
export class BinanceAdapter extends BaseExchangeAdapter {
    name = 'binance';
    isTestnet = process.env.NODE_ENV !== 'production';
    baseUrl = this.isTestnet
        ? 'https://testnet.binance.vision'
        : 'https://api.binance.com';
    futuresBaseUrl = this.isTestnet
        ? 'https://testnet.binancefuture.com'
        : 'https://fapi.binance.com';
    /**
     * 공개(서명 불필요) 엔드포인트 여부
     * 공개 엔드포인트만 whitelist 하고, 나머지는 기본적으로 인증 필요
     */
    isPublicEndpoint(endpoint) {
        return [
            '/api/v3/ticker/price',
            '/api/v3/depth',
            '/api/v3/exchangeInfo'
        ].some((prefix) => endpoint.startsWith(prefix));
    }
    /**
     * HMAC 서명 생성
     */
    generateSignature(queryString) {
        this.validateCredentials();
        return crypto.createHmac('sha256', this.secretKey).update(queryString).digest('hex');
    }
    /**
     * API 요청 헬퍼
     */
    async apiRequest(endpoint, method = 'GET', params = {}, isFutures = false) {
        let currentProxy = null;
        let retryCount = 0;
        const maxRetries = 3;
        while (retryCount < maxRetries) {
            try {
                // IP 밴 상태 확인
                if (ipBanDetector.isBanned('binance')) {
                    console.warn(`🚫 [Binance] IP 밴 상태 - 복구 대기 중`);
                    throw new Error('Binance IP 밴 상태입니다. 잠시 후 재시도하세요.');
                }
                // Rate Limit 확인
                const rateLimitCheck = await globalRateLimiter.checkLimit('binance', endpoint);
                if (!rateLimitCheck.allowed) {
                    if (rateLimitCheck.waitTime && rateLimitCheck.waitTime < 30000) { // 30초 미만이면 대기
                        console.log(`⏰ [Binance] Rate Limit 도달, ${Math.ceil(rateLimitCheck.waitTime / 1000)}초 대기`);
                        await globalRateLimiter.waitForReset('binance', endpoint);
                    }
                    else {
                        throw new Error(`Binance Rate Limit 도달: ${Math.ceil((rateLimitCheck.waitTime || 0) / 1000)}초 후 재시도`);
                    }
                }
                // 프록시 선택 (필요시)
                if (retryCount > 0 || ipBanDetector.isBanned('binance')) {
                    currentProxy = proxyManager.getNextProxy();
                    if (currentProxy) {
                        console.log(`🔄 [Binance] 프록시 사용: ${currentProxy.host}:${currentProxy.port}`);
                    }
                }
                const baseUrl = isFutures ? this.futuresBaseUrl : this.baseUrl;
                const timestamp = Date.now();
                // 공개 엔드포인트만 예외 처리, 기본은 인증 필요
                const needsAuth = !this.isPublicEndpoint(endpoint);
                if (needsAuth) {
                    params.timestamp = timestamp;
                }
                const queryString = new URLSearchParams(params).toString();
                const url = `${baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
                const options = {
                    method,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (compatible; TradingBot/1.0)'
                    }
                };
                // 프록시 적용
                if (currentProxy) {
                    const agent = proxyManager.createAgent(currentProxy);
                    if (agent) {
                        options.agent = agent;
                    }
                }
                if (needsAuth) {
                    const signature = this.generateSignature(queryString);
                    const finalUrl = `${url}&signature=${signature}`;
                    options.headers = {
                        ...options.headers,
                        'X-MBX-APIKEY': this.apiKey
                    };
                    const response = await fetch(finalUrl, options);
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = `Binance API Error: ${response.status} - ${errorData.msg || response.statusText}`;
                        // IP 밴 감지 및 대응
                        const banDetection = ipBanDetector.detectBan('binance', errorMessage);
                        if (banDetection.isBanned) {
                            // 프록시 에러 기록
                            if (currentProxy) {
                                proxyManager.recordProxyError(currentProxy, new Error(errorMessage));
                            }
                            // 밴 대응 실행
                            const banResponse = await ipBanDetector.handleBan('binance', banDetection);
                            if (banResponse.success && retryCount < maxRetries - 1) {
                                console.log(`🔄 [Binance] 밴 대응 후 재시도 (${retryCount + 1}/${maxRetries})`);
                                retryCount++;
                                continue; // 재시도
                            }
                        }
                        throw new Error(errorMessage);
                    }
                    // 성공 시 프록시 성공 기록
                    if (currentProxy) {
                        proxyManager.recordProxySuccess(currentProxy);
                    }
                    return await response.json();
                }
                else {
                    // 공개 API
                    const response = await fetch(url, options);
                    if (!response.ok) {
                        const errorMessage = `Binance API Error: ${response.status} - ${response.statusText}`;
                        // IP 밴 감지 및 대응 (공개 API)
                        const banDetection = ipBanDetector.detectBan('binance', errorMessage);
                        if (banDetection.isBanned) {
                            if (currentProxy) {
                                proxyManager.recordProxyError(currentProxy, new Error(errorMessage));
                            }
                            const banResponse = await ipBanDetector.handleBan('binance', banDetection);
                            if (banResponse.success && retryCount < maxRetries - 1) {
                                console.log(`🔄 [Binance] 공개 API 밴 대응 후 재시도 (${retryCount + 1}/${maxRetries})`);
                                retryCount++;
                                continue;
                            }
                        }
                        throw new Error(errorMessage);
                    }
                    // 성공 시 프록시 성공 기록
                    if (currentProxy) {
                        proxyManager.recordProxySuccess(currentProxy);
                    }
                    return await response.json();
                }
            }
            catch (error) {
                // 재시도 가능한 에러인지 확인
                const banDetection = ipBanDetector.detectBan('binance', error);
                if (banDetection.isBanned && retryCount < maxRetries - 1) {
                    console.log(`🔄 [Binance] 예외 처리 후 재시도 (${retryCount + 1}/${maxRetries}): ${error.message}`);
                    retryCount++;
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // 지수 백오프
                    continue;
                }
                // 최종 실패
                this.handleApiError(error, endpoint);
                throw error;
            }
        }
        throw new Error(`Binance API 요청 실패: 최대 재시도 횟수 (${maxRetries}) 초과`);
    }
    /**
     * 연결 테스트
     */
    async testConnection() {
        const permissions = [];
        let hasAnyAccess = false;
        let lastError = null;
        // 선물 계정 우선 테스트 (exchangeTestService와 동일한 방식)
        try {
            const futuresAccount = await this.apiRequest('/fapi/v2/account', 'GET', {}, true);
            permissions.push('futures');
            hasAnyAccess = true;
            console.log('✅ 바이낸스 선물 API 접근 성공');
        }
        catch (error) {
            console.warn('⚠️ 바이낸스 선물 API 접근 실패:', error);
            lastError = error;
        }
        // 현물 계정 정보 조회 시도 (선택사항)
        try {
            const accountInfo = await this.apiRequest('/api/v3/account');
            hasAnyAccess = true;
            if (accountInfo.canTrade)
                permissions.push('spot');
            if (accountInfo.canWithdraw)
                permissions.push('withdraw');
            if (accountInfo.canDeposit)
                permissions.push('deposit');
            console.log('✅ 바이낸스 현물 API 접근 성공');
        }
        catch (error) {
            console.warn('⚠️ 바이낸스 현물 API 접근 실패 (권한 없음):', error);
            // 선물이 성공했다면 현물 실패는 무시
            if (!hasAnyAccess)
                lastError = error;
        }
        // 현물 또는 선물 중 하나라도 접근 가능하면 성공
        if (hasAnyAccess) {
            return {
                success: true,
                permissions
            };
        }
        else {
            return {
                success: false,
                permissions: [],
                error: lastError?.message || '바이낸스 API 접근 권한이 없습니다'
            };
        }
    }
    /**
     * 잔고 조회 (현물 + 선물)
     */
    async getBalances() {
        const balances = [];
        // 현물 잔고 조회
        try {
            const spotAccount = await this.apiRequest('/api/v3/account');
            spotAccount.balances
                .filter(balance => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
                .forEach(balance => {
                balances.push({
                    exchange: 'binance',
                    currency: balance.asset,
                    available: parseFloat(balance.free),
                    locked: parseFloat(balance.locked),
                    total: parseFloat(balance.free) + parseFloat(balance.locked)
                });
            });
        }
        catch (error) {
            console.warn('바이낸스 현물 잔고 조회 실패 (권한 없음 가능성):', error);
        }
        // 선물 잔고 조회 (계정 정보 API 사용)
        try {
            const futuresAccountInfo = await this.apiRequest('/fapi/v2/account', 'GET', {}, true);
            console.log('🔍 바이낸스 선물 계정 정보:', futuresAccountInfo);
            // totalWalletBalance를 USDT 잔고로 사용
            const totalUsdt = parseFloat(futuresAccountInfo.totalWalletBalance || '0');
            if (totalUsdt > 0) {
                console.log(`💰 바이낸스 선물 총 잔고: ${totalUsdt} USDT`);
                balances.push({
                    exchange: 'binance',
                    currency: 'USDT',
                    available: parseFloat(futuresAccountInfo.availableBalance || '0'),
                    locked: totalUsdt - parseFloat(futuresAccountInfo.availableBalance || '0'),
                    total: totalUsdt
                });
            }
        }
        catch (error) {
            console.warn('바이낸스 선물 잔고 조회 실패:', error);
        }
        return balances;
    }
    /**
     * 특정 통화 잔고 조회
     */
    async getBalance(currency) {
        const balances = await this.getBalances();
        const balance = balances.find(b => b.currency === currency);
        if (!balance) {
            return {
                exchange: 'binance',
                currency,
                available: 0,
                locked: 0,
                total: 0
            };
        }
        return balance;
    }
    /**
     * 현재 시세 조회
     */
    async getCurrentPrice(symbol) {
        const normalizedSymbol = this.normalizeSymbol(symbol);
        const ticker = await this.apiRequest(`/api/v3/ticker/price?symbol=${normalizedSymbol}`);
        return parseFloat(ticker.price);
    }
    /**
     * 오더북 조회
     */
    async getOrderBook(symbol, depth = 10) {
        const normalizedSymbol = this.normalizeSymbol(symbol);
        const orderbook = await this.apiRequest(`/api/v3/depth?symbol=${normalizedSymbol}&limit=${depth}`);
        return {
            symbol: normalizedSymbol,
            bids: orderbook.bids.map(([price, quantity]) => ({
                price: parseFloat(price),
                quantity: parseFloat(quantity)
            })),
            asks: orderbook.asks.map(([price, quantity]) => ({
                price: parseFloat(price),
                quantity: parseFloat(quantity)
            }))
        };
    }
    /**
     * 주문 생성 (현물)
     */
    async createOrder(orderRequest) {
        const normalizedSymbol = this.normalizeSymbol(orderRequest.symbol);
        const orderData = {
            symbol: normalizedSymbol,
            side: orderRequest.side.toUpperCase(),
            type: orderRequest.type.toUpperCase(),
            quantity: orderRequest.quantity
        };
        if (orderRequest.type === 'limit') {
            orderData.price = orderRequest.price;
            orderData.timeInForce = orderRequest.timeInForce || 'GTC';
        }
        if (orderRequest.clientOrderId) {
            orderData.newClientOrderId = orderRequest.clientOrderId;
        }
        const result = await this.apiRequest('/api/v3/order', 'POST', orderData);
        const totalFee = result.fills.reduce((sum, fill) => sum + parseFloat(fill.commission), 0);
        return {
            id: 0, // DB에서 생성될 ID
            userId: orderRequest.userId,
            exchange: 'binance',
            exchangeOrderId: result.orderId.toString(),
            symbol: orderRequest.symbol,
            side: orderRequest.side,
            type: orderRequest.type,
            status: this.mapBinanceStatus(result.status),
            quantity: parseFloat(result.origQty),
            filledQuantity: parseFloat(result.executedQty),
            remainingQuantity: parseFloat(result.origQty) - parseFloat(result.executedQty),
            price: parseFloat(result.price || '0'),
            averagePrice: result.fills.length > 0
                ? result.fills.reduce((sum, fill, _, arr) => sum + (parseFloat(fill.price) * parseFloat(fill.qty)) / arr.length, 0)
                : undefined,
            fee: totalFee,
            feeCurrency: result.fills[0]?.commissionAsset || 'USDT',
            createdAt: new Date(result.transactTime),
            updatedAt: new Date(),
            filledAt: result.status === 'FILLED' ? new Date(result.transactTime) : undefined
        };
    }
    /**
     * 주문 조회
     */
    async getOrder(orderId) {
        // 구현 필요 - 바이낸스 주문 조회 API 호출
        throw new Error('구현 필요: Binance getOrder');
    }
    /**
     * 주문 취소
     */
    async cancelOrder(orderId) {
        // 구현 필요 - 바이낸스 주문 취소 API 호출
        throw new Error('구현 필요: Binance cancelOrder');
    }
    /**
     * 활성 주문 목록 조회
     */
    async getActiveOrders(symbol) {
        // 구현 필요 - 바이낸스 활성 주문 조회 API 호출
        throw new Error('구현 필요: Binance getActiveOrders');
    }
    /**
     * 거래 내역 조회
     */
    async getTrades(symbol, limit = 100) {
        // 구현 필요 - 바이낸스 거래 내역 조회 API 호출
        throw new Error('구현 필요: Binance getTrades');
    }
    /**
     * 포지션 조회 (선물 전용)
     */
    async getPositions(symbol) {
        let endpoint = '/fapi/v2/positionRisk';
        const params = {};
        if (symbol) {
            params.symbol = this.normalizeSymbol(symbol);
        }
        const positions = await this.apiRequest(endpoint, 'GET', params, true);
        return positions
            .filter(pos => parseFloat(pos.positionAmt) !== 0)
            .map(pos => ({
            symbol: pos.symbol,
            side: parseFloat(pos.positionAmt) > 0 ? 'long' : 'short',
            size: Math.abs(parseFloat(pos.positionAmt)),
            entryPrice: parseFloat(pos.entryPrice),
            markPrice: parseFloat(pos.markPrice),
            unrealizedPnl: parseFloat(pos.unRealizedProfit),
            leverage: parseFloat(pos.leverage)
        }));
    }
    /**
     * 레버리지 설정 (선물 전용)
     */
    async setLeverage(symbol, leverage) {
        try {
            await this.apiRequest('/fapi/v1/leverage', 'POST', {
                symbol: this.normalizeSymbol(symbol),
                leverage
            }, true);
            return true;
        }
        catch (error) {
            console.error('바이낸스 레버리지 설정 실패:', error);
            return false;
        }
    }
    /**
     * 심볼 정규화 (BTC → BTCUSDT)
     */
    normalizeSymbol(symbol) {
        if (symbol.includes('USDT')) {
            return symbol; // 이미 바이낸스 형식
        }
        return `${symbol}USDT`; // USDT 페어로 변환
    }
    /**
     * 최소 주문 수량 조회
     */
    async getMinOrderSize(symbol) {
        const normalizedSymbol = this.normalizeSymbol(symbol);
        const exchangeInfo = await this.apiRequest('/api/v3/exchangeInfo');
        const symbolInfo = exchangeInfo.symbols.find(s => s.symbol === normalizedSymbol);
        if (!symbolInfo) {
            throw new Error(`심볼 정보를 찾을 수 없습니다: ${normalizedSymbol}`);
        }
        const lotSizeFilter = symbolInfo.filters.find(f => f.filterType === 'LOT_SIZE');
        return parseFloat(lotSizeFilter?.minQty || '0.001');
    }
    /**
     * 수수료율 조회
     */
    async getFeeRate(symbol, orderType) {
        // 현물 거래 수수료 (기본값)
        return {
            maker: TRADING_FEES.BINANCE.SPOT.MAKER,
            taker: TRADING_FEES.BINANCE.SPOT.TAKER
        };
    }
    /**
     * 선물 수수료율 조회
     */
    async getFuturesFeeRate(symbol) {
        return {
            maker: TRADING_FEES.BINANCE.FUTURES.MAKER,
            taker: TRADING_FEES.BINANCE.FUTURES.TAKER
        };
    }
    /**
     * 바이낸스 주문 상태를 표준 상태로 매핑
     */
    mapBinanceStatus(binanceStatus) {
        switch (binanceStatus) {
            case 'NEW': return 'pending';
            case 'PARTIALLY_FILLED': return 'partially_filled';
            case 'FILLED': return 'filled';
            case 'CANCELED': return 'cancelled';
            case 'REJECTED': return 'rejected';
            case 'EXPIRED': return 'cancelled';
            default: return 'pending';
        }
    }
    /**
     * 현물 계정 정보 조회
     */
    async getSpotAccountInfo() {
        return this.apiRequest('/api/v3/account');
    }
    /**
     * 선물 계정 정보 조회
     */
    async getFuturesAccountInfo() {
        return this.apiRequest('/fapi/v2/account', 'GET', {}, true);
    }
    /**
     * 선물 주문 생성
     */
    async createFuturesOrder(orderRequest) {
        const normalizedSymbol = this.normalizeSymbol(orderRequest.symbol);
        const orderData = {
            symbol: normalizedSymbol,
            side: orderRequest.side.toUpperCase(),
            type: orderRequest.type.toUpperCase(),
            quantity: orderRequest.quantity
        };
        if (orderRequest.type === 'limit') {
            orderData.price = orderRequest.price;
            orderData.timeInForce = orderRequest.timeInForce || 'GTC';
        }
        if (orderRequest.clientOrderId) {
            orderData.newClientOrderId = orderRequest.clientOrderId;
        }
        const result = await this.apiRequest('/fapi/v1/order', 'POST', orderData, true);
        return {
            id: 0, // DB에서 생성될 ID
            userId: orderRequest.userId,
            exchange: 'binance',
            exchangeOrderId: result.orderId.toString(),
            symbol: orderRequest.symbol,
            side: orderRequest.side,
            type: orderRequest.type,
            status: this.mapBinanceStatus(result.status),
            quantity: parseFloat(result.origQty),
            filledQuantity: parseFloat(result.executedQty),
            remainingQuantity: parseFloat(result.origQty) - parseFloat(result.executedQty),
            price: parseFloat(result.price || '0'),
            averagePrice: parseFloat(result.avgPrice || '0') || undefined,
            fee: 0, // 별도 조회 필요
            feeCurrency: 'USDT',
            createdAt: new Date(),
            updatedAt: new Date(result.updateTime),
            filledAt: result.status === 'FILLED' ? new Date(result.updateTime) : undefined
        };
    }
}
