import { BaseRepository } from './BaseRepository.js';

/**
 * 일일 통계 Repository
 * daily_stats 테이블을 사용하여 사용자별 일일 거래 통계를 관리
 */
export class DailyStatsRepository extends BaseRepository {

  /**
   * 일일 통계 조회 또는 생성
   */
  async getOrCreateDailyStats(userId: number, date: string): Promise<{
    id: number;
    userId: number;
    date: string;
    totalTrades: number;
    upbitTrades: number;
    binanceTrades: number;
    activePositions: number;
    totalFees: number;
    realizedPnl: number;
    unrealizedPnl: number;
    totalVolume: number;
    winRate: number;
    maxDrawdown: number;
    createdAt: Date;
    updatedAt: Date;
  }> {
    // 먼저 기존 통계 조회
    let stats = await this.queryOne<any>(`
      SELECT 
        id,
        user_id as "userId",
        date,
        total_trades as "totalTrades",
        upbit_trades as "upbitTrades",
        binance_trades as "binanceTrades",
        active_positions as "activePositions",
        total_fees as "totalFees",
        realized_pnl as "realizedPnl",
        unrealized_pnl as "unrealizedPnl",
        total_volume as "totalVolume",
        win_rate as "winRate",
        max_drawdown as "maxDrawdown",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM daily_stats 
      WHERE user_id = $1 AND date = $2
    `, [userId, date]);

    // 없으면 새로 생성
    if (!stats) {
      stats = await this.queryOne<any>(`
        INSERT INTO daily_stats (
          user_id, date, total_trades, upbit_trades, binance_trades,
          active_positions, total_fees, realized_pnl, unrealized_pnl,
          total_volume, win_rate, max_drawdown, created_at, updated_at
        ) VALUES (
          $1, $2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, NOW(), NOW()
        )
        RETURNING 
          id,
          user_id as "userId",
          date,
          total_trades as "totalTrades",
          upbit_trades as "upbitTrades",
          binance_trades as "binanceTrades",
          active_positions as "activePositions",
          total_fees as "totalFees",
          realized_pnl as "realizedPnl",
          unrealized_pnl as "unrealizedPnl",
          total_volume as "totalVolume",
          win_rate as "winRate",
          max_drawdown as "maxDrawdown",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `, [userId, date]);
    }

    return stats;
  }

  /**
   * 거래 발생시 통계 업데이트
   */
  async incrementTradeCount(
    userId: number, 
    date: string, 
    exchange: 'upbit' | 'binance',
    volume: number,
    fee: number
  ): Promise<void> {
    await this.transaction(async (client) => {
      // 기존 통계 조회
      const existing = await client.query(`
        SELECT id FROM daily_stats 
        WHERE user_id = $1 AND date = $2
      `, [userId, date]);

      if (existing.rows.length === 0) {
        // 새로 생성
        await client.query(`
          INSERT INTO daily_stats (
            user_id, date, total_trades, upbit_trades, binance_trades,
            total_volume, total_fees, created_at, updated_at
          ) VALUES (
            $1, $2, 1, $3, $4, $5, $6, NOW(), NOW()
          )
        `, [
          userId, 
          date, 
          exchange === 'upbit' ? 1 : 0,
          exchange === 'binance' ? 1 : 0,
          volume,
          fee
        ]);
      } else {
        // 기존 통계 업데이트
        const exchangeField = exchange === 'upbit' ? 'upbit_trades' : 'binance_trades';
        await client.query(`
          UPDATE daily_stats 
          SET 
            total_trades = total_trades + 1,
            ${exchangeField} = ${exchangeField} + 1,
            total_volume = total_volume + $3,
            total_fees = total_fees + $4,
            updated_at = NOW()
          WHERE user_id = $1 AND date = $2
        `, [userId, date, volume, fee]);
      }
    });
  }

  /**
   * 포지션 수 업데이트
   */
  async updateActivePositions(userId: number, date: string): Promise<void> {
    // 실제 활성 포지션 수 계산
    const activeCount = await this.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM positions WHERE user_id = $1 AND status = $2',
      [userId, 'open']
    );

    const count = parseInt(activeCount?.count || '0');

