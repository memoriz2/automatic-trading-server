/**
 * 프록시 로테이션 매니저
 * IP 밴 방지를 위한 프록시 서버 관리
 */
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
export class ProxyManager {
    static instance;
    proxies = [];
    currentIndex = 0;
    MAX_ERRORS_PER_PROXY = 3;
    PROXY_COOLDOWN_MS = 5 * 60 * 1000; // 5분
    static getInstance() {
        if (!ProxyManager.instance) {
            ProxyManager.instance = new ProxyManager();
        }
        return ProxyManager.instance;
    }
    constructor() {
        this.loadProxyConfig();
    }
    /**
     * 환경변수 또는 설정에서 프록시 목록 로드
     */
    loadProxyConfig() {
        // 환경변수에서 프록시 설정 로드
        const proxyList = process.env.PROXY_LIST;
        if (proxyList) {
            try {
                const proxies = JSON.parse(proxyList);
                this.proxies = proxies.map((proxy) => ({
                    ...proxy,
                    isActive: true,
                    lastUsed: 0,
                    errorCount: 0,
                    maxErrors: this.MAX_ERRORS_PER_PROXY
                }));
                console.log(`✅ [ProxyManager] ${this.proxies.length}개 프록시 로드 완료`);
            }
            catch (error) {
                console.error('❌ [ProxyManager] 프록시 설정 파싱 실패:', error);
            }
        }
        else {
            console.log('ℹ️ [ProxyManager] 프록시 설정 없음 - 직접 연결 사용');
        }
    }
    /**
     * 다음 사용 가능한 프록시 선택
     */
    getNextProxy() {
        if (this.proxies.length === 0) {
            return null; // 프록시 없음 - 직접 연결
        }
        const now = Date.now();
        let attempts = 0;
        const maxAttempts = this.proxies.length * 2;
        while (attempts < maxAttempts) {
            const proxy = this.proxies[this.currentIndex];
            this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
            attempts++;
            // 프록시 상태 확인
            if (proxy.isActive &&
                proxy.errorCount < proxy.maxErrors &&
                (now - proxy.lastUsed) > this.PROXY_COOLDOWN_MS) {
                proxy.lastUsed = now;
                console.log(`🔄 [ProxyManager] 프록시 선택: ${proxy.host}:${proxy.port}`);
                return proxy;
            }
        }
        console.warn('⚠️ [ProxyManager] 사용 가능한 프록시 없음');
        return null;
    }
    /**
     * 프록시 에러 기록
     */
    recordProxyError(proxy, _error) {
        proxy.errorCount++;
        console.warn(`❌ [ProxyManager] 프록시 에러: ${proxy.host}:${proxy.port} (${proxy.errorCount}/${proxy.maxErrors})`);
        if (proxy.errorCount >= proxy.maxErrors) {
            proxy.isActive = false;
            console.error(`🚫 [ProxyManager] 프록시 비활성화: ${proxy.host}:${proxy.port}`);
        }
    }
    /**
     * 프록시 성공 기록 (에러 카운트 리셋)
     */
    recordProxySuccess(proxy) {
        if (proxy.errorCount > 0) {
            console.log(`✅ [ProxyManager] 프록시 복구: ${proxy.host}:${proxy.port}`);
            proxy.errorCount = 0;
        }
    }
    /**
     * HTTP Agent 생성 (fetch용)
     */
    createAgent(proxy) {
        if (!proxy) {
            return undefined; // 직접 연결
        }
        const proxyUrl = proxy.username && proxy.password
            ? `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
            : `${proxy.protocol}://${proxy.host}:${proxy.port}`;
        try {
            if (proxy.protocol === 'https') {
                return new HttpsProxyAgent(proxyUrl);
            }
            else {
                return new HttpProxyAgent(proxyUrl);
            }
        }
        catch (error) {
            console.error(`❌ [ProxyManager] Agent 생성 실패: ${proxyUrl}`, error);
            return undefined;
        }
    }
    /**
     * 모든 프록시 재활성화 (긴급 상황용)
     */
    resetAllProxies() {
        console.warn('🔄 [ProxyManager] 모든 프록시 재활성화');
        this.proxies.forEach(proxy => {
            proxy.isActive = true;
            proxy.errorCount = 0;
            proxy.lastUsed = 0;
        });
    }
    /**
     * 프록시 상태 조회
     */
    getStatus() {
        return {
            total: this.proxies.length,
            active: this.proxies.filter(p => p.isActive).length,
            inactive: this.proxies.filter(p => !p.isActive).length,
            proxies: this.proxies.map(p => ({
                host: p.host,
                port: p.port,
                isActive: p.isActive,
                errorCount: p.errorCount,
                lastUsed: p.lastUsed ? new Date(p.lastUsed).toISOString() : 'Never'
            }))
        };
    }
}
// 싱글톤 인스턴스 export
export const proxyManager = ProxyManager.getInstance();
