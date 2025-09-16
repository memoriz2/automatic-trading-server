import { BaseRepository } from './BaseRepository.js';
/**
 * 거래 체결 기록 Repository
 * trades 테이블을 사용하여 실거래 체결 내역을 관리
 */
export class TradesRepository extends BaseRepository {
    /**
     * 새 거래 기록 생성
     */
    async create(tradeData) {
        const query = `
      INSERT INTO trades (
        user_id, position_id, order_id, exchange, exchange_trade_id,
        symbol, side, quantity, price, fee, fee_currency, executed_at, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
      )
      RETURNING 
        id,
        user_id as "userId",
        position_id as "positionId",
        order_id as "orderId",
        exchange,
        exchange_trade_id as "exchangeTradeId",
        symbol,
        side,
        quantity,
        price,
        fee,
        fee_currency as "feeCurrency",
        executed_at as "executedAt",
        created_at as "createdAt"
    `;
        const result = await this.queryOne(query, [
            tradeData.userId,
            tradeData.positionId || null,
            tradeData.orderId,
            tradeData.exchange,
            tradeData.exchangeTradeId,
            tradeData.symbol,
            tradeData.side,
            tradeData.quantity,
            tradeData.price,
            tradeData.fee,
            tradeData.feeCurrency,
            tradeData.executedAt
        ]);
        if (!result) {
            throw new Error('거래 기록 생성에 실패했습니다.');
        }
        return result;
    }
    /**
     * 거래 ID로 조회
     */
    async findById(id) {
        const query = `
      SELECT 
        id,
        user_id as "userId",
        position_id as "positionId",
        order_id as "orderId",
        exchange,
        exchange_trade_id as "exchangeTradeId",
        symbol,
        side,
        quantity,
        price,
        fee,
        fee_currency as "feeCurrency",
        executed_at as "executedAt",
        created_at as "createdAt"
      FROM trades 
      WHERE id = $1
    `;
        return this.queryOne(query, [id]);
    }
    /**
     * 거래소 거래 ID로 조회
     */
    async findByExchangeTradeId(exchange, exchangeTradeId) {
        const query = `
      SELECT 
        id,
        user_id as "userId",
        position_id as "positionId",
        order_id as "orderId",
        exchange,
        exchange_trade_id as "exchangeTradeId",
        symbol,
        side,
        quantity,
        price,
        fee,
        fee_currency as "feeCurrency",
        executed_at as "executedAt",
        created_at as "createdAt"
      FROM trades 
      WHERE exchange = $1 AND exchange_trade_id = $2
    `;
        return this.queryOne(query, [exchange, exchangeTradeId]);
    }
    /**
     * 사용자의 거래 내역 조회 (페이지네이션)
     */
    async findByUserId(userId, page = 1, limit = 50, exchange, symbol) {
        let baseQuery = `
      SELECT 
        id,
        user_id as "userId",
        position_id as "positionId",
        order_id as "orderId",
        exchange,
        exchange_trade_id as "exchangeTradeId",
        symbol,
        side,
        quantity,
        price,
        fee,
        fee_currency as "feeCurrency",
        executed_at as "executedAt",
        created_at as "createdAt"
      FROM trades 
      WHERE user_id = $1
    `;
        let countQuery = 'SELECT COUNT(*) as count FROM trades WHERE user_id = $1';
        let params = [userId];
        let paramIndex = 2;
        if (exchange) {
            baseQuery += ` AND exchange = $${paramIndex}`;
            countQuery += ` AND exchange = $${paramIndex}`;
            params.push(exchange);
            paramIndex++;
        }
        if (symbol) {
            baseQuery += ` AND symbol = $${paramIndex}`;
            countQuery += ` AND symbol = $${paramIndex}`;
            params.push(symbol);
        }
        baseQuery += ' ORDER BY executed_at DESC';
        return this.queryWithPagination(baseQuery, countQuery, params, page, limit);
    }
    /**
     * 포지션의 거래 내역 조회
     */
    async findByPositionId(positionId) {
        const query = `
      SELECT 
        id,
        user_id as "userId",
        position_id as "positionId",
        order_id as "orderId",
        exchange,
        exchange_trade_id as "exchangeTradeId",
        symbol,
        side,
        quantity,
        price,
        fee,
        fee_currency as "feeCurrency",
        executed_at as "executedAt",
        created_at as "createdAt"
      FROM trades 
      WHERE position_id = $1
      ORDER BY executed_at ASC
    `;
        return this.query(query, [positionId]);
    }
    /**
     * 주문의 거래 내역 조회
     */
    async findByOrderId(orderId) {
        const query = `
      SELECT 
        id,
        user_id as "userId",
        position_id as "positionId",
        order_id as "orderId",
        exchange,
        exchange_trade_id as "exchangeTradeId",
        symbol,
        side,
        quantity,
        price,
        fee,
        fee_currency as "feeCurrency",
        executed_at as "executedAt",
        created_at as "createdAt"
      FROM trades 
      WHERE order_id = $1
      ORDER BY executed_at ASC
    `;
        return this.query(query, [orderId]);
    }
    /**
     * 일일 거래 통계 조회
     */
    async getDailyStats(userId, date) {
        const query = `
      SELECT 
        COUNT(*) as total_trades,
        COUNT(CASE WHEN exchange = 'upbit' THEN 1 END) as upbit_trades,
        COUNT(CASE WHEN exchange = 'binance' THEN 1 END) as binance_trades,
        COALESCE(SUM(quantity * price), 0) as total_volume,
        COALESCE(SUM(fee), 0) as total_fees,
        COALESCE(AVG(quantity * price), 0) as avg_trade_size
      FROM trades 
      WHERE user_id = $1 
        AND DATE(executed_at) = $2
    `;
        const result = await this.queryOne(query, [userId, date]);
        return {
            totalTrades: parseInt(result?.total_trades || '0'),
            upbitTrades: parseInt(result?.upbit_trades || '0'),
            binanceTrades: parseInt(result?.binance_trades || '0'),
            totalVolume: parseFloat(result?.total_volume || '0'),
            totalFees: parseFloat(result?.total_fees || '0'),
            avgTradeSize: parseFloat(result?.avg_trade_size || '0')
        };
    }
    /**
     * 기간별 거래 내역 조회
     */
    async findByDateRange(userId, startDate, endDate, exchange) {
        let query = `
      SELECT 
        id,
        user_id as "userId",
        position_id as "positionId",
        order_id as "orderId",
        exchange,
        exchange_trade_id as "exchangeTradeId",
        symbol,
        side,
        quantity,
        price,
        fee,
        fee_currency as "feeCurrency",
        executed_at as "executedAt",
        created_at as "createdAt"
      FROM trades 
      WHERE user_id = $1 
        AND DATE(executed_at) >= $2 
        AND DATE(executed_at) <= $3
    `;
        let params = [userId, startDate, endDate];
        if (exchange) {
            query += ' AND exchange = $4';
            params.push(exchange);
        }
        query += ' ORDER BY executed_at DESC';
        return this.query(query, params);
    }
    /**
     * 거래 내역 존재 여부 확인 (중복 방지)
     */
    async existsByExchangeTradeId(exchange, exchangeTradeId) {
        return this.exists('trades', {
            exchange,
            exchange_trade_id: exchangeTradeId
        });
    }
}
