import { BaseRepository } from './BaseRepository.js';
import { OrderRequestDto, OrderResponseDto } from '../types/trading.js';

/**
 * 주문 관리 Repository
 * orders 테이블을 사용하여 실거래 주문을 관리
 */
export class OrdersRepository extends BaseRepository {

  /**
   * 새 주문 생성
   */
  async create(orderData: Omit<OrderResponseDto, 'id' | 'createdAt' | 'updatedAt'> & {
    strategyId?: number;
    positionId?: number;
    timeInForce?: string;
    clientOrderId?: string;
    leverage?: number;
  }): Promise<OrderResponseDto> {
    const query = `
      INSERT INTO orders (
        user_id, strategy_id, position_id, exchange, exchange_order_id,
        symbol, side, type, status, quantity, filled_quantity, remaining_quantity,
        price, average_price, fee, fee_currency, time_in_force, client_order_id,
        leverage, created_at, updated_at, filled_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW(), $20
      )
      RETURNING 
        id,
        user_id as "userId",
        strategy_id as "strategyId",
        position_id as "positionId",
        exchange,
        exchange_order_id as "exchangeOrderId",
        symbol,
        side,
        type,
        status,
        quantity,
        filled_quantity as "filledQuantity",
        remaining_quantity as "remainingQuantity",
        price,
        average_price as "averagePrice",
        fee,
        fee_currency as "feeCurrency",
        time_in_force as "timeInForce",
        client_order_id as "clientOrderId",
        leverage,
        created_at as "createdAt",
        updated_at as "updatedAt",
        filled_at as "filledAt"
    `;

    const result = await this.queryOne<OrderResponseDto>(query, [
      orderData.userId,
      orderData.strategyId || null,
      orderData.positionId || null,
      orderData.exchange,
      orderData.exchangeOrderId,
      orderData.symbol,
      orderData.side,
      orderData.type,
      orderData.status,
      orderData.quantity,
      orderData.filledQuantity,
      orderData.remainingQuantity,
      orderData.price || null,
      orderData.averagePrice || null,
      orderData.fee,
      orderData.feeCurrency,
      orderData.timeInForce || null,
      orderData.clientOrderId || null,
      orderData.leverage || 1,
      orderData.filledAt || null
    ]);

    if (!result) {
      throw new Error('주문 생성에 실패했습니다.');
    }

    return result;
  }

  /**
   * 주문 ID로 조회
   */
  async findById(id: number): Promise<OrderResponseDto | null> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        strategy_id as "strategyId",
        position_id as "positionId",
        exchange,
        exchange_order_id as "exchangeOrderId",
        symbol,
        side,
        type,
        status,
        quantity,
        filled_quantity as "filledQuantity",
        remaining_quantity as "remainingQuantity",
        price,
        average_price as "averagePrice",
        fee,
        fee_currency as "feeCurrency",
        time_in_force as "timeInForce",
        client_order_id as "clientOrderId",
        leverage,
        created_at as "createdAt",
        updated_at as "updatedAt",
        filled_at as "filledAt"
      FROM orders 
      WHERE id = $1
    `;
    
    return this.queryOne<OrderResponseDto>(query, [id]);
  }

  /**
   * 거래소 주문 ID로 조회
   */
  async findByExchangeOrderId(exchange: string, exchangeOrderId: string): Promise<OrderResponseDto | null> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        strategy_id as "strategyId",
        position_id as "positionId",
        exchange,
        exchange_order_id as "exchangeOrderId",
        symbol,
        side,
        type,
        status,
        quantity,
        filled_quantity as "filledQuantity",
        remaining_quantity as "remainingQuantity",
        price,
        average_price as "averagePrice",
        fee,
        fee_currency as "feeCurrency",
        time_in_force as "timeInForce",
        client_order_id as "clientOrderId",
        leverage,
        created_at as "createdAt",
        updated_at as "updatedAt",
        filled_at as "filledAt"
      FROM orders 
      WHERE exchange = $1 AND exchange_order_id = $2
    `;
    
