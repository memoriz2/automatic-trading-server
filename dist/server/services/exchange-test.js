// import { decryptApiKey } from '../utils/encryption.js';
import crypto from 'crypto';
import fetch from 'node-fetch';
// @ts-ignore
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
export class ExchangeTestService {
    // 업비트 연동 테스트
    async testUpbitConnection(apiKey, apiSecret) {
        try {
            // 업비트 JWT 토큰 생성
            const payload = {
                access_key: apiKey,
                nonce: uuidv4(),
                timestamp: Date.now()
            };
            const token = jwt.sign(payload, apiSecret);
            // 업비트 API로 계정 정보 조회 시도
            const response = await fetch('https://api.upbit.com/v1/accounts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                // KRW 잔고 우선 표시, 없으면 첫 번째 자산
                const krwAccount = data.find((account) => account.currency === 'KRW');
                const btcAccount = data.find((account) => account.currency === 'BTC');
                let balanceInfo = 'N/A';
                if (krwAccount && parseFloat(krwAccount.balance) > 0) {
                    balanceInfo = `${parseFloat(krwAccount.balance).toLocaleString()}원`;
                }
                else if (btcAccount && parseFloat(btcAccount.balance) > 0) {
                    balanceInfo = `${btcAccount.balance} BTC`;
                }
                else if (data[0]?.balance) {
                    balanceInfo = `${data[0].balance} ${data[0].currency}`;
                }
                return {
                    success: true,
                    message: '업비트 연동 성공! 계정 정보를 정상적으로 조회했습니다.',
                    details: {
                        accountCount: data.length,
                        balance: balanceInfo,
                        krwBalance: krwAccount?.balance || '0',
                        btcBalance: btcAccount?.balance || '0',
                        accounts: data.map((acc) => ({
                            currency: acc.currency,
                            balance: acc.balance
                        }))
                    }
                };
            }
            else {
                const errorData = await response.json().catch(() => ({ error: { message: '응답 파싱 실패' } }));
                console.log('❌ 업비트 연동 실패:', errorData);
                return {
                    success: false,
                    message: '업비트 연동 실패',
                    error: errorData.error?.message || `HTTP ${response.status}`,
                    details: { status: response.status }
                };
            }
        }
        catch (error) {
            console.error('💥 업비트 연동 테스트 오류:', error);
            return {
                success: false,
                message: '업비트 연동 테스트 중 오류 발생',
                error: error.message,
                details: { error: error.toString() }
            };
        }
    }
    // 바이낸스 연동 테스트
    async testBinanceConnection(apiKey, apiSecret) {
        try {
            // 바이낸스 API로 계정 정보 조회 시도
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            // HMAC-SHA256 서명 생성
            const signature = this.generateBinanceSignature(queryString, apiSecret);
            const response = await fetch(`https://fapi.binance.com/fapi/v2/account?${queryString}&signature=${signature}`, {
                method: 'GET',
                headers: {
                    'X-MBX-APIKEY': apiKey,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                // 바이낸스 연동 성공 로그 제거
                return {
                    success: true,
                    message: '바이낸스 연동 성공! 계정 정보를 정상적으로 조회했습니다.',
                    details: {
                        canTrade: data.canTrade,
                        totalWalletBalance: data.totalWalletBalance,
                        availableBalance: data.availableBalance
                    }
                };
            }
            else {
                const errorData = await response.json().catch(() => ({ msg: '응답 파싱 실패' }));
                console.log('❌ 바이낸스 연동 실패:', errorData);
                return {
                    success: false,
                    message: '바이낸스 연동 실패',
                    error: errorData.msg || `HTTP ${response.status}`,
                    details: { status: response.status }
                };
            }
        }
        catch (error) {
            console.error('💥 바이낸스 연동 테스트 오류:', error);
            return {
                success: false,
                message: '바이낸스 연동 테스트 중 오류 발생',
                error: error.message,
                details: { error: error.toString() }
            };
        }
    }
    // 바이낸스 서명 생성 (HMAC-SHA256)
    generateBinanceSignature(queryString, secretKey) {
        return crypto
            .createHmac('sha256', secretKey)
            .update(queryString)
            .digest('hex');
    }
    // 거래소별 연동 테스트 실행
    async testExchangeConnection(exchange, apiKey, apiSecret) {
        console.log(`🚀 ${exchange} 거래소 연동 테스트 시작...`);
        switch (exchange.toLowerCase()) {
            case 'upbit':
                return await this.testUpbitConnection(apiKey, apiSecret);
            case 'binance':
                return await this.testBinanceConnection(apiKey, apiSecret);
            default:
                return {
                    success: false,
                    message: '지원하지 않는 거래소입니다',
                    error: `Unknown exchange: ${exchange}`
                };
        }
    }
}
export const exchangeTestService = new ExchangeTestService();
