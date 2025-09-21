/**
 * 거래소 어댑터 기본 클래스
 */
export class BaseExchangeAdapter {
    apiKey = '';
    secretKey = '';
    passphrase;
    setCredentials(apiKey, secretKey, passphrase) {
        this.apiKey = apiKey;
        this.secretKey = secretKey;
        this.passphrase = passphrase;
    }
    validateCredentials() {
        if (!this.apiKey || !this.secretKey) {
            throw new Error(`${this.name} API 키가 설정되지 않았습니다.`);
        }
    }
    handleApiError(error, context) {
        console.error(`❌ ${this.name} API 오류 (${context}):`, error);
        if (error.response?.status === 401) {
            throw new Error('API 키 인증에 실패했습니다. API 키를 확인해주세요.');
        }
        else if (error.response?.status === 403) {
            throw new Error('API 권한이 부족합니다. 거래 권한을 확인해주세요.');
        }
        else if (error.response?.status === 429) {
            throw new Error('API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
        }
        else {
            throw new Error(`${this.name} API 오류: ${error.message || '알 수 없는 오류'}`);
        }
    }
}
/**
 * 거래소 어댑터 팩토리
 */
export class ExchangeAdapterFactory {
    static adapters = new Map();
    /**
     * 어댑터 등록
     */
    static register(name, adapter) {
        this.adapters.set(name, adapter);
    }
    /**
     * 어댑터 조회
     */
    static get(name) {
        const adapter = this.adapters.get(name);
        if (!adapter) {
            throw new Error(`지원하지 않는 거래소입니다: ${name}`);
        }
        return adapter;
    }
    /**
     * 지원하는 거래소 목록
     */
    static getSupportedExchanges() {
        return Array.from(this.adapters.keys());
    }
    /**
     * 모든 어댑터 조회
     */
    static getAll() {
        return new Map(this.adapters);
    }
}
