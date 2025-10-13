import pg, { Pool } from 'pg';

// PostgreSQL numeric 타입을 자동으로 숫자로 파싱
pg.types.setTypeParser(1700, (val: string) => parseFloat(val));
import { hashPassword } from "./utils/auth.js";
import { encryptApiKey, decryptApiKey } from "./utils/encryption.js";
import { normalizeLeverage } from "./utils/trading-constants.js";

// PostgreSQL 연결 풀 설정 (로컬 DB 강제 연결)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://ahndj@localhost:5432/trading_db",
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// 디버깅: 실제 연결 URL 확인
console.log('🔧 [storage.ts] DATABASE_URL:', process.env.DATABASE_URL || "postgresql://ahndj@localhost:5432/trading_db");

// 타입 정의들 (기존과 동일)
export type User = {
  id: number;
  username: string;
  role: string;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  passwordHash: string;
  password: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
};

export type InsertUser = {
  username: string;
  password: string;
  role?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
};

export type Exchange = {
  id: number;
  apiKey: string;
  isActive: boolean;
  userId: number;
  exchange: string;
  apiSecret: string;
  passphrase: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InsertExchange = {
  userId: number;
  exchange: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string | null;
  isActive?: boolean;
};

export type Cryptocurrency = {
  id: number;
  symbol: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  upbitMarket: string | null;
  binanceSymbol: string | null;
  priority: number;
};

export type InsertCryptocurrency = {
  symbol: string;
  name: string;
  isActive?: boolean;
  upbitMarket?: string | null;
  binanceSymbol?: string | null;
  priority?: number;
};

export type KimchiPremium = {
  id: number;
  symbol: string;
  upbitPrice: number;
  binancePrice: number;
  premiumRate: number;
  timestamp: Date;
  exchangeRate: number;
  premiumAmount: number;
};

export type InsertKimchiPremium = {
  symbol: string;
  upbitPrice: string | number;
  binancePrice: string | number;
  premiumRate: string | number;
  exchangeRate: string | number;
  premiumAmount: string | number;
  timestamp?: Date;
};

// DatabaseStorage 클래스 - SQL 기반
export class DatabaseStorage {
  public pool: Pool;

  constructor() {
    this.pool = pool;
  }

  // 연결 테스트
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  // === 사용자 관련 메서드들 ===

  async getUserById(id: string | number): Promise<User | undefined> {
    try {
      if (id === undefined || id === null) {
        console.error('getUserById: ID is undefined or null');
        console.error('getUserById: Call stack:', new Error().stack);
        return undefined;
      }

      const numericId = typeof id === 'string' ? parseInt(id) : id;
      if (isNaN(numericId)) {
        console.error('getUserById: Invalid ID provided:', id);
        return undefined;
      }

      const result = await this.pool.query(
        'SELECT * FROM users WHERE id = $1',
        [numericId]
      );

      if (!result.rows[0]) return undefined;

      const row = result.rows[0];
      // snake_case를 camelCase로 변환
      return {
        id: row.id,
        username: row.username,
        role: row.role,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        profileImageUrl: row.profile_image_url,
        password: row.password,
        passwordHash: row.password,
        isActive: row.is_active,
        approvalStatus: row.approval_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      if (!result.rows[0]) return undefined;

      const row = result.rows[0];
      // snake_case를 camelCase로 변환
      return {
        id: row.id,
        username: row.username,
        role: row.role,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        profileImageUrl: row.profile_image_url,
        password: row.password,
        passwordHash: row.password,
        isActive: row.is_active,
        approvalStatus: row.approval_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at
      };
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser & { password?: string }): Promise<User> {
    if (!insertUser.password) {
      throw new Error("비밀번호가 필요합니다.");
    }

    const hashedPassword = await hashPassword(insertUser.password);
    
    try {
      const result = await this.pool.query(`
        INSERT INTO users (
          username,
          password,
          role,
          approval_status,
          email,
          first_name,
          last_name,
          profile_image_url,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `, [
        insertUser.username,
        hashedPassword,
        insertUser.role || 'user',
        insertUser.approvalStatus || 'pending',
        insertUser.email || null,
        insertUser.firstName || null,
        insertUser.lastName || null,
        insertUser.profileImageUrl || null
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        // camelCase를 snake_case로 변환
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return this.getUserById(id);
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    try {
      const result = await this.pool.query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'DELETE FROM users WHERE id = $1',
        [id]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }


  // === 거래소 API 관련 메서드들 ===

  async getExchangesByUserId(userId: number): Promise<Exchange[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM exchanges WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      
      // API 키 복호화 및 camelCase 변환
      return result.rows.map(exchange => ({
        ...exchange,
        apiKey: decryptApiKey(exchange.api_key),
        apiSecret: decryptApiKey(exchange.api_secret),
        isActive: exchange.is_active, // snake_case → camelCase 변환
        userId: exchange.user_id,     // snake_case → camelCase 변환
        apiChangeStatus: exchange.api_change_status, // snake_case → camelCase 변환
        createdAt: exchange.created_at,
        updatedAt: exchange.updated_at
      }));
    } catch (error) {
      console.error('Error getting exchanges:', error);
      return [];
    }
  }

  async createExchange(insertExchange: InsertExchange): Promise<Exchange> {
    const encryptedApiKey = encryptApiKey(insertExchange.apiKey);
    const encryptedApiSecret = encryptApiKey(insertExchange.apiSecret);
    
    try {
      const result = await this.pool.query(`
        INSERT INTO exchanges (
          user_id, 
          exchange, 
          api_key, 
          api_secret, 
          passphrase, 
          is_active,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [
        insertExchange.userId,
        insertExchange.exchange,
        encryptedApiKey,
        encryptedApiSecret,
        insertExchange.passphrase || null,
        insertExchange.isActive !== false
      ]);

      const exchange = result.rows[0];
      return {
        ...exchange,
        apiKey: insertExchange.apiKey,
        apiSecret: insertExchange.apiSecret
      };
    } catch (error) {
      console.error('Error creating exchange:', error);
      throw error;
    }
  }

  // === 암호화폐 관련 메서드들 ===

  async getAllCryptocurrencies(): Promise<Cryptocurrency[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM cryptocurrencies ORDER BY priority DESC, symbol ASC'
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting cryptocurrencies:', error);
      return [];
    }
  }

  async createCryptocurrency(insertCrypto: InsertCryptocurrency): Promise<Cryptocurrency> {
    try {
      const result = await this.pool.query(`
        INSERT INTO cryptocurrencies (
          symbol, 
          name, 
          is_active, 
          upbit_market, 
          binance_symbol, 
          priority,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [
        insertCrypto.symbol,
        insertCrypto.name,
        insertCrypto.isActive !== false,
        insertCrypto.upbitMarket || null,
        insertCrypto.binanceSymbol || null,
        insertCrypto.priority || 0
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating cryptocurrency:', error);
      throw error;
    }
  }

  // === 김치 프리미엄 관련 메서드들 ===

  async saveKimchiPremium(data: InsertKimchiPremium): Promise<KimchiPremium> {
    try {
      const result = await this.pool.query(`
        INSERT INTO kimchi_premiums (
          symbol, 
          upbit_price, 
          binance_price, 
          premium_rate, 
          exchange_rate, 
          premium_amount,
          timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        data.symbol,
        data.upbitPrice,
        data.binancePrice,
        data.premiumRate,
        data.exchangeRate,
        data.premiumAmount,
        data.timestamp || new Date()
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error saving kimchi premium:', error);
      throw error;
    }
  }

  async getRecentKimchiPremiums(limit: number = 100): Promise<KimchiPremium[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM kimchi_premiums ORDER BY timestamp DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting recent kimchi premiums:', error);
      return [];
    }
  }

  // === 트레이딩 설정 관련 메서드들 ===
  
  async getTradingStrategies(userId: number): Promise<any[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM trading_strategies WHERE user_id = $1 ORDER BY is_active DESC, created_at DESC, id DESC',
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting trading strategies:', error);
      return [];
    }
  }

  async getTradingStrategy(id: number): Promise<any | undefined> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM trading_strategies WHERE id = $1',
        [id]
      );
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error getting trading strategy:', error);
      return undefined;
    }
  }

  // === 포지션 관련 메서드들 ===
  
  async getActivePositions(userId: number): Promise<any[]> {
    try {
      const result = await this.pool.query(
        `SELECT p.*,
                ts.name as strategy_name,
                fes.take_profit_offset,
                fes.id as force_entry_settings_id
         FROM positions p
         LEFT JOIN trading_strategies ts ON p.strategy_id = ts.id
         LEFT JOIN force_entry_settings fes ON p.force_entry_settings_id = fes.id
         WHERE p.user_id = $1 AND p.status = $2
         ORDER BY p.entry_time DESC`,
        [userId, 'open']
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting active positions:', error);
      return [];
    }
  }

  async getRecentPositionByStrategy(strategyId: number): Promise<any | undefined> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM positions WHERE strategy_id = $1 ORDER BY entry_time DESC LIMIT 1',
        [strategyId]
      );
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error getting recent position by strategy:', error);
      return undefined;
    }
  }

  async getActivePositionByStrategy(strategyId: number, symbol: string): Promise<any | undefined> {
    try {
      // 정확한 전략+심볼 매칭만 허용 (fallback 제거)
      const result = await this.pool.query(
        'SELECT * FROM positions WHERE strategy_id = $1 AND symbol = $2 AND status = $3 ORDER BY entry_time DESC LIMIT 1',
        [strategyId, symbol, 'open']
      );

      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error getting active position by strategy:', error);
      return undefined;
    }
  }

  async createPosition(data: any): Promise<any> {
    try {
      const result = await this.pool.query(`
        INSERT INTO positions (
          user_id, strategy_id, symbol, type, entry_price, quantity,
          entry_premium_rate, status, side, binance_leverage,
          binance_entry_price, force_entry_settings_id, created_at, updated_at, entry_time
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          NOW(), NOW(), NOW()
        )
        RETURNING *
      `, [
        data.userId,
        data.strategyId,
        data.symbol,
        data.type || 'kimchi_arbitrage',
        data.entryPrice,
        data.quantity,
        data.entryPremiumRate,
        data.status || 'open',
        data.side,
        // 우선순위: 명시 전달값 → 전략 레버리지 → 안전 기본값 5
        (data.binanceLeverage ?? data.leverage ?? 5),
        data.binanceEntryPrice,
        data.forceEntrySettingsId || null
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Error creating position:', error);
      throw error;
    }
  }

  async updatePosition(id: number, updates: any): Promise<any | undefined> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return undefined;
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    try {
      const result = await this.pool.query(`
        UPDATE positions 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error updating position:', error);
      return undefined;
    }
  }

  // 포지션의 업비트 수량 업데이트 (API 조회 결과 기반)
  async updatePositionUpbitQuantity(positionId: string | number, actualQuantity: number): Promise<any> {
    try {
      const result = await this.pool.query(`
        UPDATE positions
        SET upbit_quantity = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [actualQuantity, positionId]);

      console.log(`📊 포지션 ${positionId} 업비트 수량 업데이트: ${actualQuantity}`);
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('포지션 업비트 수량 업데이트 실패:', error);
      return undefined;
    }
  }

  // === 거래 관련 메서드들 ===
  
  async createTrade(data: any): Promise<any> {
    try {
      // 필수 필드 검증
      const requiredFields = ['userId', 'symbol', 'side', 'exchange', 'quantity', 'price'];
      for (const field of requiredFields) {
        if (data[field] === undefined || data[field] === null) {
          throw new Error(`Required field '${field}' is missing`);
        }
      }

      // 숫자 필드 검증
      const numericFields = ['quantity', 'price'];
      for (const field of numericFields) {
        if (isNaN(parseFloat(data[field])) || parseFloat(data[field]) <= 0) {
          console.warn(`⚠️ Invalid ${field}: ${data[field]}, using 0.00000001 as fallback`);
          data[field] = 0.00000001; // 최소값으로 설정
        }
      }

      console.log('📝 [createTrade] 저장 시도:', {
        userId: data.userId,
        symbol: data.symbol,
        side: data.side,
        exchange: data.exchange,
        quantity: data.quantity,
        price: data.price,
        exchangeOrderId: data.exchangeOrderId
      });

      const result = await this.pool.query(`
        INSERT INTO trades (
          user_id, position_id, strategy_id, trade_log_id, symbol, side, exchange, quantity, price, fee,
          order_type, exchange_order_id, exchange_trade_id, executed_at, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *
      `, [
        data.userId,
        data.positionId || null,
        data.strategyId || null,
        data.tradeLogId || null,
        data.symbol,
        data.side,
        data.exchange,
        data.quantity,
        data.price,
        data.fee || 0,
        data.orderType || 'market',
        data.exchangeOrderId || null,
        data.exchangeTradeId || null
      ]);

      console.log('✅ [createTrade] 저장 성공:', { id: result.rows[0].id });
      return result.rows[0];
    } catch (error) {
      console.error('❌ [createTrade] 저장 실패:', error);
      console.error('📊 [createTrade] 실패한 데이터:', data);
      throw error;
    }
  }

  // positionId로 거래 기록 업데이트
  async updateTradePositionId(exchangeOrderId: string, positionId: number): Promise<any> {
    try {
      const result = await this.pool.query(`
        UPDATE trades
        SET position_id = $1
        WHERE exchange_order_id = $2
        RETURNING *
      `, [positionId, exchangeOrderId]);

      if (result.rows.length === 0) {
        console.warn(`⚠️ 거래 기록을 찾을 수 없음: ${exchangeOrderId}`);
      }

      return result.rows[0];
    } catch (error) {
      console.error('거래 기록 positionId 업데이트 실패:', error);
      throw error;
    }
  }

  // === 시스템 알림 관련 메서드들 ===

  async createSystemAlert(data: any): Promise<any> {
    try {
      const result = await this.pool.query(`
        INSERT INTO system_alerts (
          type, title, message, user_id, priority, data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [
        data.type, data.title, data.message, data.userId || null,
        data.priority || 'normal', data.data ? JSON.stringify(data.data) : null
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating system alert:', error);
      throw error;
    }
  }

  // === 트레이드 로그 관련 메서드들 ===
  
  async createTradeLog(data: any): Promise<any> {
    try {
      const result = await this.pool.query(`
        INSERT INTO trade_logs (
          timestamp, kimp, action, amount, result
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        data.timestamp || new Date(),
        data.kimp,
        data.action,
        data.amount,
        data.result
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating trade log:', error);
      throw error;
    }
  }

  // === 모니터링 관련 메서드들 ===

  async getTradesWithLogs(limit: number = 20): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          t.id,
          t.user_id,
          t.symbol,
          t.side,
          t.exchange,
          t.quantity,
          t.price,
          t.order_type,
          t.executed_at,
          t.created_at,
          t.position_id,
          t.strategy_id,
          tl.id as trade_log_id,
          tl.kimp,
          tl.action,
          tl.amount as trade_log_amount,
          tl.result,
          tl.timestamp as trade_log_timestamp
        FROM trades t
        LEFT JOIN trade_logs tl ON t.trade_log_id = tl.id
        ORDER BY t.created_at DESC
        LIMIT $1
      `, [limit]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching trades with logs:', error);
      throw error;
    }
  }

  async getDailyTradeStats(days: number = 7): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          DATE(t.created_at) as date,
          COUNT(*) as total_trades,
          COUNT(DISTINCT t.position_id) as positions,
          COUNT(DISTINCT t.strategy_id) as strategies_used,
          SUM(CASE WHEN t.side IN ('buy', 'short') THEN t.quantity * t.price ELSE 0 END) as entry_volume,
          SUM(CASE WHEN t.side IN ('sell', 'cover') THEN t.quantity * t.price ELSE 0 END) as exit_volume,
          AVG(CASE WHEN tl.kimp IS NOT NULL THEN tl.kimp END) as avg_kimp,
          COUNT(CASE WHEN tl.result = 'success' THEN 1 END) as successful_trades,
          COUNT(CASE WHEN tl.result = 'failed' THEN 1 END) as failed_trades
        FROM trades t
        LEFT JOIN trade_logs tl ON t.trade_log_id = tl.id
        WHERE t.created_at >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(t.created_at)
        ORDER BY date DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('Error fetching daily trade stats:', error);
      throw error;
    }
  }

  async getExchangeStats(hours: number = 24): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          t.exchange,
          COUNT(*) as trade_count,
          SUM(t.quantity * t.price) as total_volume,
          AVG(t.price) as avg_price,
          COUNT(CASE WHEN tl.result = 'success' THEN 1 END) as successful_trades,
          COUNT(CASE WHEN tl.result = 'failed' THEN 1 END) as failed_trades,
          ROUND(
            CASE WHEN COUNT(*) > 0
            THEN (COUNT(CASE WHEN tl.result = 'success' THEN 1 END) * 100.0 / COUNT(*))
            ELSE 0 END, 2
          ) as success_rate
        FROM trades t
        LEFT JOIN trade_logs tl ON t.trade_log_id = tl.id
        WHERE t.created_at >= NOW() - INTERVAL '${hours} hours'
        GROUP BY t.exchange
        ORDER BY total_volume DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('Error fetching exchange stats:', error);
      throw error;
    }
  }

  async getKimpAnalysis(days: number = 7): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          DATE(timestamp) as date,
          action,
          COUNT(*) as count,
          ROUND(AVG(kimp), 4) as avg_kimp,
          ROUND(MIN(kimp), 4) as min_kimp,
          ROUND(MAX(kimp), 4) as max_kimp,
          ROUND(SUM(amount), 0) as total_amount
        FROM trade_logs
        WHERE timestamp >= NOW() - INTERVAL '${days} days'
        GROUP BY DATE(timestamp), action
        ORDER BY date DESC, action
      `);

      return result.rows;
    } catch (error) {
      console.error('Error fetching kimp analysis:', error);
      throw error;
    }
  }

  async getDashboardData(): Promise<any> {
    try {
      // 최근 1시간 요약
      const summaryResult = await this.pool.query(`
        SELECT
          COUNT(*) as total_trades_1h,
          COUNT(DISTINCT t.position_id) as active_positions,
          COUNT(DISTINCT t.strategy_id) as active_strategies,
          SUM(t.quantity * t.price) as total_volume_1h,
          AVG(CASE WHEN tl.kimp IS NOT NULL THEN tl.kimp END) as avg_kimp_1h,
          COUNT(CASE WHEN tl.result = 'success' THEN 1 END) as successful_trades_1h
        FROM trades t
        LEFT JOIN trade_logs tl ON t.trade_log_id = tl.id
        WHERE t.created_at >= NOW() - INTERVAL '1 hour'
      `);

      // 최근 거래 5건
      const recentTradesResult = await this.pool.query(`
        SELECT
          t.symbol,
          t.side,
          t.exchange,
          t.quantity,
          t.price,
          t.created_at,
          tl.kimp,
          tl.action
        FROM trades t
        LEFT JOIN trade_logs tl ON t.trade_log_id = tl.id
        ORDER BY t.created_at DESC
        LIMIT 5
      `);

      // 거래 문제 감지
      const issuesResult = await this.pool.query(`
        SELECT COUNT(*) as zero_price_trades
        FROM trades
        WHERE price = 0 AND created_at >= NOW() - INTERVAL '1 hour'
      `);

      return {
        summary: summaryResult.rows[0],
        recentTrades: recentTradesResult.rows,
        issues: issuesResult.rows[0]
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  async getTradeLogPatterns(): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          action,
          result,
          COUNT(*) as count,
          AVG(kimp) as avg_kimp,
          AVG(amount) as avg_amount,
          MIN(timestamp) as first_occurrence,
          MAX(timestamp) as last_occurrence
        FROM trade_logs
        WHERE timestamp >= NOW() - INTERVAL '24 hours'
        GROUP BY action, result
        ORDER BY action, result
      `);

      return result.rows;
    } catch (error) {
      console.error('Error fetching trade log patterns:', error);
      throw error;
    }
  }

  // === 거래소 복호화 관련 메서드들 ===
  
  async getDecryptedExchange(userId: string | number, exchangeName: string): Promise<any | undefined> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM exchanges WHERE user_id = $1 AND exchange = $2 AND is_active = true LIMIT 1',
        [typeof userId === 'string' ? parseInt(userId) : userId, exchangeName]
      );
      
      if (result.rows.length === 0) {
        console.log(`❌ 데이터 없음: 사용자 ${userId}, 거래소 ${exchangeName}`);
        return undefined;
      }
      
      const exchange = result.rows[0];
      
      try {
        // 복호화 시도
        const decryptedApiKey = decryptApiKey(exchange.api_key);
        const decryptedApiSecret = decryptApiKey(exchange.api_secret);
        
        // console.log(`✅ 복호화 성공: 사용자 ${userId}, 거래소 ${exchangeName}`);
        return {
          ...exchange,
          apiKey: decryptedApiKey,
          apiSecret: decryptedApiSecret
        };
      } catch (decryptError) {
        console.error(`❌ 복호화 실패하지만 원본 데이터 반환: 사용자 ${userId}, 거래소 ${exchangeName}`, decryptError);
        // 복호화 실패 시 원본 데이터 반환 (암호화되지 않은 상태로 가정)
        return {
          ...exchange,
          apiKey: exchange.api_key,
          apiSecret: exchange.api_secret
        };
      }
    } catch (error) {
      console.error('Error getting decrypted exchange:', error);
      return undefined;
    }
  }

  // === 김치 프리미엄 히스토리 관련 메서드들 ===
  
  async getKimchiPremiumByTimeRange(symbol: string, startTime: Date): Promise<any[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM kimchi_premiums WHERE symbol = $1 AND timestamp >= $2 ORDER BY timestamp ASC',
        [symbol, startTime]
      );
      return result.rows;
    } catch (error) {
      console.error('김치 프리미엄 시간 범위 조회 실패:', error);
      throw error;
    }
  }

  async getKimchiPremiumHistory(symbol: string, limit: number = 100): Promise<any[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM kimchi_premiums WHERE symbol = $1 ORDER BY timestamp DESC LIMIT $2',
        [symbol, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting kimchi premium history:', error);
      return [];
    }
  }

  async deleteOldKimchiPremiums(beforeDate: Date): Promise<void> {
    try {
      await this.pool.query(
        'DELETE FROM kimchi_premiums WHERE timestamp < $1',
        [beforeDate]
      );
      console.log(`✅ ${beforeDate.toISOString()} 이전 차트 데이터 삭제 완료`);
    } catch (error) {
      console.error('오래된 차트 데이터 삭제 실패:', error);
      throw error;
    }
  }

  // === Routes.ts에서 필요한 추가 메서드들 ===

  async getTradingSettings(userId: number): Promise<any | undefined> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM trading_settings WHERE user_id = $1',
        [userId]
      );
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error getting trading settings:', error);
      return undefined;
    }
  }

  async updateTradingSettings(userId: number, settings: any): Promise<any> {
    try {
      const result = await this.pool.query(`
        INSERT INTO trading_settings (
          user_id, entry_premium_rate, exit_premium_rate, stop_loss_rate,
          max_positions, is_auto_trading, max_investment_amount,
          kimchi_entry_rate, kimchi_exit_rate, kimchi_tolerance_rate,
          binance_leverage, upbit_entry_amount, daily_loss_limit,
          max_position_size, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          entry_premium_rate = EXCLUDED.entry_premium_rate,
          exit_premium_rate = EXCLUDED.exit_premium_rate,
          stop_loss_rate = EXCLUDED.stop_loss_rate,
          max_positions = EXCLUDED.max_positions,
          is_auto_trading = EXCLUDED.is_auto_trading,
          max_investment_amount = EXCLUDED.max_investment_amount,
          kimchi_entry_rate = EXCLUDED.kimchi_entry_rate,
          kimchi_exit_rate = EXCLUDED.kimchi_exit_rate,
          kimchi_tolerance_rate = EXCLUDED.kimchi_tolerance_rate,
          binance_leverage = EXCLUDED.binance_leverage,
          upbit_entry_amount = EXCLUDED.upbit_entry_amount,
          daily_loss_limit = EXCLUDED.daily_loss_limit,
          max_position_size = EXCLUDED.max_position_size,
          updated_at = NOW()
        RETURNING *
      `, [
        userId,
        settings.entryPremiumRate || 2.5,
        settings.exitPremiumRate || 1.0,
        settings.stopLossRate || -1.5,
        settings.maxPositions || 5,
        settings.isAutoTrading || false,
        settings.maxInvestmentAmount || 10000000,
        settings.kimchiEntryRate || 1.1,
        settings.kimchiExitRate || 1.5,
        settings.kimchiToleranceRate || 0.1,
        settings.binanceLeverage || 3,
        settings.upbitEntryAmount || 10000000,
        settings.dailyLossLimit || 500000,
        settings.maxPositionSize || 2000000
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating trading settings:', error);
      throw error;
    }
  }

  async getAllPositions(userId?: number): Promise<any[]> {
    try {
      let query = `SELECT p.*,
                          ts.name as strategy_name,
                          fes.take_profit_offset,
                          fes.id as force_entry_settings_id
                   FROM positions p
                   LEFT JOIN trading_strategies ts ON p.strategy_id = ts.id
                   LEFT JOIN force_entry_settings fes ON p.force_entry_settings_id = fes.id
                   ORDER BY p.entry_time DESC`;
      let params: any[] = [];

      if (userId) {
        query = `SELECT p.*,
                        ts.name as strategy_name,
                        fes.take_profit_offset,
                        fes.id as force_entry_settings_id
                 FROM positions p
                 LEFT JOIN trading_strategies ts ON p.strategy_id = ts.id
                 LEFT JOIN force_entry_settings fes ON p.force_entry_settings_id = fes.id
                 WHERE p.user_id = $1
                 ORDER BY p.entry_time DESC`;
        params = [userId];
      }

      const result = await this.pool.query(query, params);

      // 디버깅: 포지션 데이터 로그
      if (result.rows.length > 0) {
        console.log('🔍 [getAllPositions] 조회된 포지션 데이터:', {
          count: result.rows.length,
          firstPosition: result.rows[0],
          openPositions: result.rows.filter(p => p.status === 'open').length,
          strategyNames: result.rows.map(p => ({ id: p.id, strategy_id: p.strategy_id, strategy_name: p.strategy_name }))
        });
      } else {
        console.log('🔍 [getAllPositions] 포지션 없음');
      }

      return result.rows;
    } catch (error) {
      console.error('Error getting all positions:', error);
      return [];
    }
  }

  async getAllTrades(userId?: number): Promise<any[]> {
    try {
      let query = 'SELECT * FROM trades ORDER BY executed_at DESC';
      let params: any[] = [];
      
      if (userId) {
        query = 'SELECT * FROM trades WHERE user_id = $1 ORDER BY executed_at DESC';
        params = [userId];
      }
      
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting all trades:', error);
      return [];
    }
  }

  async getTradeLogHistory(limit: number = 100): Promise<any[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM trade_logs ORDER BY timestamp DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting trade log history:', error);
      return [];
    }
  }

  async createTradingStrategy(data: any): Promise<any> {
    try {
      console.log('🔍 [createTradingStrategy] 입력 데이터:', data);
      
      // 필드명 매핑 (프론트엔드 → DB)
      const entryRate = data.entryRate ?? data.entryCondition ?? 0;
      const exitRate = data.exitRate ?? data.takeProfitCondition ?? 0;
      const toleranceValue = data.tolerance ?? data.toleranceRate ?? 0.1;
      const symbol = data.symbol ?? data.crypto ?? 'BTC';
      const isActive = data.isActive ?? data.isAutoTrading ?? false;
      
      console.log('🔍 [createTradingStrategy] 매핑된 값들:', {
        entryRate,
        exitRate,
        toleranceValue,
        symbol,
        isActive,
        leverage: data.leverage,
        investmentAmount: data.investmentAmount
      });

      const result = await this.pool.query(`
        INSERT INTO trading_strategies (
          user_id, name, entry_rate, exit_rate, leverage, investment_amount,
          symbol, tolerance, is_auto_trading, strategy_type, tolerance_rate,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING *
      `, [
        data.userId, 
        data.name, 
        entryRate, 
        exitRate, 
        normalizeLeverage(data.leverage),
        data.investmentAmount, 
        symbol, 
        toleranceValue,
        isActive, 
        data.strategyType || 'positive_kimchi',
        toleranceValue
      ]);
      
      console.log('✅ [createTradingStrategy] 생성 완료:', result.rows[0]);
      return result.rows[0];
    } catch (error) {
      console.error('❌ [createTradingStrategy] 오류:', error);
      throw error;
    }
  }

  async updateTradingStrategy(id: number, updates: any): Promise<any | undefined> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id') {
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return undefined;
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    try {
      const query = `
        UPDATE trading_strategies 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;
      
      console.log('🔍 [updateTradingStrategy] 실행 쿼리:', {
        query,
        values,
        strategyId: id
      });
      
      const result = await this.pool.query(query, values);
      
      console.log('✅ [updateTradingStrategy] 업데이트 결과:', {
        rowCount: result.rowCount,
        updatedStrategy: result.rows[0]
      });
      
      return result.rows[0] || undefined;
    } catch (error: any) {
      console.error('❌ [updateTradingStrategy] 오류:', {
        error: error?.message || String(error),
        stack: error?.stack,
        query: `UPDATE trading_strategies SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
        values
      });
      return undefined;
    }
  }

  async deleteTradingStrategy(id: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'DELETE FROM trading_strategies WHERE id = $1',
        [id]
      );
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting trading strategy:', error);
      return false;
    }
  }

  // === 추가 누락된 메서드들 ===

  async getUser(id: string | number): Promise<any | undefined> {
    return this.getUserById(id);
  }

  async getTradingSettingsByUserId(userId: string | number): Promise<any | undefined> {
    return this.getTradingSettings(typeof userId === 'string' ? parseInt(userId) : userId);
  }

  async createTradingSettings(data: any): Promise<any> {
    return this.updateTradingSettings(data.userId, data);
  }

  // 활성화된 자동매매 사용자 조회
  async getActiveAutoTradingUsers(): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          ts.*,
          u.username,
          u.email
        FROM trading_settings ts
        INNER JOIN users u ON ts.user_id = u.id
        WHERE ts.is_auto_trading = true
        AND u.approval_status = 'approved'
      `);
      return result.rows;
    } catch (error) {
      console.error('활성화된 자동매매 사용자 조회 실패:', error);
      return [];
    }
  }

  async getTradingStrategiesByUserId(userId: string | number): Promise<any[]> {
    return this.getTradingStrategies(typeof userId === 'string' ? parseInt(userId) : userId);
  }

  async createOrUpdateTradingStrategy(data: any): Promise<any> {
    if (data.id) {
      return this.updateTradingStrategy(data.id, data);
    } else {
      return this.createTradingStrategy(data);
    }
  }

  async createOrUpdateExchange(data: any): Promise<any> {
    if (data.id) {
      // Update existing exchange
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && key !== 'id') {
          const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          updateFields.push(`${dbField} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        return undefined;
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(data.id);

      try {
        const result = await this.pool.query(`
          UPDATE exchanges 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `, values);
        return result.rows[0] || undefined;
      } catch (error) {
        console.error('Error updating exchange:', error);
        return undefined;
      }
    } else {
      return this.createExchange(data);
    }
  }

  async closePosition(id: number): Promise<any | undefined> {
    return this.updatePosition(id, { status: 'closed', exitTime: new Date() });
  }

  async closeAllPositionsByUser(userId: string | number, filters: any = {}): Promise<{ count: number }> {
    try {
      let whereClause = 'user_id = $1 AND status = $2';
      const params: any[] = [typeof userId === 'string' ? parseInt(userId) : userId, 'open'];
      let paramIndex = 3;

      if (filters.symbol) {
        whereClause += ` AND symbol = $${paramIndex}`;
        params.push(filters.symbol);
        paramIndex++;
      }

      if (filters.strategyId) {
        whereClause += ` AND strategy_id = $${paramIndex}`;
        params.push(filters.strategyId);
        paramIndex++;
      }

      if (filters.type) {
        whereClause += ` AND type = $${paramIndex}`;
        params.push(filters.type);
        paramIndex++;
      }

      const result = await this.pool.query(`
        UPDATE positions 
        SET status = 'closed', exit_time = NOW(), updated_at = NOW()
        WHERE ${whereClause}
      `, params);

      return { count: result.rowCount ?? 0 };
    } catch (error) {
      console.error('Error closing positions:', error);
      return { count: 0 };
    }
  }

  async getTradesByUserId(userId: string | number, limit: number = 100): Promise<any[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM trades WHERE user_id = $1 ORDER BY executed_at DESC LIMIT $2',
        [typeof userId === 'string' ? parseInt(userId) : userId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting trades by user:', error);
      return [];
    }
  }

  async getTradesWithStrategyInfo(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const result = await this.pool.query(`
        SELECT
          t.*,
          ts.name as strategy_name,
          p.type as position_type,
          p.id as position_db_id
        FROM trades t
        LEFT JOIN trading_strategies ts ON t.strategy_id = ts.id
        LEFT JOIN positions p ON t.position_id = p.id
        WHERE t.user_id = $1
        ORDER BY t.executed_at DESC
        LIMIT $2
      `, [parseInt(userId), limit]);

      return result.rows.map(row => {
        let strategyName = row.strategy_name;

        // 강제진입 포지션인 경우 포지션 ID로 이름 생성
        if (!strategyName && row.position_type === 'force_entry' && row.position_db_id) {
          strategyName = `강제진입${row.position_db_id}`;
        } else if (!strategyName) {
          strategyName = '전략 정보 없음';
        }

        return {
          ...row,
          strategyId: row.strategy_id,
          strategyName,
          positionId: row.position_id
        };
      });
    } catch (error) {
      console.error('Error getting trades with strategy info:', error);
      return [];
    }
  }

  // 오늘 거래만 조회 (한국시간 오전 9시 기준)
  async getTodayTradesByUserId(userId: string | number): Promise<any[]> {
    try {
      const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;

      // 🔧 한국시간 기준 오늘 09:00 계산
      // DB timezone이 Asia/Seoul이므로 NOW()는 한국시간
      // 현재 시간이 9시 이전이면 어제 9시부터, 9시 이후면 오늘 9시부터
      const result = await this.pool.query(`
        SELECT * FROM trades
        WHERE user_id = $1
        AND executed_at >= CASE
          WHEN EXTRACT(HOUR FROM NOW()) < 9
          THEN DATE_TRUNC('day', NOW()) - INTERVAL '15 hours'
          ELSE DATE_TRUNC('day', NOW()) + INTERVAL '9 hours'
        END
        ORDER BY executed_at DESC
      `, [userIdNum]);

      // console.log(`✅ [getTodayTradesByUserId] 사용자 ${userIdNum} 오늘(9시 기준) 거래: ${result.rows.length}개`);
      return result.rows;
    } catch (error) {
      console.error('❌ [getTodayTradesByUserId] SQL 오류:', error);
      return [];
    }
  }

  // 오늘 포지션만 조회 (한국시간 오전 9시 기준)
  async getTodayPositionsByUserId(userId: number): Promise<any[]> {
    try {
      // 🔧 한국시간 기준 오늘 09:00 계산
      // DB timezone이 Asia/Seoul이므로 NOW()는 한국시간
      // 현재 시간이 9시 이전이면 어제 9시부터, 9시 이후면 오늘 9시부터
      const result = await this.pool.query(`
        SELECT * FROM positions
        WHERE user_id = $1
        AND entry_time >= CASE
          WHEN EXTRACT(HOUR FROM NOW()) < 9
          THEN DATE_TRUNC('day', NOW()) - INTERVAL '15 hours'
          ELSE DATE_TRUNC('day', NOW()) + INTERVAL '9 hours'
        END
        ORDER BY entry_time DESC
      `, [userId]);

      // console.log(`✅ [getTodayPositionsByUserId] 사용자 ${userId} 오늘(9시 기준) 포지션: ${result.rows.length}개`);
      return result.rows;
    } catch (error) {
      console.error('❌ [getTodayPositionsByUserId] SQL 오류:', error);
      return [];
    }
  }

  // 오늘 청산된 포지션 수 (exit_time 기준, 한국시간 오전 9시 기준)
  async getTodayExitedPositionsCount(userId: number): Promise<number> {
    try {
      const result = await this.pool.query(`
        SELECT COUNT(*) as count FROM positions
        WHERE user_id = $1
        AND exit_time >= CASE
          WHEN EXTRACT(HOUR FROM NOW()) < 9
          THEN DATE_TRUNC('day', NOW()) - INTERVAL '15 hours'
          ELSE DATE_TRUNC('day', NOW()) + INTERVAL '9 hours'
        END
        AND status = 'closed'
      `, [userId]);

      const count = parseInt(result.rows[0]?.count || '0');
      // console.log(`✅ [getTodayExitedPositionsCount] 사용자 ${userId} 오늘(9시 기준) 청산: ${count}개`);
      return count;
    } catch (error) {
      console.error('❌ [getTodayExitedPositionsCount] SQL 오류:', error);
      return 0;
    }
  }

  async getSystemAlerts(limit: number = 100): Promise<any[]> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM system_alerts ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('Error getting system alerts:', error);
      return [];
    }
  }

  async markAlertAsRead(alertId: number): Promise<any | undefined> {
    try {
      const result = await this.pool.query(
        'UPDATE system_alerts SET is_read = true WHERE id = $1 RETURNING *',
        [alertId]
      );
      return result.rows[0] || undefined;
    } catch (error) {
      console.error('Error marking alert as read:', error);
      return undefined;
    }
  }

  async updateUserRole(userId: number, role: string): Promise<any | undefined> {
    return this.updateUser(userId, { role });
  }

  async getPositions(whereClause: any = {}): Promise<any[]> {
    const userId = whereClause.user_id || whereClause.userId;
    console.log(`🔍 [getPositions] 사용자 ${userId} 포지션 조회`);
    return this.getAllPositions(userId);
  }

  // 어드민 권한 확인
  async checkAdminPermission(userId: number): Promise<{ isAdmin: boolean; adminLevel?: string }> {
    try {
      const adminQuery = await this.pool.query(
        'SELECT admin_level FROM admins WHERE user_id = $1 AND is_active = true',
        [userId]
      );
      
      if (adminQuery.rows.length > 0) {
        return {
          isAdmin: true,
          adminLevel: adminQuery.rows[0].admin_level
        };
      }
      
      return { isAdmin: false };
    } catch (error) {
      console.error('어드민 권한 확인 오류:', error);
      return { isAdmin: false };
    }
  }

  // ===== 사용자 승인 관련 메서드 =====

  // 모든 사용자 목록 조회 (관리자용)
  async getAllUsers(): Promise<User[]> {
    try {
      // 먼저 approval_status 컬럼이 존재하는지 확인하고 없으면 추가
      await this.ensureApprovalStatusColumn();

      const result = await this.pool.query(`
        SELECT * FROM users
        ORDER BY created_at DESC
      `);

      // snake_case를 camelCase로 변환
      return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        role: row.role,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        profileImageUrl: row.profile_image_url,
        password: row.password,
        passwordHash: row.password, // 호환성을 위해
        isActive: row.is_active,
        approvalStatus: row.approval_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at
      }));
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // approval_status 컬럼이 존재하는지 확인하고 없으면 추가
  private async ensureApprovalStatusColumn(): Promise<void> {
    try {
      // 컬럼 존재 여부 확인
      const checkColumn = await this.pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'approval_status'
      `);

      if (checkColumn.rows.length === 0) {
        console.log('approval_status 컬럼이 없습니다. 추가하는 중...');

        // 컬럼 추가
        await this.pool.query(`
          ALTER TABLE users
          ADD COLUMN approval_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        `);

        // 기존 관리자 사용자들은 승인된 상태로 설정
        await this.pool.query(`
          UPDATE users
          SET approval_status = 'approved'
          WHERE role = 'admin'
        `);

        console.log('approval_status 컬럼이 성공적으로 추가되었습니다.');
      }
    } catch (error) {
      console.error('approval_status 컬럼 확인/추가 중 오류:', error);
    }
  }

  // 승인 대기 중인 사용자 목록 조회
  async getPendingUsers(): Promise<User[]> {
    try {
      const result = await this.pool.query(`
        SELECT * FROM users
        WHERE approval_status = 'pending'
        ORDER BY created_at DESC
      `);
      return result.rows;
    } catch (error) {
      console.error('Error getting pending users:', error);
      return [];
    }
  }

  // 사용자 승인 상태 업데이트
  async updateUserApprovalStatus(
    userId: number,
    status: 'approved' | 'rejected'
  ): Promise<User | undefined> {
    try {
      const result = await this.pool.query(`
        UPDATE users
        SET approval_status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [status, userId]);

      return result.rows[0];
    } catch (error) {
      console.error('Error updating user approval status:', error);
      return undefined;
    }
  }

  // 사용자 승인
  async approveUser(userId: number): Promise<User | undefined> {
    return this.updateUserApprovalStatus(userId, 'approved');
  }

  // 사용자 거부
  async rejectUser(userId: number): Promise<User | undefined> {
    return this.updateUserApprovalStatus(userId, 'rejected');
  }

  // 사용자 승인 상태 확인
  async isUserApproved(userId: number): Promise<boolean> {
    try {
      const result = await this.pool.query(`
        SELECT approval_status FROM users WHERE id = $1
      `, [userId]);

      return result.rows[0]?.approval_status === 'approved';
    } catch (error) {
      console.error('Error checking user approval status:', error);
      return false;
    }
  }

  // 마지막 로그인 시간 업데이트
  async updateLastLogin(userId: number): Promise<void> {
    try {
      await this.pool.query(`
        UPDATE users
        SET last_login_at = NOW()
        WHERE id = $1
      `, [userId]);
      console.log(`✅ 사용자 ${userId} 마지막 로그인 시간 업데이트 완료`);
    } catch (error) {
      console.error('마지막 로그인 시간 업데이트 실패:', error);
    }
  }

  // 연결 종료
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// 싱글톤 인스턴스
export const storage = new DatabaseStorage();
