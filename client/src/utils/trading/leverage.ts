/**
 * 레버리지 유틸리티 (중앙화된 shared 모듈 사용)
 * @deprecated 이 파일은 호환성을 위해 유지되며, shared/utils/leverage.ts를 re-export합니다.
 */
export {
  LEVERAGE_CONFIG,
  normalizeLeverage,
  parseLeverage,
  validateLeverage,
  calculateInvestmentWithLeverage
} from '../../../../shared/utils/leverage';
