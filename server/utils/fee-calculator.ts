// ===== 거래 수수료 계산 유틸리티 =====

/**
 * 거래소 수수료율 상수
 *
 * 참고: 우리는 시장가 주문만 사용하므로 항상 Taker 수수료가 적용됩니다.
 */
export const FEE_RATES = {
  UPBIT_SPOT: 0.0005,                 // 업비트 현물 0.05%
  BINANCE_FUTURES_TAKER: 0.0004,      // 바이낸스 선물 Taker 0.04% (시장가 주문)
  // BINANCE_FUTURES_MAKER: 0.0002,   // 바이낸스 선물 Maker 0.02% (지정가 주문 - 미사용)
} as const;

/**
 * USDT-KRW 환율 조회 (업비트 실시간 - 기본값 없음)
 */
export async function getUSDTKRWRate(): Promise<number> {
  const response = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-USDT');

  if (!response.ok) {
    throw new Error(`USDT/KRW 환율 API 오류: ${response.status}`);
  }

  const data = await response.json();
  const rate = data[0]?.trade_price;

  if (!rate || rate <= 1000 || rate >= 2000) {
    throw new Error(`비정상적인 환율 값: ${rate}`);
  }

  return rate;
}

/**
 * 업비트 거래 수수료 계산
 * @param quantity BTC 수량
 * @param price 거래 가격 (KRW)
 * @param paidFee API 응답의 paid_fee 값 (있는 경우)
 * @returns 수수료 (KRW)
 */
export function calculateUpbitFee(
  quantity: number,
  price: number,
  paidFee?: number | string
): number {
  // API에서 paid_fee를 제공한 경우 그 값 사용
  if (paidFee !== undefined && paidFee !== null) {
    const fee = typeof paidFee === 'string' ? parseFloat(paidFee) : paidFee;
    if (!isNaN(fee) && fee > 0) {
      return fee;
    }
  }

  // 수수료율로 계산 (0.05%)
  return quantity * price * FEE_RATES.UPBIT_SPOT;
}

/**
 * 바이낸스 선물 거래 수수료 계산 (USDT)
 *
 * 참고: 시장가 주문만 사용하므로 항상 Taker 수수료(0.04%)가 적용됩니다.
 *
 * @param quantity BTC 수량
 * @param price 거래 가격 (USDT)
 * @param paidFee API 응답의 commission 값 (있는 경우)
 * @returns 수수료 (USDT)
 */
export function calculateBinanceFee(
  quantity: number,
  price: number,
  paidFee?: number | string
): number {
  // API에서 commission을 제공한 경우 그 값 사용
  if (paidFee !== undefined && paidFee !== null) {
    const fee = typeof paidFee === 'string' ? parseFloat(paidFee) : paidFee;
    if (!isNaN(fee) && fee > 0) {
      return fee;
    }
  }

  // 수수료율로 계산 (0.04%)
  return quantity * price * FEE_RATES.BINANCE_FUTURES_TAKER;
}

/**
 * 바이낸스 수수료를 KRW로 환산
 * @param feeInUSDT 수수료 (USDT)
 * @param usdtKrwRate USDT-KRW 환율
 * @returns 수수료 (KRW)
 */
export function convertBinanceFeeToKRW(
  feeInUSDT: number,
  usdtKrwRate: number
): number {
  return feeInUSDT * usdtKrwRate;
}

/**
 * 총 거래 수수료 계산 (업비트 + 바이낸스, KRW 기준)
 * @param upbitQuantity 업비트 거래 수량 (BTC)
 * @param upbitPrice 업비트 거래 가격 (KRW)
 * @param binanceQuantity 바이낸스 거래 수량 (BTC)
 * @param binancePrice 바이낸스 거래 가격 (USDT)
 * @param usdtKrwRate USDT-KRW 환율
 * @param upbitPaidFee 업비트 API 응답의 paid_fee (선택)
 * @param binancePaidFee 바이낸스 API 응답의 commission (선택)
 * @returns { upbitFee: KRW, binanceFee: USDT, binanceFeeKRW: KRW, totalFeeKRW: KRW }
 */
export async function calculateTotalTradingFees(params: {
  upbitQuantity: number;
  upbitPrice: number;
  binanceQuantity: number;
  binancePrice: number;
  usdtKrwRate?: number;  // 선택적으로 제공 (없으면 자동 조회)
  upbitPaidFee?: number | string;
  binancePaidFee?: number | string; // 바이낸스 실제 수수료 추가
}) {
  const { upbitQuantity, upbitPrice, binanceQuantity, binancePrice, upbitPaidFee, binancePaidFee } = params;

  // 환율 (제공되지 않으면 조회)
  const usdtKrwRate = params.usdtKrwRate ?? await getUSDTKRWRate();

  // 업비트 수수료 (KRW)
  const upbitFee = calculateUpbitFee(upbitQuantity, upbitPrice, upbitPaidFee);

  // 바이낸스 수수료 (USDT) - API에서 받은 값 우선 사용
  const binanceFee = calculateBinanceFee(binanceQuantity, binancePrice, binancePaidFee);

  // 바이낸스 수수료 (KRW 환산)
  const binanceFeeKRW = convertBinanceFeeToKRW(binanceFee, usdtKrwRate);

  // 총 수수료 (KRW)
  const totalFeeKRW = upbitFee + binanceFeeKRW;

  return {
    upbitFee,           // KRW
    binanceFee,         // USDT
    binanceFeeKRW,      // KRW
    totalFeeKRW,        // KRW
    usdtKrwRate         // 사용된 환율
  };
}
