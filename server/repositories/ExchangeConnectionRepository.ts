import { BaseRepository } from './BaseRepository.js';
import { ExchangeConnectionDto, ExchangeStatusResponseDto } from '../types/trading.js';

/**
 * 거래소 연결 상태 Repository
 * exchange_connections 테이블을 사용하여 거래소 API 연결 상태를 관리
 */
export class ExchangeConnectionRepository extends BaseRepository {

  /**
   * 연결 상태 업데이트 또는 생성
   */
  async upsertConnection(userId: number, connectionData: Omit<ExchangeConnectionDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExchangeConnectionDto> {
    const query = `
      INSERT INTO exchange_connections (
        user_id, exchange, connected, last_checked, error, permissions,
        balance_available, trading_enabled, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      )
      ON CONFLICT (user_id, exchange) 
      DO UPDATE SET 
        connected = EXCLUDED.connected,
        last_checked = EXCLUDED.last_checked,
        error = EXCLUDED.error,
        permissions = EXCLUDED.permissions,
        balance_available = EXCLUDED.balance_available,
        trading_enabled = EXCLUDED.trading_enabled,
        updated_at = NOW()
      RETURNING 
        id,
        user_id as "userId",
        exchange,
        connected,
        last_checked as "lastChecked",
        error,
        permissions,
        balance_available as "balanceAvailable",
        trading_enabled as "tradingEnabled",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.queryOne<ExchangeConnectionDto>(query, [
      userId,
      connectionData.exchange,
      connectionData.connected,
      connectionData.lastChecked,
      connectionData.error || null,
      connectionData.permissions ? JSON.stringify(connectionData.permissions) : null,
      connectionData.balanceAvailable,
      connectionData.tradingEnabled
    ]);

    if (!result) {
      throw new Error('거래소 연결 상태 저장에 실패했습니다.');
    }

    return result;
  }

  /**
   * 사용자의 모든 거래소 연결 상태 조회
   */
  async findByUserId(userId: number): Promise<ExchangeConnectionDto[]> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        exchange,
        connected,
        last_checked as "lastChecked",
        error,
        permissions,
        balance_available as "balanceAvailable",
        trading_enabled as "tradingEnabled",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM exchange_connections 
      WHERE user_id = $1
      ORDER BY exchange
    `;
    
    return this.query<ExchangeConnectionDto>(query, [userId]);
  }

  /**
   * 특정 거래소 연결 상태 조회
   */
  async findByUserAndExchange(userId: number, exchange: string): Promise<ExchangeConnectionDto | null> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        exchange,
        connected,
        last_checked as "lastChecked",
        error,
        permissions,
        balance_available as "balanceAvailable",
        trading_enabled as "tradingEnabled",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM exchange_connections 
      WHERE user_id = $1 AND exchange = $2
    `;
    
    return this.queryOne<ExchangeConnectionDto>(query, [userId, exchange]);
  }

  /**
   * 연결 상태 요약 조회 (API 응답용)
   */
  async getConnectionStatus(userId: number): Promise<ExchangeStatusResponseDto> {
    const connections = await this.findByUserId(userId);
    
    const exchanges: ExchangeStatusResponseDto['exchanges'] = {
      upbit: {
        exchange: 'upbit',
        connected: false,
        lastChecked: new Date(),
        balanceAvailable: false,
        tradingEnabled: false
      },
      binance: {
        exchange: 'binance',
        connected: false,
        lastChecked: new Date(),
        balanceAvailable: false,
        tradingEnabled: false
      }
    };

    // 연결 상태 정보 매핑
    connections.forEach(conn => {
      if (conn.exchange === 'upbit' || conn.exchange === 'binance') {
        exchanges[conn.exchange as 'upbit' | 'binance'] = {
          exchange: conn.exchange as 'upbit' | 'binance',
          connected: conn.connected,
          lastChecked: conn.lastChecked,
          error: conn.error,
          permissions: conn.permissions as string[] | undefined,
          balanceAvailable: conn.balanceAvailable,
          tradingEnabled: conn.tradingEnabled
        };
      }
    });

    const connectedCount = Object.values(exchanges).filter(ex => ex.connected).length;
    const totalCount = Object.keys(exchanges).length;

    return {
      connected: connectedCount > 0,
      totalExchanges: totalCount,
      connectedExchanges: connectedCount,
      exchanges,
      message: connectedCount === 0 
        ? '연결된 거래소가 없습니다.' 
        : `${connectedCount}/${totalCount} 거래소가 연결되었습니다.`
    };
  }

  /**
   * 연결 상태만 업데이트
   */
  async updateConnectionStatus(
    userId: number, 
    exchange: string, 
    connected: boolean, 
    error?: string
  ): Promise<boolean> {
    const updates: Record<string, any> = {
      connected,
      last_checked: new Date()
    };

    if (error !== undefined) {
      updates.error = error;
    }

    const updatedRows = await this.safeUpdate(
      'exchange_connections',
      updates,
      { user_id: userId, exchange }
    );

    return updatedRows > 0;
  }

  /**
   * 권한 정보 업데이트
   */
  async updatePermissions(
    userId: number,
    exchange: string,
    permissions: string[],
    balanceAvailable: boolean,
    tradingEnabled: boolean
  ): Promise<boolean> {
    const updates = {
      permissions: JSON.stringify(permissions),
      balance_available: balanceAvailable,
      trading_enabled: tradingEnabled,
      last_checked: new Date()
    };

    const updatedRows = await this.safeUpdate(
      'exchange_connections',
      updates,
      { user_id: userId, exchange }
    );

    return updatedRows > 0;
  }

  /**
   * 연결된 거래소 목록 조회
   */
  async getConnectedExchanges(userId: number): Promise<string[]> {
    const query = `
      SELECT exchange
      FROM exchange_connections 
      WHERE user_id = $1 AND connected = true
      ORDER BY exchange
    `;
    
    const result = await this.query<{ exchange: string }>(query, [userId]);
    return result.map(row => row.exchange);
  }

  /**
   * 거래 가능한 거래소 목록 조회
   */
  async getTradingEnabledExchanges(userId: number): Promise<string[]> {
    const query = `
      SELECT exchange
      FROM exchange_connections 
      WHERE user_id = $1 AND connected = true AND trading_enabled = true
      ORDER BY exchange
    `;
    
    const result = await this.query<{ exchange: string }>(query, [userId]);
    return result.map(row => row.exchange);
  }

  /**
   * 연결 오류 기록
   */
  async recordError(userId: number, exchange: string, error: string): Promise<void> {
    await this.safeUpdate(
      'exchange_connections',
      {
        connected: false,
        error,
        last_checked: new Date()
      },
      { user_id: userId, exchange }
    );
  }

  /**
   * 오래된 연결 상태 정리 (7일 이전 에러 기록 삭제)
   */
  async cleanupOldErrors(daysToKeep: number = 7): Promise<number> {
    const query = `
      UPDATE exchange_connections 
      SET error = NULL, updated_at = NOW()
      WHERE error IS NOT NULL 
        AND last_checked < NOW() - INTERVAL '${daysToKeep} days'
    `;

    const result = await this.query(query);
    return (result as any).rowCount || 0;
  }

  /**
   * 전체 시스템 연결 상태 조회 (관리자용)
   */
  async getSystemConnectionStatus(): Promise<{
    totalUsers: number;
    connectedUsers: number;
    totalConnections: number;
    activeConnections: number;
    byExchange: Record<string, { total: number; connected: number }>;
  }> {
    const query = `
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT CASE WHEN connected = true THEN user_id END) as connected_users,
        COUNT(*) as total_connections,
        COUNT(CASE WHEN connected = true THEN 1 END) as active_connections,
        exchange,
        COUNT(*) as exchange_total,
        COUNT(CASE WHEN connected = true THEN 1 END) as exchange_connected
      FROM exchange_connections
      GROUP BY ROLLUP(exchange)
      ORDER BY exchange NULLS LAST
    `;

    const result = await this.query<{
      total_users: string;
      connected_users: string;
      total_connections: string;
      active_connections: string;
      exchange: string | null;
      exchange_total: string;
      exchange_connected: string;
    }>(query);

    const summary = result.find(row => row.exchange === null);
    const byExchange: Record<string, { total: number; connected: number }> = {};

    result.filter(row => row.exchange !== null).forEach(row => {
      if (row.exchange) {
        byExchange[row.exchange] = {
          total: parseInt(row.exchange_total),
          connected: parseInt(row.exchange_connected)
        };
      }
    });

    return {
      totalUsers: parseInt(summary?.total_users || '0'),
      connectedUsers: parseInt(summary?.connected_users || '0'),
      totalConnections: parseInt(summary?.total_connections || '0'),
      activeConnections: parseInt(summary?.active_connections || '0'),
      byExchange
    };
  }
}