    return this.queryOne<OrderResponseDto>(query, [exchange, exchangeOrderId]);
  }

  /**
   * 사용자의 주문 목록 조회 (페이지네이션)
   */
  async findByUserId(
    userId: number, 
    page: number = 1, 
    limit: number = 20,
    status?: string
  ): Promise<{ data: OrderResponseDto[]; total: number; page: number; limit: number; pages: number }> {
    let baseQuery = `
      SELECT 
        id,
        user_id as "userId",
        strategy_id as "strategyId",
        position_id as "positionId",
        exchange,
        exchange_order_id as "exchangeOrderId",
        symbol,
        side,
        type,
        status,
        quantity,
        filled_quantity as "filledQuantity",
        remaining_quantity as "remainingQuantity",
        price,
        average_price as "averagePrice",
        fee,
        fee_currency as "feeCurrency",
        time_in_force as "timeInForce",
        client_order_id as "clientOrderId",
        leverage,
        created_at as "createdAt",
        updated_at as "updatedAt",
        filled_at as "filledAt"
      FROM orders 
      WHERE user_id = $1
    `;

    let countQuery = 'SELECT COUNT(*) as count FROM orders WHERE user_id = $1';
    let params: any[] = [userId];

    if (status) {
      baseQuery += ` AND status = $${params.length + 1}`;
      countQuery += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    baseQuery += ' ORDER BY created_at DESC';

    return this.queryWithPagination<OrderResponseDto>(
      baseQuery,
      countQuery,
      params,
      page,
      limit
    );
  }

  /**
   * 포지션의 주문들 조회
   */
  async findByPositionId(positionId: number): Promise<OrderResponseDto[]> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        strategy_id as "strategyId",
        position_id as "positionId",
        exchange,
        exchange_order_id as "exchangeOrderId",
        symbol,
        side,
        type,
        status,
        quantity,
        filled_quantity as "filledQuantity",
        remaining_quantity as "remainingQuantity",
        price,
        average_price as "averagePrice",
        fee,
        fee_currency as "feeCurrency",
        time_in_force as "timeInForce",
        client_order_id as "clientOrderId",
        leverage,
        created_at as "createdAt",
        updated_at as "updatedAt",
        filled_at as "filledAt"
      FROM orders 
      WHERE position_id = $1
      ORDER BY created_at ASC
    `;
    
    return this.query<OrderResponseDto>(query, [positionId]);
  }

  /**
   * 주문 상태 업데이트
   */
  async updateStatus(
    id: number,
    status: string,
    filledQuantity?: number,
    averagePrice?: number,
    fee?: number
  ): Promise<boolean> {
    const updates: Record<string, any> = { status };
    
    if (filledQuantity !== undefined) {
      updates.filled_quantity = filledQuantity;
      updates.remaining_quantity = `quantity - ${filledQuantity}`;
    }
    
    if (averagePrice !== undefined) {
      updates.average_price = averagePrice;
    }
    
    if (fee !== undefined) {
      updates.fee = fee;
    }
    
    if (status === 'filled') {
      updates.filled_at = new Date();
    }

    const updatedRows = await this.safeUpdate('orders', updates, { id });
    return updatedRows > 0;
  }

  /**
   * 미체결 주문 조회
   */
  async findPendingOrders(userId: number, exchange?: string): Promise<OrderResponseDto[]> {
    let query = `
      SELECT 
        id,
        user_id as "userId",
        strategy_id as "strategyId",
        position_id as "positionId",
        exchange,
        exchange_order_id as "exchangeOrderId",
        symbol,
        side,
        type,
        status,
        quantity,
        filled_quantity as "filledQuantity",
        remaining_quantity as "remainingQuantity",
        price,
        average_price as "averagePrice",
        fee,
        fee_currency as "feeCurrency",
        time_in_force as "timeInForce",
        client_order_id as "clientOrderId",
        leverage,
        created_at as "createdAt",
        updated_at as "updatedAt",
        filled_at as "filledAt"
      FROM orders 
      WHERE user_id = $1 AND status IN ('pending', 'partially_filled')
    `;

    let params: any[] = [userId];

    if (exchange) {
      query += ` AND exchange = $${params.length + 1}`;
      params.push(exchange);
    }

    query += ' ORDER BY created_at ASC';

    return this.query<OrderResponseDto>(query, params);
  }

  /**
   * 주문 취소
   */
  async cancel(id: number): Promise<boolean> {
    const updatedRows = await this.safeUpdate(
      'orders',
      { status: 'cancelled' },
      { id }
    );

    return updatedRows > 0;
  }

  /**
   * 거래소별 일일 주문 통계
   */
  async getDailyStats(userId: number, date: string): Promise<{
    totalOrders: number;
    upbitOrders: number;
    binanceOrders: number;
    filledOrders: number;
    cancelledOrders: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN exchange = 'upbit' THEN 1 END) as upbit_orders,
        COUNT(CASE WHEN exchange = 'binance' THEN 1 END) as binance_orders,
        COUNT(CASE WHEN status = 'filled' THEN 1 END) as filled_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders
      FROM orders 
      WHERE user_id = $1 
        AND DATE(created_at) = $2
    `;

    const result = await this.queryOne<{
      total_orders: string;
      upbit_orders: string;
      binance_orders: string;
      filled_orders: string;
      cancelled_orders: string;
    }>(query, [userId, date]);

    return {
      totalOrders: parseInt(result?.total_orders || '0'),
      upbitOrders: parseInt(result?.upbit_orders || '0'),
      binanceOrders: parseInt(result?.binance_orders || '0'),
      filledOrders: parseInt(result?.filled_orders || '0'),
      cancelledOrders: parseInt(result?.cancelled_orders || '0')
    };
  }
}
