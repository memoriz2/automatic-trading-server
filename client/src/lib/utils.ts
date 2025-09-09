import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 트레이딩 상수
export const TRADING_CONSTANTS = {
  DEFAULT_TOLERANCE: '0.001', // 기본 허용오차
  MIN_TOLERANCE: 0.001,
  MAX_TOLERANCE: 1.0,
  TOLERANCE_STEP: 0.001
} as const;
