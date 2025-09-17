import { BaseRepository } from './BaseRepository.js';
import { 
  TradingErrorDto, 
  ErrorPatternDto, 
  RetryHistoryDto, 
  ErrorNotificationDto,
  ErrorStatsDto,
  ErrorSeverity,
  ErrorCategory,
  RetryStatus,
  FixStatus
} from '../types/error-tracking.js';

/**
 * 거래 오류 추적 Repository
 */
export class ErrorTrackingRepository extends BaseRepository {

  /**
   * 새 거래 오류 기록 생성
   */
  async createTradingError(errorData: Omit<TradingErrorDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<TradingErrorDto> {
    const query = `
      INSERT INTO trading_errors (
        user_id, trade_id, position_id, error_category, error_severity,
        error_code, error_message, error_signature, exchange, symbol, side,
        intended_quantity, intended_price, api_endpoint, request_payload,
        response_data, retry_count, retry_status, max_retries,
        next_retry_at, is_resolved, stack_trace, user_agent,
        ip_address, session_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25
      )
      RETURNING 
        id,
        user_id as "userId",
        trade_id as "tradeId", 
        position_id as "positionId",
        error_category as "errorCategory",
        error_severity as "errorSeverity",
        error_code as "errorCode",
        error_message as "errorMessage",
        error_signature as "errorSignature",
        exchange,
        symbol,
        side,
        intended_quantity as "intendedQuantity",
        intended_price as "intendedPrice",
        api_endpoint as "apiEndpoint",
        request_payload as "requestPayload",
        response_data as "responseData",
        retry_count as "retryCount",
        retry_status as "retryStatus",
        max_retries as "maxRetries",
        next_retry_at as "nextRetryAt",
        is_resolved as "isResolved",
        resolved_at as "resolvedAt",
        resolution_method as "resolutionMethod",
        resolution_notes as "resolutionNotes",
        stack_trace as "stackTrace",
        user_agent as "userAgent",
        ip_address as "ipAddress",
        session_id as "sessionId",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      errorData.userId,
      errorData.tradeId || null,
      errorData.positionId || null,
      errorData.errorCategory,
      errorData.errorSeverity,
      errorData.errorCode || null,
      errorData.errorMessage,
      errorData.errorSignature || null,
      errorData.exchange,
      errorData.symbol,
      errorData.side,
      errorData.intendedQuantity || null,
      errorData.intendedPrice || null,
      errorData.apiEndpoint || null,
      errorData.requestPayload ? JSON.stringify(errorData.requestPayload) : null,
      errorData.responseData ? JSON.stringify(errorData.responseData) : null,
      errorData.retryCount,
      errorData.retryStatus,
      errorData.maxRetries,
      errorData.nextRetryAt || null,
      errorData.isResolved,
      errorData.stackTrace || null,
      errorData.userAgent || null,
      errorData.ipAddress || null,
      errorData.sessionId || null
    ];

    const result = await this.queryOne<TradingErrorDto>(query, values);
    
    if (!result) {
      throw new Error('거래 오류 기록 생성에 실패했습니다.');
    }

    return result;
  }

  /**
   * 거래 오류 조회 (ID로)
   */
  async findTradingErrorById(id: number): Promise<TradingErrorDto | null> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        trade_id as "tradeId",
        position_id as "positionId",
        error_category as "errorCategory",
        error_severity as "errorSeverity",
        error_code as "errorCode",
        error_message as "errorMessage",
        error_signature as "errorSignature",
        exchange,
        symbol,
        side,
        intended_quantity as "intendedQuantity",
        intended_price as "intendedPrice",
        api_endpoint as "apiEndpoint",
        request_payload as "requestPayload",
        response_data as "responseData",
        retry_count as "retryCount",
        retry_status as "retryStatus",
        max_retries as "maxRetries",
        next_retry_at as "nextRetryAt",
        is_resolved as "isResolved",
        resolved_at as "resolvedAt",
        resolution_method as "resolutionMethod",
        resolution_notes as "resolutionNotes",
        stack_trace as "stackTrace",
        user_agent as "userAgent",
        ip_address as "ipAddress",
        session_id as "sessionId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM trading_errors 
      WHERE id = $1
    `;

    return this.queryOne<TradingErrorDto>(query, [id]);
  }

  /**
   * 사용자별 거래 오류 목록 조회
   */
  async findTradingErrorsByUserId(
    userId: number, 
    options: {
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      exchange?: string;
      resolved?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ errors: TradingErrorDto[]; total: number }> {
    let baseQuery = `
      SELECT 
        id, user_id as "userId", trade_id as "tradeId", position_id as "positionId",
        error_category as "errorCategory", error_severity as "errorSeverity",
        error_code as "errorCode", error_message as "errorMessage",
        exchange, symbol, side, intended_quantity as "intendedQuantity",
        intended_price as "intendedPrice", api_endpoint as "apiEndpoint",
        request_payload as "requestPayload", response_data as "responseData",
        retry_count as "retryCount", retry_status as "retryStatus",
        max_retries as "maxRetries", next_retry_at as "nextRetryAt",
        is_resolved as "isResolved", resolved_at as "resolvedAt",
        resolution_method as "resolutionMethod", resolution_notes as "resolutionNotes",
        stack_trace as "stackTrace", user_agent as "userAgent",
        ip_address as "ipAddress", session_id as "sessionId",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM trading_errors 
      WHERE user_id = $1
    `;

    let countQuery = 'SELECT COUNT(*) as count FROM trading_errors WHERE user_id = $1';
    let params: any[] = [userId];
    let paramIndex = 2;

    // 필터 조건 추가
    if (options.severity) {
      baseQuery += ` AND error_severity = $${paramIndex}`;
      countQuery += ` AND error_severity = $${paramIndex}`;
      params.push(options.severity);
      paramIndex++;
    }

    if (options.category) {
      baseQuery += ` AND error_category = $${paramIndex}`;
      countQuery += ` AND error_category = $${paramIndex}`;
      params.push(options.category);
      paramIndex++;
    }

    if (options.exchange) {
      baseQuery += ` AND exchange = $${paramIndex}`;
      countQuery += ` AND exchange = $${paramIndex}`;
      params.push(options.exchange);
      paramIndex++;
    }

    if (options.resolved !== undefined) {
      baseQuery += ` AND is_resolved = $${paramIndex}`;
      countQuery += ` AND is_resolved = $${paramIndex}`;
      params.push(options.resolved);
      paramIndex++;
    }

    // 정렬 및 페이징
    baseQuery += ' ORDER BY created_at DESC';
    
    if (options.limit) {
      baseQuery += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      baseQuery += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    const [errors, countResult] = await Promise.all([
      this.queryMany<TradingErrorDto>(baseQuery, params.slice(0, paramIndex - (options.offset ? 1 : 0))),
      this.queryOne<{ count: string }>(countQuery, params.slice(0, paramIndex - (options.limit ? 1 : 0) - (options.offset ? 1 : 0)))
    ]);

    return {
      errors,
      total: parseInt(countResult?.count || '0')
    };
  }

  /**
   * 재시도 대기 중인 오류들 조회
   */
  async findPendingRetries(): Promise<TradingErrorDto[]> {
    const query = `
      SELECT 
        id, user_id as "userId", trade_id as "tradeId", position_id as "positionId",
        error_category as "errorCategory", error_severity as "errorSeverity",
        error_code as "errorCode", error_message as "errorMessage",
        exchange, symbol, side, intended_quantity as "intendedQuantity",
        intended_price as "intendedPrice", api_endpoint as "apiEndpoint",
        request_payload as "requestPayload", response_data as "responseData",
        retry_count as "retryCount", retry_status as "retryStatus",
        max_retries as "maxRetries", next_retry_at as "nextRetryAt",
        is_resolved as "isResolved", resolved_at as "resolvedAt",
        resolution_method as "resolutionMethod", resolution_notes as "resolutionNotes",
        stack_trace as "stackTrace", user_agent as "userAgent",
        ip_address as "ipAddress", session_id as "sessionId",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM trading_errors 
      WHERE retry_status IN ('pending', 'retrying')
        AND retry_count < max_retries
        AND (next_retry_at IS NULL OR next_retry_at <= NOW())
        AND is_resolved = FALSE
      ORDER BY error_severity DESC, created_at ASC
    `;

    return this.queryMany<TradingErrorDto>(query, []);
  }

  /**
   * 거래 오류 업데이트
   */
  async updateTradingError(id: number, updates: Partial<TradingErrorDto>): Promise<TradingErrorDto | null> {
    const setClause: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // 업데이트할 필드들 동적으로 구성
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt') {
        // camelCase를 snake_case로 변환
        const dbColumn = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        setClause.push(`${dbColumn} = $${paramIndex}`);
        
        if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
          params.push(JSON.stringify(value));
        } else {
          params.push(value);
        }
        paramIndex++;
      }
    });

