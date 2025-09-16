import { BaseRepository } from './BaseRepository.js';
import { BalanceDto, BalanceResponseDto } from '../types/trading.js';

/**
 * 잔고 관리 Repository
 * balance_snapshots 테이블을 사용하여 거래소 잔고 상태를 관리
 */
export class BalanceRepository extends BaseRepository {

  /**
   * 잔고 스냅샷 저장
   */
  async createSnapshot(userId: number, balanceData: Omit<BalanceDto, 'userId'>): Promise<BalanceDto> {
    const query = `
      INSERT INTO balance_snapshots (
        user_id, exchange, currency, available, locked, total,
        usd_value, krw_value, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW()
      )
      RETURNING 
        id,
        user_id as "userId",
        exchange,
        currency,
        available,
        locked,
        total,
        usd_value as "usdValue",
        krw_value as "krwValue",
        created_at as "createdAt"
    `;

    const result = await this.queryOne<BalanceDto>(query, [
      userId,
      balanceData.exchange,
      balanceData.currency,
      balanceData.available,
      balanceData.locked,
      balanceData.total,
      balanceData.usdValue || null,
      balanceData.krwValue || null
    ]);

    if (!result) {
      throw new Error('잔고 스냅샷 생성에 실패했습니다.');
    }

    return result;
  }

  /**
   * 사용자의 최신 잔고 조회
   */
  async getLatestBalances(userId: number): Promise<BalanceResponseDto> {
    // 각 거래소별 최신 잔고 조회
    const query = `
      WITH latest_balances AS (
        SELECT DISTINCT ON (exchange, currency)
          exchange, currency, available, locked, total, usd_value, krw_value, created_at
        FROM balance_snapshots 
        WHERE user_id = $1
        ORDER BY exchange, currency, created_at DESC
      )
      SELECT * FROM latest_balances
      ORDER BY exchange, currency
    `;

    const balances = await this.query<{
      exchange: string;
      currency: string;
      available: number;
      locked: number;
      total: number;
      usd_value: number | null;
      krw_value: number | null;
      created_at: Date;
    }>(query, [userId]);

    // 거래소 연결 상태 조회
    const connectionQuery = `
      SELECT exchange, connected
      FROM exchange_connections
      WHERE user_id = $1
    `;

    const connections = await this.query<{
      exchange: string;
      connected: boolean;
    }>(connectionQuery, [userId]);

    // 응답 형태로 변환
    const real: BalanceResponseDto['real'] = {};
    const connected: BalanceResponseDto['connected'] = { upbit: false, binance: false };
    const balanceDetails: BalanceResponseDto['balances'] = { upbit: [], binance: [] };

    // 연결 상태 설정
    connections.forEach(conn => {
      if (conn.exchange === 'upbit' || conn.exchange === 'binance') {
        connected[conn.exchange as 'upbit' | 'binance'] = conn.connected;
      }
    });

    // 잔고 데이터 변환
    balances.forEach(balance => {
      const balanceDto: BalanceDto = {
        exchange: balance.exchange as 'upbit' | 'binance',
        currency: balance.currency,
        available: balance.available,
        locked: balance.locked,
        total: balance.total,
        usdValue: balance.usd_value || undefined,
        krwValue: balance.krw_value || undefined
      };

      if (balance.exchange === 'upbit') {
        balanceDetails.upbit.push(balanceDto);
        if (balance.currency === 'KRW') real.krw = balance.total;
        if (balance.currency === 'BTC') real.btc_upbit = balance.total;
      } else if (balance.exchange === 'binance') {
        balanceDetails.binance.push(balanceDto);
        if (balance.currency === 'USDT') real.usdt = balance.total;
      }
    });

    return {
      real,
      connected,
      balances: balanceDetails,
      lastUpdated: balances.length > 0 ? balances[0].created_at : new Date()
    };
  }

