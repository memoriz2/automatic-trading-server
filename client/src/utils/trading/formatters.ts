// ===== 포맷팅 유틸리티 함수들 =====

export const isNum = (v: any): v is number => typeof v === 'number' && isFinite(v);

export const fx = (v: number | undefined | null, n = 2) => 
  (isNum(v) ? Number(v).toFixed(n) : '-');

export const loc = (v: number | undefined | null) => 
  (isNum(v) ? Number(v).toLocaleString() : '-');

export const formatKRW = (n: number) => 
  new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Math.round(n));

export const formatUSD = (n: number) => 
  new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export const formatCompact = (n: number, digits = 1): string => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(digits)}K`;
  return `${n.toFixed(Math.min(digits, 2))}`;
};

export const floorQty = (q: number | string | undefined | null) => 
  Math.floor((Number(q) || 0) / 0.001) * 0.001;
