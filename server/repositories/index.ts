// ===== Repository 계층 통합 Export =====

export { BaseRepository } from './BaseRepository';
export { ApiKeysRepository } from './ApiKeysRepository';
export { OrdersRepository } from './OrdersRepository';
export { PositionsRepository } from './PositionsRepository';
export { TradesRepository } from './TradesRepository';
export { BalanceRepository } from './BalanceRepository';
export { ExchangeConnectionRepository } from './ExchangeConnectionRepository';
export { DailyStatsRepository } from './DailyStatsRepository';

// ===== Repository 클래스 임포트 =====

import { ApiKeysRepository } from './ApiKeysRepository';
import { OrdersRepository } from './OrdersRepository';
import { PositionsRepository } from './PositionsRepository';
import { TradesRepository } from './TradesRepository';
import { BalanceRepository } from './BalanceRepository';
import { ExchangeConnectionRepository } from './ExchangeConnectionRepository';
import { DailyStatsRepository } from './DailyStatsRepository';

// ===== Repository 인스턴스 생성 (싱글톤) =====

export const apiKeysRepository = new ApiKeysRepository();
export const ordersRepository = new OrdersRepository();
export const positionsRepository = new PositionsRepository();
export const tradesRepository = new TradesRepository();
export const balanceRepository = new BalanceRepository();
export const exchangeConnectionRepository = new ExchangeConnectionRepository();
export const dailyStatsRepository = new DailyStatsRepository();

// ===== Repository 컬렉션 =====

export const repositories = {
  apiKeys: apiKeysRepository,
  orders: ordersRepository,
  positions: positionsRepository,
  trades: tradesRepository,
  balance: balanceRepository,
  exchangeConnection: exchangeConnectionRepository,
  dailyStats: dailyStatsRepository
} as const;

// ===== 타입 정의 =====

export type RepositoryCollection = typeof repositories;
export type RepositoryName = keyof RepositoryCollection;