    // 통계 업데이트
    await this.query(`
      INSERT INTO daily_stats (user_id, date, active_positions, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (user_id, date)
      DO UPDATE SET 
        active_positions = $3,
        updated_at = NOW()
    `, [userId, date, count]);
  }

  /**
   * 실현 손익 업데이트
   */
  async updateRealizedPnl(userId: number, date: string, pnlChange: number): Promise<void> {
    await this.query(`
      INSERT INTO daily_stats (user_id, date, realized_pnl, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (user_id, date)
      DO UPDATE SET 
        realized_pnl = daily_stats.realized_pnl + $3,
        updated_at = NOW()
    `, [userId, date, pnlChange]);
  }

  /**
   * 미실현 손익 업데이트
   */
  async updateUnrealizedPnl(userId: number, date: string, totalUnrealizedPnl: number): Promise<void> {
    await this.query(`
      INSERT INTO daily_stats (user_id, date, unrealized_pnl, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (user_id, date)
      DO UPDATE SET 
        unrealized_pnl = $3,
        updated_at = NOW()
    `, [userId, date, totalUnrealizedPnl]);
  }

  /**
   * 승률 계산 및 업데이트
   */
  async updateWinRate(userId: number, date: string): Promise<void> {
    const winRateQuery = `
      WITH position_results AS (
        SELECT 
          CASE WHEN realized_pnl > 0 THEN 1 ELSE 0 END as is_win
        FROM positions 
        WHERE user_id = $1 
          AND status = 'closed' 
          AND DATE(exit_time) = $2
      )
      SELECT 
        COUNT(*) as total_closed,
        SUM(is_win) as wins
      FROM position_results
    `;

    const result = await this.queryOne<{
      total_closed: string;
      wins: string;
    }>(winRateQuery, [userId, date]);

    const totalClosed = parseInt(result?.total_closed || '0');
    const wins = parseInt(result?.wins || '0');
    const winRate = totalClosed > 0 ? (wins / totalClosed) * 100 : 0;

    await this.query(`
      INSERT INTO daily_stats (user_id, date, win_rate, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (user_id, date)
      DO UPDATE SET 
        win_rate = $3,
        updated_at = NOW()
    `, [userId, date, winRate]);
  }

  /**
   * 최대 손실폭 업데이트
   */
  async updateMaxDrawdown(userId: number, date: string, drawdown: number): Promise<void> {
    await this.query(`
      INSERT INTO daily_stats (user_id, date, max_drawdown, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (user_id, date)
      DO UPDATE SET 
        max_drawdown = GREATEST(daily_stats.max_drawdown, $3),
        updated_at = NOW()
    `, [userId, date, Math.abs(drawdown)]);
  }

  /**
   * 기간별 통계 조회
   */
  async getStatsByDateRange(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        date,
        total_trades as "totalTrades",
        upbit_trades as "upbitTrades",
        binance_trades as "binanceTrades",
        active_positions as "activePositions",
        total_fees as "totalFees",
        realized_pnl as "realizedPnl",
        unrealized_pnl as "unrealizedPnl",
        total_volume as "totalVolume",
        win_rate as "winRate",
        max_drawdown as "maxDrawdown",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM daily_stats 
      WHERE user_id = $1 
        AND date >= $2 
        AND date <= $3
      ORDER BY date DESC
    `;
    
    return this.query(query, [userId, startDate, endDate]);
  }

  /**
   * 월별 통계 요약
   */
  async getMonthlyStats(userId: number, year: number, month: number): Promise<{
    totalTrades: number;
    totalFees: number;
    totalRealizedPnl: number;
    avgWinRate: number;
    maxDrawdown: number;
    tradingDays: number;
  }> {
    const query = `
      SELECT 
        COALESCE(SUM(total_trades), 0) as total_trades,
        COALESCE(SUM(total_fees), 0) as total_fees,
        COALESCE(SUM(realized_pnl), 0) as total_realized_pnl,
        COALESCE(AVG(win_rate), 0) as avg_win_rate,
        COALESCE(MAX(max_drawdown), 0) as max_drawdown,
        COUNT(*) as trading_days
      FROM daily_stats 
      WHERE user_id = $1 
        AND EXTRACT(YEAR FROM DATE(date)) = $2
        AND EXTRACT(MONTH FROM DATE(date)) = $3
    `;

    const result = await this.queryOne<{
      total_trades: string;
      total_fees: string;
      total_realized_pnl: string;
      avg_win_rate: string;
      max_drawdown: string;
      trading_days: string;
    }>(query, [userId, year, month]);

    return {
      totalTrades: parseInt(result?.total_trades || '0'),
      totalFees: parseFloat(result?.total_fees || '0'),
      totalRealizedPnl: parseFloat(result?.total_realized_pnl || '0'),
      avgWinRate: parseFloat(result?.avg_win_rate || '0'),
      maxDrawdown: parseFloat(result?.max_drawdown || '0'),
      tradingDays: parseInt(result?.trading_days || '0')
    };
  }
}
