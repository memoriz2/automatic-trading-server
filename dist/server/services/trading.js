// 최소화된 TradingService - TypeScript 오류 제거용
export class TradingService {
    isTrading = false;
    constructor() { }
    // 기본 자동매매 제어
    async startTrading(_userId) {
        this.isTrading = true;
        return { success: true, message: '자동매매가 시작되었습니다' };
    }
    async stopTrading(_userId) {
        this.isTrading = false;
        return { success: true, message: '자동매매가 중지되었습니다' };
    }
    isAutoTrading() {
        return this.isTrading;
    }
    // 기본 분석 메서드 - 임시 비활성화
    async analyzeTradingOpportunity() {
        return { canTrade: false, message: '분석 기능 준비중' };
    }
    async executeEntry() {
        return { success: false, message: '진입 기능 준비중' };
    }
    async executeExit() {
        return { success: false, message: '청산 기능 준비중' };
    }
    async monitorPositions() {
        return [];
    }
}
