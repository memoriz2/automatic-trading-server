/**
 * 거래 관련 유효성 검사 유틸리티
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class TradingValidation {
  /**
   * 김치 프리미엄 데이터 유효성 검사
   */
  static validateKimchiData(data: any): ValidationResult {
    if (!data || !Array.isArray(data)) {
      return { isValid: false, error: '김치 프리미엄 데이터가 배열이 아닙니다' };
    }
    
    const btcData = data.find((item: any) => item.symbol === 'BTC');
    if (!btcData) {
      return { isValid: false, error: 'BTC 데이터를 찾을 수 없습니다' };
    }
    
    const { upbitPrice, binanceFuturesPrice, usdKrwRate } = btcData;
    
    // 가격 범위 검증
    if (upbitPrice < 50000000 || upbitPrice > 500000000) {
      return { isValid: false, error: '업비트 BTC 가격이 비정상적입니다' };
    }
    
    if (binanceFuturesPrice < 30000 || binanceFuturesPrice > 300000) {
      return { isValid: false, error: '바이낸스 BTC 가격이 비정상적입니다' };
    }
    
    if (usdKrwRate < 1000 || usdKrwRate > 2000) {
      return { isValid: false, error: 'USD/KRW 환율이 비정상적입니다' };
    }
    
    return { isValid: true };
  }

  /**
   * 거래 수량 유효성 검사
   */
  static validateTradeQuantity(quantity: number, symbol: string = 'BTC'): ValidationResult {
    if (quantity <= 0) {
      return { isValid: false, error: '거래 수량은 0보다 커야 합니다' };
    }
    
    if (symbol === 'BTC') {
      if (quantity < 0.0001) {
        return { isValid: false, error: 'BTC 최소 거래 수량은 0.0001입니다' };
      }
      
      if (quantity > 10) {
        return { isValid: false, error: 'BTC 최대 거래 수량은 10개입니다' };
      }
    }
    
    return { isValid: true };
  }

  /**
   * 레버리지 유효성 검사
   */
  static validateLeverage(leverage: number): ValidationResult {
    if (leverage < 1 || leverage > 125) {
      return { isValid: false, error: '레버리지는 1배~125배 사이여야 합니다' };
    }
    
    if (!Number.isInteger(leverage)) {
      return { isValid: false, error: '레버리지는 정수여야 합니다' };
    }
    
    return { isValid: true };
  }

  /**
   * 김치 프리미엄율 유효성 검사
   */
  static validatePremiumRate(rate: number): ValidationResult {
    if (rate < -50 || rate > 50) {
      return { isValid: false, error: '김치 프리미엄율은 -50%~50% 사이여야 합니다' };
    }
    
    return { isValid: true };
  }

  /**
   * 투자 금액 유효성 검사
   */
  static validateInvestmentAmount(amount: number, currency: 'KRW' | 'USDT' = 'KRW'): ValidationResult {
    if (amount <= 0) {
      return { isValid: false, error: '투자 금액은 0보다 커야 합니다' };
    }
    
    if (currency === 'KRW') {
      if (amount < 5000) {
        return { isValid: false, error: 'KRW 최소 투자 금액은 5,000원입니다' };
      }
      
      if (amount > 1000000000) {
        return { isValid: false, error: 'KRW 최대 투자 금액은 10억원입니다' };
      }
    } else if (currency === 'USDT') {
      if (amount < 10) {
        return { isValid: false, error: 'USDT 최소 투자 금액은 10달러입니다' };
      }
      
      if (amount > 1000000) {
        return { isValid: false, error: 'USDT 최대 투자 금액은 100만달러입니다' };
      }
    }
    
    return { isValid: true };
  }

  /**
   * 전략 설정 유효성 검사
   */
  static validateStrategySettings(settings: {
    entryRate: number;
    exitRate: number;
    tolerance: number;
    leverage: number;
    investmentAmount: number;
  }): ValidationResult {
    // 진입/청산 조건 검사
    const premiumCheck = this.validatePremiumRate(settings.entryRate);
    if (!premiumCheck.isValid) {
      return { isValid: false, error: `진입 조건: ${premiumCheck.error}` };
    }
    
    const exitCheck = this.validatePremiumRate(settings.exitRate);
    if (!exitCheck.isValid) {
      return { isValid: false, error: `청산 조건: ${exitCheck.error}` };
    }
    
    // 허용 오차 검사
    if (settings.tolerance < 0.01 || settings.tolerance > 5) {
      return { isValid: false, error: '허용 오차는 0.01%~5% 사이여야 합니다' };
    }
    
    // 레버리지 검사
    const leverageCheck = this.validateLeverage(settings.leverage);
    if (!leverageCheck.isValid) {
      return leverageCheck;
    }
    
    // 투자 금액 검사
    const amountCheck = this.validateInvestmentAmount(settings.investmentAmount);
    if (!amountCheck.isValid) {
      return amountCheck;
    }
    
    return { isValid: true };
  }
}
