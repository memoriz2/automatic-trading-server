import { BaseRepository } from './BaseRepository.js';
/**
 * 포지션 관리 Repository
 * positions 테이블을 사용하여 실거래 포지션을 관리
 */
export class PositionsRepository extends BaseRepository {
    /**
     * 새 포지션 생성
     */
    async create(positionData) {
        const query = `
      INSERT INTO positions (
        user_id, strategy_id, symbol, type, side, status,
        entry_price, quantity,
        binance_quantity, binance_entry_price, binance_leverage,
        entry_premium_rate, current_premium_rate,
        unrealized_pnl, realized_pnl, total_fees,
        entry_time, exit_time,
        upbit_order_id, binance_order_id,
        ip, device_type,
        binance_mark_price, binance_liquidation_price, binance_size_usdt,
        binance_margin_usdt, binance_margin_ratio, binance_margin_type, binance_unrealized_pnl,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8,
        $9, $10, $11,
        $12, $13,
        $14, $15, $16,
        $17, $18,
        $19, $20,
        $21, $22,
        $23, $24, $25,
        $26, $27, $28, $29,
        NOW(), NOW()
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
        const result = await this.queryOne(query, [
            positionData.userId,
            positionData.strategyId || null,
            positionData.symbol,
            positionData.type,
            positionData.side,
            positionData.status,
            positionData.entryPrice,
            positionData.quantity,
            // Binance 전용 필드(없으면 0/기본값)
            positionData.binanceQuantity ?? 0,
            positionData.binanceEntryPrice ?? 0,
            positionData.binanceLeverage ?? 5,
            positionData.entryPremiumRate,
            positionData.currentPremiumRate || null,
            positionData.unrealizedPnl ?? 0,
            positionData.realizedPnl || null,
            positionData.totalFees ?? 0,
            positionData.entryTime,
            positionData.exitTime || null,
            positionData.upbitOrderId || null,
            positionData.binanceOrderId || null,
            positionData.ip || null,
            positionData.deviceType || 'Unknown',
            // Binance 상세 정보 (선물 포지션 데이터)
            positionData.binanceMarkPrice ?? 0,
            positionData.binanceLiquidationPrice ?? 0,
            positionData.binanceSizeUsdt ?? 0,
            positionData.binanceMarginUsdt ?? 0,
            positionData.binanceMarginRatio ?? 0,
            positionData.binanceMarginType || 'cross',
            positionData.binanceUnrealizedPnl ?? 0,
        ]);
        if (!result) {
            throw new Error('포지션 생성에 실패했습니다.');
        }
        return result;
    }
    /**
     * 포지션 ID로 조회
     */
    async findById(id) {
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
      WHERE id = $1     `;
        return this.queryOne(query, [id]);
    }
    /**
     * 사용자의 활성 포지션 조회
     */
    async findActiveByUserId(userId) {
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
      WHERE user_id = $1 AND status = 'open'       ORDER BY entry_time DESC
    `;
        return this.query(query, [userId]);
    }
    /**
     * 포지션 현재 김프율 및 PnL 업데이트
     */
    async updatePricesAndPnl(id, currentPremiumRate, unrealizedPnl) {
        const updates = {};
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
    async close(id, exitPrice, exitPremiumRate, realizedPnl, totalFees) {
        // SQL에서 직접 한국 시간으로 exit_time 설정
        const query = `
      UPDATE positions
      SET status = $1,
          exit_price = $2,
          exit_premium_rate = $3,
          realized_pnl = $4,
          total_fees = $5,
          exit_time = NOW() AT TIME ZONE 'Asia/Seoul',
          updated_at = NOW()
      WHERE id = $6
    `;
        const result = await this.pool.query(query, [
            'closed',
            exitPrice,
            exitPremiumRate,
            realizedPnl,
            totalFees,
            id
        ]);
        return (result.rowCount || 0) > 0;
    }
    /**
     * 사용자의 포지션 요약 정보 조회
     */
    async getSummary(userId) {
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
      WHERE user_id = $1     `;
        const result = await this.queryOne(query, [userId]);
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
    async findByStrategyId(strategyId) {
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
      WHERE strategy_id = $1       ORDER BY entry_time DESC
    `;
        return this.query(query, [strategyId]);
    }
    // ===== 재진입 방지 관련 메서드들 =====
    /**
     * 전략+심볼로 OPEN 상태 포지션 조회 (재진입 방지용)
     */
    async getOpenPositionByStrategyAndSymbol(strategyId, symbol) {
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
        COALESCE(remaining_quantity, quantity, binance_quantity) as "remainingQuantity",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM positions
      WHERE strategy_id = $1 AND symbol = $2 AND status IN ('open', 'pending')
      LIMIT 1
    `;
        return this.queryOne(query, [strategyId, symbol]);
    }
    /**
     * 사용자+전략+심볼로 OPEN 상태 포지션 조회 (정확 매칭)
     */
    async getOpenPositionByUserStrategyAndSymbol(userId, strategyId, symbol) {
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
        COALESCE(remaining_quantity, quantity, binance_quantity) as "remainingQuantity",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM positions
      WHERE user_id = $1 AND strategy_id = $2 AND symbol = $3 AND status = 'open'       LIMIT 1
    `;
        return this.queryOne(query, [userId, strategyId, symbol]);
    }
    /**
     * 사용자+심볼로 OPEN 상태 포지션 조회 (중복 진입 방지용)
     */
    async getOpenPositionByUserAndSymbol(userId, symbol) {
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
        COALESCE(remaining_quantity, quantity, binance_quantity) as "remainingQuantity",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM positions
      WHERE user_id = $1 AND symbol = $2 AND status = 'open'
      LIMIT 1
    `;
        return this.queryOne(query, [userId, symbol]);
    }
    /**
     * 동시성 안전 생성: 동일 (strategyId, symbol) 조합에 대해 OPEN 포지션이 없을 때만 생성
     * 여러 프로세스에서도 안전하도록 트랜잭션 + advisory lock 사용
     */
    async createOpenIfNone(positionData) {
        const lockKey = `${positionData.userId}:${positionData.symbol}`;
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            // Postgres 버전 호환성을 위해 md5 -> bigint 변환으로 advisory lock 키 생성
            await client.query("SELECT pg_advisory_xact_lock((E'\\x' || substr(md5($1),1,16))::bit(64)::bigint)", [lockKey]);
            // 동일 트랜잭션/커넥션에서 기존 OPEN 포지션 재확인 (유저 기준)
            const selectExistingQuery = `
        SELECT
          id,
          user_id as "userId",
          strategy_id as "strategyId",
          symbol,
          side,
          status,
          quantity as "upbitQuantity",
          entry_price as "upbitEntryPrice",
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
          COALESCE(remaining_quantity, quantity, binance_quantity) as "remainingQuantity",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM positions
        WHERE user_id = $1 AND symbol = $2 AND status = 'open'
        LIMIT 1
      `;
            const existingRes = await client.query(selectExistingQuery, [positionData.userId, positionData.symbol]);
            if (existingRes.rows.length > 0) {
                await client.query('COMMIT');
                return existingRes.rows[0];
            }
            // 동일 커넥션에서 INSERT 수행
            const insertQuery = `
        INSERT INTO positions (
          user_id, strategy_id, symbol, type, side, status,
          entry_price, quantity,
          binance_quantity, binance_entry_price, binance_leverage,
          entry_premium_rate, current_premium_rate,
          unrealized_pnl, realized_pnl, total_fees,
          entry_time, exit_time,
          upbit_order_id, binance_order_id,
          ip, device_type,
          binance_mark_price, binance_liquidation_price, binance_size_usdt,
          binance_margin_usdt, binance_margin_ratio, binance_margin_type, binance_unrealized_pnl,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8,
          $9, $10, $11,
          $12, $13,
          $14, $15, $16,
          $17, $18,
          $19, $20,
          $21, $22,
          $23, $24, $25,
          $26, $27, $28, $29,
          NOW(), NOW()
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
            const insertParams = [
                positionData.userId,
                positionData.strategyId || null,
                positionData.symbol,
                positionData.type,
                positionData.side,
                positionData.status,
                positionData.entryPrice,
                positionData.quantity,
                // Binance 전용 필드(없으면 0/기본값)
                positionData.binanceQuantity ?? 0,
                positionData.binanceEntryPrice ?? 0,
                positionData.binanceLeverage ?? 5,
                positionData.entryPremiumRate,
                positionData.currentPremiumRate || null,
                positionData.unrealizedPnl ?? 0,
                positionData.realizedPnl || null,
                positionData.totalFees ?? 0,
                positionData.entryTime,
                positionData.exitTime || null,
                positionData.upbitOrderId || null,
                positionData.binanceOrderId || null,
                positionData.ip || null,
                positionData.deviceType || 'Unknown',
                // Binance 상세 정보
                positionData.binanceMarkPrice ?? 0,
                positionData.binanceLiquidationPrice ?? 0,
                positionData.binanceSizeUsdt ?? 0,
                positionData.binanceMarginUsdt ?? 0,
                positionData.binanceMarginRatio ?? 0,
                positionData.binanceMarginType || 'cross',
                positionData.binanceUnrealizedPnl ?? 0,
            ];
            const insertRes = await client.query(insertQuery, insertParams);
            const created = insertRes.rows[0];
            await client.query('COMMIT');
            return created;
        }
        catch (error) {
            try {
                await client.query('ROLLBACK');
            }
            catch { }
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 포지션 부분 청산 (remaining_quantity 업데이트)
     */
    async updateRemainingQuantity(id, remainingQuantity) {
        const query = `
      UPDATE positions 
      SET remaining_quantity = $2, updated_at = NOW()
      WHERE id = $1     `;
        const result = await this.pool.query(query, [id, remainingQuantity]);
        return (result.rowCount || 0) > 0;
    }
    /**
     * 포지션 완전 청산 (remaining_quantity도 0으로 설정)
     */
    async closeWithRemaining(id, exitPrice, exitPremiumRate, realizedPnl, totalFees) {
        // SQL에서 직접 한국 시간으로 exit_time 설정
        const query = `
      UPDATE positions
      SET status = $1,
          exit_price = $2,
          exit_premium_rate = $3,
          realized_pnl = $4,
          total_fees = $5,
          remaining_quantity = $6,
          exit_time = NOW() AT TIME ZONE 'Asia/Seoul',
          updated_at = NOW()
      WHERE id = $7
    `;
        const result = await this.pool.query(query, [
            'closed',
            exitPrice,
            exitPremiumRate,
            realizedPnl,
            totalFees,
            0, // 완전 청산 시 0으로 설정
            id
        ]);
        return (result.rowCount || 0) > 0;
    }
}
