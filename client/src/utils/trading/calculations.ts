// ===== 계산 유틸리티 함수들 =====
import { LEVERAGE_CONFIG } from './leverage';

// 투자 수량 보정: 서버 원화 금액/비정상 값이 들어왔을 때 안전한 BTC 수량으로 변환
export const normalizeAmountBtc = (raw: any, upbitPrice?: number): number => {
  let amt = Number(raw ?? 0) || 0;
  // 원화 금액(100 이상) 또는 과도한 수량은 변환/클램프
  if (amt >= 100 && upbitPrice && upbitPrice > 0) {
    amt = +(amt / upbitPrice).toFixed(3);
  }
  if (!isFinite(amt) || amt <= 0) amt = 0.001;
  if (amt > 10) amt = 0.001; // 상식적 한도 초과 시 최소값
  return Math.max(0.001, amt);
};

// 서버 전략 → UI 밴드 매핑
export const mapStrategyToBand = (s: any) => ({
  name: s?.name,
  target_kimp: Number(s?.entryRate),
  exit_kimp: Number(s?.exitRate),
  tolerance: Number(s?.toleranceRate ?? s?.tolerance ?? 0.1),
  leverage: Number(s?.leverage ?? LEVERAGE_CONFIG.DEFAULT),
  // 현재 서버는 BTC 수량을 investmentAmount로 보관 중 → 역매핑
  amount_btc: Number(s?.investmentAmount ?? 0) || 0,
  serverId: s?.id,
});