    if (setClause.length === 0) {
      return this.findTradingErrorById(id);
    }

    setClause.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE trading_errors 
      SET ${setClause.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING 
        id, user_id as "userId", trade_id as "tradeId", position_id as "positionId",
        error_category as "errorCategory", error_severity as "errorSeverity",
        error_code as "errorCode", error_message as "errorMessage",
        exchange, symbol, side, intended_quantity as "intendedQuantity",
        intended_price as "intendedPrice", api_endpoint as "apiEndpoint",
        request_payload as "requestPayload", response_data as "responseData",
        retry_count as "retryCount", retry_status as "retryStatus",
        max_retries as "maxRetries", next_retry_at as "nextRetryAt",
        is_resolved as "isResolved", resolved_at as "resolvedAt",
        resolution_method as "resolutionMethod", resolution_notes as "resolutionNotes",
        stack_trace as "stackTrace", user_agent as "userAgent",
        ip_address as "ipAddress", session_id as "sessionId",
        created_at as "createdAt", updated_at as "updatedAt"
    `;

    return this.queryOne<TradingErrorDto>(query, params);
  }

  /**
   * 오류 패턴 생성 또는 업데이트
   */
  async upsertErrorPattern(patternData: Omit<ErrorPatternDto, 'id' | 'createdAt' | 'updatedAt'>): Promise<ErrorPatternDto> {
    const query = `
      INSERT INTO error_patterns (
        pattern_name, error_signature, occurrence_count, first_seen, last_seen,
        affected_users, total_failed_trades, estimated_loss, is_known_issue,
        fix_priority, fix_status, suggested_fix
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (error_signature) DO UPDATE SET
        occurrence_count = error_patterns.occurrence_count + 1,
        last_seen = EXCLUDED.last_seen,
        affected_users = EXCLUDED.affected_users,
        total_failed_trades = EXCLUDED.total_failed_trades,
        estimated_loss = EXCLUDED.estimated_loss,
        updated_at = NOW()
      RETURNING 
        id, pattern_name as "patternName", error_signature as "errorSignature",
        occurrence_count as "occurrenceCount", first_seen as "firstSeen", last_seen as "lastSeen",
        affected_users as "affectedUsers", total_failed_trades as "totalFailedTrades",
        estimated_loss as "estimatedLoss", is_known_issue as "isKnownIssue",
        fix_priority as "fixPriority", fix_status as "fixStatus",
        suggested_fix as "suggestedFix", fix_implemented_at as "fixImplementedAt",
        fix_notes as "fixNotes", created_at as "createdAt", updated_at as "updatedAt"
    `;

    const values = [
      patternData.patternName,
      patternData.errorSignature,
      patternData.occurrenceCount,
      patternData.firstSeen,
      patternData.lastSeen,
      patternData.affectedUsers,
      patternData.totalFailedTrades,
      patternData.estimatedLoss,
      patternData.isKnownIssue,
      patternData.fixPriority,
      patternData.fixStatus,
      patternData.suggestedFix || null
    ];

    const result = await this.queryOne<ErrorPatternDto>(query, values);
    
    if (!result) {
      throw new Error('오류 패턴 생성/업데이트에 실패했습니다.');
    }

    return result;
  }

  /**
   * 재시도 이력 생성
   */
  async createRetryHistory(retryData: Omit<RetryHistoryDto, 'id' | 'createdAt'>): Promise<RetryHistoryDto> {
    const query = `
      INSERT INTO retry_history (
        trading_error_id, retry_attempt, retry_started_at, retry_completed_at,
        success, error_message, response_data, backoff_delay_ms, strategy_used
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id,
        trading_error_id as "tradingErrorId",
        retry_attempt as "retryAttempt",
        retry_started_at as "retryStartedAt",
        retry_completed_at as "retryCompletedAt",
        success,
        error_message as "errorMessage",
        response_data as "responseData",
        backoff_delay_ms as "backoffDelayMs",
        strategy_used as "strategyUsed",
        created_at as "createdAt"
    `;

    const values = [
      retryData.tradingErrorId,
      retryData.retryAttempt,
      retryData.retryStartedAt,
      retryData.retryCompletedAt || null,
      retryData.success,
      retryData.errorMessage || null,
      retryData.responseData ? JSON.stringify(retryData.responseData) : null,
      retryData.backoffDelayMs,
      retryData.strategyUsed
    ];

    const result = await this.queryOne<RetryHistoryDto>(query, values);
    
    if (!result) {
      throw new Error('재시도 이력 생성에 실패했습니다.');
    }

    return result;
  }

  /**
   * 오류 통계 조회
   */
  async getErrorStats(userId?: number, days: number = 30): Promise<ErrorStatsDto> {
    const userFilter = userId ? 'AND user_id = $2' : '';
    const params = userId ? [days, userId] : [days];

    const query = `
      WITH error_stats AS (
        SELECT 
          COUNT(*) as total_errors,
          COUNT(CASE WHEN is_resolved = true THEN 1 END) as resolved_errors,
          COUNT(CASE WHEN is_resolved = false THEN 1 END) as pending_errors,
          COUNT(CASE WHEN error_severity = 'low' THEN 1 END) as low_severity,
          COUNT(CASE WHEN error_severity = 'medium' THEN 1 END) as medium_severity,
          COUNT(CASE WHEN error_severity = 'high' THEN 1 END) as high_severity,
          COUNT(CASE WHEN error_severity = 'critical' THEN 1 END) as critical_severity,
          COUNT(CASE WHEN error_category = 'api' THEN 1 END) as api_errors,
          COUNT(CASE WHEN error_category = 'network' THEN 1 END) as network_errors,
          COUNT(CASE WHEN error_category = 'validation' THEN 1 END) as validation_errors,
          COUNT(CASE WHEN error_category = 'balance' THEN 1 END) as balance_errors,
          COUNT(CASE WHEN error_category = 'order' THEN 1 END) as order_errors,
          COUNT(CASE WHEN error_category = 'system' THEN 1 END) as system_errors,
          COUNT(CASE WHEN exchange = 'upbit' THEN 1 END) as upbit_errors,
          COUNT(CASE WHEN exchange = 'binance' THEN 1 END) as binance_errors,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as errors_24h,
          COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as errors_week,
          SUM(retry_count) as total_retries
        FROM trading_errors 
        WHERE created_at >= NOW() - INTERVAL '$1 days' ${userFilter}
      ),
      retry_stats AS (
        SELECT 
          COUNT(CASE WHEN success = true THEN 1 END) as successful_retries
        FROM retry_history rh
        JOIN trading_errors te ON rh.trading_error_id = te.id
        WHERE te.created_at >= NOW() - INTERVAL '$1 days' ${userFilter.replace('user_id', 'te.user_id')}
      )
      SELECT 
        es.*,
        rs.successful_retries,
        CASE 
          WHEN es.total_retries > 0 THEN ROUND((rs.successful_retries::decimal / es.total_retries) * 100, 2)
          ELSE 0 
        END as retry_success_rate,
        CASE 
          WHEN es.total_errors > 0 THEN ROUND((es.resolved_errors::decimal / es.total_errors) * 100, 2)
          ELSE 0 
        END as resolution_rate
      FROM error_stats es, retry_stats rs
    `;

    const result = await this.queryOne<any>(query, params);
    
    if (!result) {
      // 기본값 반환
      return {
        totalErrors: 0,
        errorsBySeverity: {
          [ErrorSeverity.LOW]: 0,
          [ErrorSeverity.MEDIUM]: 0,
          [ErrorSeverity.HIGH]: 0,
          [ErrorSeverity.CRITICAL]: 0
        },
        errorsByCategory: {
          [ErrorCategory.API]: 0,
          [ErrorCategory.NETWORK]: 0,
          [ErrorCategory.VALIDATION]: 0,
          [ErrorCategory.BALANCE]: 0,
          [ErrorCategory.ORDER]: 0,
          [ErrorCategory.SYSTEM]: 0
        },
        errorsByExchange: {
          upbit: 0,
          binance: 0
        },
        resolvedErrors: 0,
        pendingErrors: 0,
        resolutionRate: 0,
        totalRetries: 0,
        successfulRetries: 0,
        retrySuccessRate: 0,
        errorsLast24Hours: 0,
        errorsLastWeek: 0,
        errorsLastMonth: 0
      };
    }

    return {
      totalErrors: parseInt(result.total_errors || '0'),
      errorsBySeverity: {
        [ErrorSeverity.LOW]: parseInt(result.low_severity || '0'),
        [ErrorSeverity.MEDIUM]: parseInt(result.medium_severity || '0'),
        [ErrorSeverity.HIGH]: parseInt(result.high_severity || '0'),
        [ErrorSeverity.CRITICAL]: parseInt(result.critical_severity || '0')
      },
      errorsByCategory: {
        [ErrorCategory.API]: parseInt(result.api_errors || '0'),
        [ErrorCategory.NETWORK]: parseInt(result.network_errors || '0'),
        [ErrorCategory.VALIDATION]: parseInt(result.validation_errors || '0'),
        [ErrorCategory.BALANCE]: parseInt(result.balance_errors || '0'),
        [ErrorCategory.ORDER]: parseInt(result.order_errors || '0'),
        [ErrorCategory.SYSTEM]: parseInt(result.system_errors || '0')
      },
      errorsByExchange: {
        upbit: parseInt(result.upbit_errors || '0'),
        binance: parseInt(result.binance_errors || '0')
      },
      resolvedErrors: parseInt(result.resolved_errors || '0'),
      pendingErrors: parseInt(result.pending_errors || '0'),
      resolutionRate: parseFloat(result.resolution_rate || '0'),
      totalRetries: parseInt(result.total_retries || '0'),
      successfulRetries: parseInt(result.successful_retries || '0'),
      retrySuccessRate: parseFloat(result.retry_success_rate || '0'),
      errorsLast24Hours: parseInt(result.errors_24h || '0'),
      errorsLastWeek: parseInt(result.errors_week || '0'),
      errorsLastMonth: parseInt(result.total_errors || '0')
    };
  }

  /**
   * 오류 패턴 목록 조회
   */
  async getErrorPatterns(options: {
    fixStatus?: FixStatus;
    priority?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ patterns: ErrorPatternDto[]; total: number }> {
    let baseQuery = `
      SELECT 
        id, pattern_name as "patternName", error_signature as "errorSignature",
        occurrence_count as "occurrenceCount", first_seen as "firstSeen", last_seen as "lastSeen",
        affected_users as "affectedUsers", total_failed_trades as "totalFailedTrades",
        estimated_loss as "estimatedLoss", is_known_issue as "isKnownIssue",
        fix_priority as "fixPriority", fix_status as "fixStatus",
        suggested_fix as "suggestedFix", fix_implemented_at as "fixImplementedAt",
        fix_notes as "fixNotes", created_at as "createdAt", updated_at as "updatedAt"
      FROM error_patterns 
      WHERE 1=1
    `;

    let countQuery = 'SELECT COUNT(*) as count FROM error_patterns WHERE 1=1';
    let params: any[] = [];
    let paramIndex = 1;

    // 필터 조건 추가
    if (options.fixStatus) {
      baseQuery += ` AND fix_status = $${paramIndex}`;
      countQuery += ` AND fix_status = $${paramIndex}`;
      params.push(options.fixStatus);
      paramIndex++;
    }

    if (options.priority) {
      baseQuery += ` AND fix_priority = $${paramIndex}`;
      countQuery += ` AND fix_priority = $${paramIndex}`;
      params.push(options.priority);
      paramIndex++;
    }

    // 정렬 및 페이징
    baseQuery += ' ORDER BY fix_priority DESC, occurrence_count DESC';
    
    if (options.limit) {
      baseQuery += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options.offset) {
      baseQuery += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
    }

    const [patterns, countResult] = await Promise.all([
      this.queryMany<ErrorPatternDto>(baseQuery, params.slice(0, paramIndex - (options.offset ? 1 : 0))),
      this.queryOne<{ count: string }>(countQuery, params.slice(0, paramIndex - (options.limit ? 1 : 0) - (options.offset ? 1 : 0)))
    ]);

    return {
      patterns,
      total: parseInt(countResult?.count || '0')
    };
  }
}
