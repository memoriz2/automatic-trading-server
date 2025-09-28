import { isNum } from './formatters';

export interface Band {
  name?: string;
  target_kimp?: number | string;
  exit_kimp?: number | string;
  tolerance?: number | string;
  leverage?: number | string;
  amount_btc?: number | string;
  serverId?: string | number;
}

export const mapStrategyToBand = (strategy: any): Band => ({
  ...strategy,
  band: strategy.band || 'default'
});

export const createBandFromValues = (
  name: string = '',
  targetKimp: string = '',
  exitKimp: string = '',
  tolerance: string = '0.1',
  leverage: string = '1',
  amountBtc: string = ''
): Band => ({
  name,
  target_kimp: targetKimp,
  exit_kimp: exitKimp,
  tolerance,
  leverage,
  amount_btc: amountBtc
});

export const validateBandData = (band: Band): boolean => {
  return !!(
    band.name?.trim() &&
    isNum(band.target_kimp) &&
    isNum(band.exit_kimp) &&
    isNum(band.tolerance) &&
    isNum(band.leverage) &&
    isNum(band.amount_btc)
  );
};

export const getBandDefaults = () => ({
  name: '',
  target_kimp: '',
  exit_kimp: '',
  tolerance: '0.1',
  leverage: '1',
  amount_btc: ''
});

export const TRADING_CONSTANTS = {
  DEFAULT_TOLERANCE: '0.1'
};