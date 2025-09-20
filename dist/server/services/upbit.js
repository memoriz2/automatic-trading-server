import crypto from 'crypto';
// @ts-ignore
import jwt from 'jsonwebtoken';
export class UpbitService {
    baseUrl = 'https://api.upbit.com';
    accessKey;
    secretKey;
    constructor(accessKey, secretKey) {
        this.accessKey = accessKey || process.env.UPBIT_ACCESS_KEY || '';
        this.secretKey = secretKey || process.env.UPBIT_SECRET_KEY || '';
    }
    generateAuthToken(query) {
        if (!this.accessKey || !this.secretKey) {
            throw new Error('Upbit API keys not configured');
        }
        const payload = {
            access_key: this.accessKey,
            nonce: Date.now().toString(),
        };
        if (query) {
            payload.query_hash = crypto.createHash('sha512').update(query, 'utf-8').digest('hex');
            payload.query_hash_alg = 'SHA512';
        }
        return jwt.sign(payload, this.secretKey);
    }
    async getTicker(markets) {
        try {
            const marketString = markets.join(',');
            const response = await fetch(`${this.baseUrl}/v1/ticker?markets=${marketString}`);
            if (!response.ok) {
                throw new Error(`Upbit API error: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Upbit getTicker error:', error);
            throw error;
        }
    }
    async getOrderbook(markets) {
        try {
            const marketString = markets.join(',');
            const response = await fetch(`${this.baseUrl}/v1/orderbook?markets=${marketString}`);
            if (!response.ok) {
                throw new Error(`Upbit API error: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Upbit getOrderbook error:', error);
            throw error;
        }
    }
    // 중복된 getAccounts 메서드 제거 - 아래쪽에 올바른 메서드가 있음
    async getKRWBalance() {
        try {
            const accounts = await this.getAccounts();
            const krwAccount = accounts.find(account => account.currency === 'KRW');
            if (!krwAccount)
                return 0;
            // 사용가능한 잔고 = 총 잔고 - 잠긴 잔고
            const totalBalance = parseFloat(krwAccount.balance);
            const lockedBalance = parseFloat(krwAccount.locked || 0);
            return totalBalance - lockedBalance;
        }
        catch (error) {
            console.error('Upbit getKRWBalance error:', error);
            return 0;
        }
    }
    async getMarkets() {
        try {
            const response = await fetch(`${this.baseUrl}/v1/market/all`);
            if (!response.ok) {
                throw new Error(`Upbit API error: ${response.status}`);
            }
            const markets = await response.json();
            return markets.filter((market) => market.market.startsWith('KRW-'));
        }
        catch (error) {
            console.error('Upbit getMarkets error:', error);
            throw error;
        }
    }
    async getAccounts() {
        try {
            const authToken = this.generateAuthToken();
            const response = await fetch(`${this.baseUrl}/v1/accounts`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upbit API response:', response.status, errorText);
                throw new Error(`Upbit API error: ${response.status} - ${errorText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('Upbit getAccounts error:', error);
            throw error;
        }
    }
    async sendRequest(endpoint, method, params = {}) {
        const url = `${this.baseUrl}/v1/${endpoint}`;
        const nonNilParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null));
        // Convert all param values to strings for URLSearchParams
        const stringParams = {};
        for (const key in nonNilParams) {
            stringParams[key] = String(nonNilParams[key]);
        }
        const queryString = new URLSearchParams(stringParams).toString();
        const authToken = this.generateAuthToken(queryString || undefined);
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
        };
        let fullUrl = url;
        if (method === 'GET' || method === 'DELETE') {
            if (queryString)
                fullUrl += `?${queryString}`;
        }
        else if (method === 'POST') {
            options.body = JSON.stringify(nonNilParams);
        }
        const response = await fetch(fullUrl, options);
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Upbit API error (${response.status}): ${errorBody}`);
        }
        return response.json();
    }
    // 지정가 매수
    async placeBuyOrder(market, price, orderType = 'price') {
        try {
            const params = {
                market,
                side: 'bid',
                ord_type: orderType,
            };
            if (orderType === 'limit') {
                params.price = price.toString();
            }
            else {
                params.price = price.toString(); // 시장가 매수 시 총액
            }
            return this.sendRequest('orders', 'POST', params);
        }
        catch (error) {
            console.error('Upbit placeBuyOrder error:', error);
            throw new Error(`주문 조회 실패: ${error.message}`);
        }
    }
    async placeSellOrder(market, volume, orderType = 'market') {
        try {
            const params = {
                market,
                side: 'ask',
                volume: volume.toString(),
                ord_type: orderType,
            };
            if (orderType === 'limit') {
                // 지정가 매도의 경우 현재가 조회해서 가격 설정
                const ticker = await this.getTicker([market]);
                const currentPrice = ticker[0]?.trade_price || 0;
                if (currentPrice > 0) {
                    params.price = Math.floor(currentPrice * 0.999).toString(); // 0.1% 낮은 가격으로 즉시 체결 유도
                }
                else {
                    throw new Error('현재가 조회 실패로 지정가 매도 불가');
                }
            }
            console.log(`📊 업비트 매도 주문:`, params);
            return this.sendRequest('orders', 'POST', params);
        }
        catch (error) {
            console.error('Upbit placeSellOrder error:', error);
            throw error;
        }
    }
    async cancelOrder(uuid) {
        const params = { uuid };
        return this.sendRequest('order', 'DELETE', params);
    }
}
