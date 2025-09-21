// ===== Exchange Adapter 통합 Export =====
export { BaseExchangeAdapter, ExchangeAdapterFactory } from './ExchangeAdapter.js';
export { UpbitAdapter } from './UpbitAdapter.js';
export { BinanceAdapter } from './BinanceAdapter.js';
// ===== Adapter 클래스 임포트 =====
import { ExchangeAdapterFactory } from './ExchangeAdapter.js';
import { UpbitAdapter } from './UpbitAdapter.js';
import { BinanceAdapter } from './BinanceAdapter.js';
// ===== Adapter 인스턴스 생성 및 등록 =====
export const upbitAdapter = new UpbitAdapter();
export const binanceAdapter = new BinanceAdapter();
// 팩토리에 어댑터 등록
ExchangeAdapterFactory.register('upbit', upbitAdapter);
ExchangeAdapterFactory.register('binance', binanceAdapter);
// ===== Adapter 컬렉션 =====
export const adapters = {
    upbit: upbitAdapter,
    binance: binanceAdapter
};
// ===== 유틸리티 함수들 =====
/**
 * 거래소 이름으로 어댑터 조회
 */
export function getExchangeAdapter(exchange) {
    return ExchangeAdapterFactory.get(exchange);
}
/**
 * 지원하는 거래소 목록 조회
 */
export function getSupportedExchanges() {
    return ExchangeAdapterFactory.getSupportedExchanges();
}
/**
 * 모든 어댑터에 API 키 설정
 */
export function setCredentialsForAll(credentials) {
    Object.entries(credentials).forEach(([exchange, creds]) => {
        try {
            const adapter = getExchangeAdapter(exchange);
            adapter.setCredentials(creds.apiKey, creds.secretKey, creds.passphrase);
        }
        catch (error) {
            console.warn(`⚠️ ${exchange} 어댑터에 인증 정보 설정 실패:`, error);
        }
    });
}
/**
 * 모든 거래소 연결 테스트
 */
export async function testAllConnections(credentials) {
    const results = {};
    for (const [exchange, creds] of Object.entries(credentials)) {
        try {
            const adapter = getExchangeAdapter(exchange);
            adapter.setCredentials(creds.apiKey, creds.secretKey, creds.passphrase);
            results[exchange] = await adapter.testConnection();
        }
        catch (error) {
            results[exchange] = {
                success: false,
                permissions: [],
                error: error.message
            };
        }
    }
    return results;
}
