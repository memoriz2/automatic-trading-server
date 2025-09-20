// ===== 포맷팅 유틸리티 함수들 =====

export const isNum = (v: any): v is number => typeof v === 'number' && isFinite(v);

export const fx = (v: number | undefined | null, n = 2) => 
  (isNum(v) ? Number(v).toFixed(n) : '-');

export const loc = (v: number | undefined | null) => 
  (isNum(v) ? Number(v).toLocaleString() : '-');

export const formatKRW = (n: number) => 
  new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Math.floor(n));

export const formatUSD = (n: number) => 
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.floor(n));

// 정수 포맷팅 (소수점 완전 제거)
export const formatInteger = (n: number) => 
  new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Math.floor(n));

// 가격 포맷팅 (소수점 없이)
export const formatPrice = (n: number) => 
  Math.floor(n).toLocaleString('ko-KR');

export const formatCompact = (n: number, digits = 1): string => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(digits)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(digits)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(digits)}K`;
  return `${n.toFixed(Math.min(digits, 2))}`;
};

export const floorQty = (q: number | string | undefined | null) => 
  Math.floor((Number(q) || 0) / 0.001) * 0.001;

// BTC 포맷팅 (소수점 3자리 고정 표시)
export const formatBTC = (value: number): string => {
  if (value === 0) return '0.000';
  
  // 소수점 3자리까지 절삭 (반올림 아님)
  const truncated = Math.floor(value * 1000) / 1000;
  
  // 소수점 3자리로 고정 표시
  return truncated.toFixed(3);
};

// 스마트 퍼센트 포맷팅 (소수점 3자리까지, 절삭)
export const formatPercent = (value: number): string => {
  if (value === 0) return '0';
  
  // 소수점 3자리까지 절삭 (반올림 아님)
  const truncated = Math.floor(value * 1000) / 1000;
  
  // 불필요한 0 제거
  return parseFloat(truncated.toFixed(3)).toString();
};