  /**
   * 특정 거래소의 특정 통화 잔고 조회
   */
  async getBalance(userId: number, exchange: string, currency: string): Promise<BalanceDto | null> {
    const query = `
      SELECT 
        user_id as "userId",
        exchange,
        currency,
        available,
        locked,
        total,
        usd_value as "usdValue",
        krw_value as "krwValue"
      FROM balance_snapshots 
      WHERE user_id = $1 AND exchange = $2 AND currency = $3
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    return this.queryOne<BalanceDto>(query, [userId, exchange, currency]);
  }

  /**
   * 벌크 잔고 업데이트
   */
  async bulkUpdateBalances(userId: number, balances: Omit<BalanceDto, 'userId'>[]): Promise<void> {
    if (balances.length === 0) return;

    const columns = [
      'user_id', 'exchange', 'currency', 'available', 'locked', 'total',
      'usd_value', 'krw_value', 'created_at'
    ];

    const values = balances.map(balance => [
      userId,
      balance.exchange,
      balance.currency,
      balance.available,
      balance.locked,
      balance.total,
      balance.usdValue || null,
      balance.krwValue || null,
      new Date()
    ]);

    await this.bulkInsert('balance_snapshots', columns, values);
  }

  /**
   * 오래된 잔고 스냅샷 정리 (30일 이전 데이터 삭제)
   */
  async cleanupOldSnapshots(daysToKeep: number = 30): Promise<number> {
    const query = `
      DELETE FROM balance_snapshots 
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `;

    const result = await this.query(query);
    return (result as any).rowCount || 0;
  }

  /**
   * 잔고 변화 내역 조회 (특정 기간)
   */
  async getBalanceHistory(
    userId: number,
    exchange: string,
    currency: string,
    startDate: string,
    endDate: string
  ): Promise<BalanceDto[]> {
    const query = `
      SELECT 
        user_id as "userId",
        exchange,
        currency,
        available,
        locked,
        total,
        usd_value as "usdValue",
        krw_value as "krwValue",
        created_at as "createdAt"
      FROM balance_snapshots 
      WHERE user_id = $1 
        AND exchange = $2 
        AND currency = $3
        AND DATE(created_at) >= $4 
        AND DATE(created_at) <= $5
      ORDER BY created_at ASC
    `;
    
    return this.query<BalanceDto & { createdAt: Date }>(query, [
      userId, exchange, currency, startDate, endDate
    ]);
  }

  /**
   * 사용자별 총 자산 가치 조회 (KRW 환산)
   */
  async getTotalAssetValue(userId: number): Promise<{
    totalKrwValue: number;
    totalUsdValue: number;
    byExchange: Record<string, { krwValue: number; usdValue: number }>;
  }> {
    const query = `
      WITH latest_balances AS (
        SELECT DISTINCT ON (exchange, currency)
          exchange, currency, krw_value, usd_value
        FROM balance_snapshots 
        WHERE user_id = $1 AND (krw_value > 0 OR usd_value > 0)
        ORDER BY exchange, currency, created_at DESC
      )
      SELECT 
        exchange,
        COALESCE(SUM(krw_value), 0) as exchange_krw_value,
        COALESCE(SUM(usd_value), 0) as exchange_usd_value
      FROM latest_balances
      GROUP BY exchange
    `;

    const result = await this.query<{
      exchange: string;
      exchange_krw_value: string;
      exchange_usd_value: string;
    }>(query, [userId]);

    let totalKrwValue = 0;
    let totalUsdValue = 0;
    const byExchange: Record<string, { krwValue: number; usdValue: number }> = {};

    result.forEach(row => {
      const krwValue = parseFloat(row.exchange_krw_value);
      const usdValue = parseFloat(row.exchange_usd_value);
      
      totalKrwValue += krwValue;
      totalUsdValue += usdValue;
      
      byExchange[row.exchange] = { krwValue, usdValue };
    });

    return {
      totalKrwValue,
      totalUsdValue,
      byExchange
    };
  }
}
