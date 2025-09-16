import { BaseRepository } from './BaseRepository.js';
import { PositionDto, PositionSummaryDto } from '../types/trading.js';

/**
 * 포지션 관리 Repository
 * positions 테이블을 사용하여 실거래 포지션을 관리
 */
export class PositionsRepository extends BaseRepository {

  /**
   * 새 포지션 생성
   */
  async create(positionData: Omit<PositionDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<PositionDto> {
    const query = `
      INSERT INTO positions (
        user_id, strategy_id, symbol, side, status,
        upbit_quantity, upbit_entry_price, upbit_current_price, upbit_order_id,
        binance_quantity, binance_entry_price, binance_current_price, binance_leverage, binance_order_id,
        entry_premium_rate, current_premium_rate,
        unrealized_pnl, realized_pnl, total_fees,
        entry_time, exit_time, is_mock,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW()
      )
      RETURNING 
        id,
        user_id as "userId",
        strategy_id as "strategyId",
        symbol,
        side,
        status,
        quantity as "upbitQuantity",
        entry_price as "upbitEntryPrice",
        current_price as "upbitCurrentPrice",
        upbit_order_id as "upbitOrderId",
        binance_quantity as "binanceQuantity",
        binance_entry_price as "binanceEntryPrice",
        binance_leverage as "binanceLeverage",
        binance_order_id as "binanceOrderId",
        entry_premium_rate as "entryPremiumRate",
        current_premium_rate as "currentPremiumRate",
        unrealized_pnl as "unrealizedPnl",
        realized_pnl as "realizedPnl",
        total_fees as "totalFees",
        entry_time as "entryTime",
        exit_time as "exitTime",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.queryOne<PositionDto>(query, [
      positionData.userId,
      positionData.strategyId || null,
      positionData.symbol,
      positionData.side,
      positionData.status,
      positionData.upbitQuantity,
      positionData.upbitEntryPrice,
      positionData.upbitCurrentPrice || null,
      positionData.upbitOrderId || null,
      positionData.binanceQuantity,
      positionData.binanceEntryPrice,
      positionData.binanceCurrentPrice || null,
      positionData.binanceLeverage,
      positionData.binanceOrderId || null,
      positionData.entryPremiumRate,
      positionData.currentPremiumRate || null,
      positionData.unrealizedPnl,
      positionData.realizedPnl || null,
      positionData.totalFees,
      positionData.entryTime,
      positionData.exitTime || null,
      false // is_mock = false (실거래)
    ]);

    if (!result) {
      throw new Error('포지션 생성에 실패했습니다.');
    }

    return result;
  }

  /**
   * 포지션 ID로 조회
   */
  async findById(id: number): Promise<PositionDto | null> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        strategy_id as "strategyId",
        symbol,
        side,
        status,
        quantity as "upbitQuantity",
        entry_price as "upbitEntryPrice",
        current_price as "upbitCurrentPrice",
        upbit_order_id as "upbitOrderId",
        binance_quantity as "binanceQuantity",
        binance_entry_price as "binanceEntryPrice",
        binance_leverage as "binanceLeverage",
        binance_order_id as "binanceOrderId",
        entry_premium_rate as "entryPremiumRate",
        current_premium_rate as "currentPremiumRate",
        unrealized_pnl as "unrealizedPnl",
        realized_pnl as "realizedPnl",
        total_fees as "totalFees",
        entry_time as "entryTime",
        exit_time as "exitTime",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM positions 
      WHERE id = $1 AND is_mock = false
    `;
    
    return this.queryOne<PositionDto>(query, [id]);
  }

  /**
   * 사용자의 활성 포지션 조회
   */
  async findActiveByUserId(userId: number): Promise<PositionDto[]> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        strategy_id as "strategyId",
        symbol,
        side,
        status,
        quantity as "upbitQuantity",
        entry_price as "upbitEntryPrice",
        current_price as "upbitCurrentPrice",
        upbit_order_id as "upbitOrderId",
        binance_quantity as "binanceQuantity",
        binance_entry_price as "binanceEntryPrice",
        binance_leverage as "binanceLeverage",
        binance_order_id as "binanceOrderId",
        entry_premium_rate as "entryPremiumRate",
        current_premium_rate as "currentPremiumRate",
        unrealized_pnl as "unrealizedPnl",
        realized_pnl as "realizedPnl",
        total_fees as "totalFees",
        entry_time as "entryTime",
        exit_time as "exitTime",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM positions 
      WHERE user_id = $1 AND status = 'open' AND is_mock = false
      ORDER BY entry_time DESC
    `;
    
    return this.query<PositionDto>(query, [userId]);
  }

  /**
   * 포지션 현재가 및 PnL 업데이트
   */
  async updatePricesAndPnl(
    id: number,
    upbitCurrentPrice?: number,
    binanceCurrentPrice?: number,
    currentPremiumRate?: number,
    unrealizedPnl?: number
  ): Promise<boolean> {
    const updates: Record<string, any> = {};
    
    if (upbitCurrentPrice !== undefined) {
      updates.current_price = upbitCurrentPrice;
    }
    
    if (binanceCurrentPrice !== undefined) {
      updates.binance_current_price = binanceCurrentPrice;
    }
    
    if (currentPremiumRate !== undefined) {
      updates.current_premium_rate = currentPremiumRate;
    }
    
    if (unrealizedPnl !== undefined) {
      updates.unrealized_pnl = unrealizedPnl;
    }

    if (Object.keys(updates).length === 0) {
      return false;
    }

    const updatedRows = await this.safeUpdate('positions', updates, { id });
    return updatedRows > 0;
  }

  /**
   * 포지션 청산
   */
  async close(
    id: number,
    exitPrice: number,
    exitPremiumRate: number,
    realizedPnl: number,
    totalFees: number
  ): Promise<boolean> {
    const updates = {
      status: 'closed',
      exit_price: exitPrice,
      exit_premium_rate: exitPremiumRate,
      realized_pnl: realizedPnl,
      total_fees: totalFees,
      exit_time: new Date()
    };

    const updatedRows = await this.safeUpdate('positions', updates, { id });
    return updatedRows > 0;
  }

  /**
   * 사용자의 포지션 요약 정보 조회
   */
  async getSummary(userId: number): Promise<PositionSummaryDto> {
    const query = `
      SELECT 
        COUNT(*) as total_positions,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open_positions,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_positions,
        COALESCE(SUM(CASE WHEN status = 'open' THEN unrealized_pnl ELSE 0 END), 0) as total_unrealized_pnl,
        COALESCE(SUM(CASE WHEN status = 'closed' THEN realized_pnl ELSE 0 END), 0) as total_realized_pnl,
        COALESCE(SUM(total_fees), 0) as total_fees,
        COALESCE(SUM(CASE WHEN status = 'open' THEN (quantity * entry_price) + (binance_quantity * binance_entry_price) ELSE 0 END), 0) as total_investment
      FROM positions 
      WHERE user_id = $1 AND is_mock = false
    `;

    const result = await this.queryOne<{
      total_positions: string;
      open_positions: string;
      closed_positions: string;
      total_unrealized_pnl: string;
      total_realized_pnl: string;
      total_fees: string;
      total_investment: string;
    }>(query, [userId]);

    const totalUnrealizedPnl = parseFloat(result?.total_unrealized_pnl || '0');
    const totalRealizedPnl = parseFloat(result?.total_realized_pnl || '0');
    const totalInvestment = parseFloat(result?.total_investment || '0');

    return {
      totalPositions: parseInt(result?.total_positions || '0'),
      openPositions: parseInt(result?.open_positions || '0'),
      closedPositions: parseInt(result?.closed_positions || '0'),
      totalUnrealizedPnl,
      totalRealizedPnl,
      totalFees: parseFloat(result?.total_fees || '0'),
      totalInvestment,
      profitRate: totalInvestment > 0 ? ((totalUnrealizedPnl + totalRealizedPnl) / totalInvestment) * 100 : 0
    };
  }

  /**
   * 전략별 포지션 조회
   */
  async findByStrategyId(strategyId: number): Promise<PositionDto[]> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        strategy_id as "strategyId",
        symbol,
        side,
        status,
        quantity as "upbitQuantity",
        entry_price as "upbitEntryPrice",
        current_price as "upbitCurrentPrice",
        upbit_order_id as "upbitOrderId",
        binance_quantity as "binanceQuantity",
        binance_entry_price as "binanceEntryPrice",
        binance_leverage as "binanceLeverage",
        binance_order_id as "binanceOrderId",
        entry_premium_rate as "entryPremiumRate",
        current_premium_rate as "currentPremiumRate",
        unrealized_pnl as "unrealizedPnl",
        realized_pnl as "realizedPnl",
        total_fees as "totalFees",
        entry_time as "entryTime",
        exit_time as "exitTime",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM positions 
      WHERE strategy_id = $1 AND is_mock = false
      ORDER BY entry_time DESC
    `;
    
    return this.query<PositionDto>(query, [strategyId]);
  }
}
