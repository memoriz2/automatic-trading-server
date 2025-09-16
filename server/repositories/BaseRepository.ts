import { Pool, PoolClient } from 'pg';
import { pool } from '../db.js';

/**
 * 기본 Repository 클래스
 * 모든 Repository가 상속받아 사용하는 공통 기능 제공
 */
export abstract class BaseRepository {
  protected pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * 단일 쿼리 실행
   */
  protected async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Database query error:', { text, params, error });
      throw error;
    }
  }

  /**
   * 단일 레코드 조회
   */
  protected async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(text, params);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * 트랜잭션 실행
   */
  protected async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 페이지네이션 쿼리
   */
  protected async queryWithPagination<T = any>(
    baseQuery: string,
    countQuery: string,
    params: any[] = [],
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: T[]; total: number; page: number; limit: number; pages: number }> {
    const offset = (page - 1) * limit;
    
    // 데이터와 총 개수를 병렬로 조회
    const [dataResult, countResult] = await Promise.all([
      this.query<T>(`${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, 
        [...params, limit, offset]),
      this.queryOne<{ count: string }>(countQuery, params)
    ]);

    const total = parseInt(countResult?.count || '0');
    const pages = Math.ceil(total / limit);

    return {
      data: dataResult,
      total,
      page,
      limit,
      pages
    };
  }

  /**
   * 벌크 삽입
   */
  protected async bulkInsert<T>(
    tableName: string,
    columns: string[],
    values: T[][],
    onConflict?: string
  ): Promise<void> {
    if (values.length === 0) return;

    const placeholders = values.map((_, rowIndex) => 
      `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
    ).join(', ');

    const flatValues = values.flat();
    const conflictClause = onConflict ? ` ON CONFLICT ${onConflict}` : '';
    
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders}
      ${conflictClause}
    `;

    await this.query(query, flatValues);
  }

  /**
   * 안전한 업데이트 (WHERE 조건 필수)
   */
  protected async safeUpdate(
    tableName: string,
    updates: Record<string, any>,
    whereConditions: Record<string, any>
  ): Promise<number> {
    if (Object.keys(whereConditions).length === 0) {
      throw new Error('WHERE 조건이 필요합니다. 전체 테이블 업데이트는 허용되지 않습니다.');
    }

    const updateClauses = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 1}`
    );
    
    const whereClauses = Object.keys(whereConditions).map((key, index) => 
      `${key} = $${Object.keys(updates).length + index + 1}`
    );

    const query = `
      UPDATE ${tableName} 
      SET ${updateClauses.join(', ')}, updated_at = NOW()
      WHERE ${whereClauses.join(' AND ')}
    `;

    const params = [...Object.values(updates), ...Object.values(whereConditions)];
    const result = await this.query(query, params);
    return (result as any).rowCount || 0;
  }

  /**
   * 안전한 삭제 (WHERE 조건 필수)
   */
  protected async safeDelete(
    tableName: string,
    whereConditions: Record<string, any>
  ): Promise<number> {
    if (Object.keys(whereConditions).length === 0) {
      throw new Error('WHERE 조건이 필요합니다. 전체 테이블 삭제는 허용되지 않습니다.');
    }

    const whereClauses = Object.keys(whereConditions).map((key, index) => 
      `${key} = $${index + 1}`
    );

    const query = `
      DELETE FROM ${tableName} 
      WHERE ${whereClauses.join(' AND ')}
    `;

    const result = await this.query(query, Object.values(whereConditions));
    return (result as any).rowCount || 0;
  }

  /**
   * 존재 여부 확인
   */
  protected async exists(
    tableName: string,
    whereConditions: Record<string, any>
  ): Promise<boolean> {
    const whereClauses = Object.keys(whereConditions).map((key, index) => 
      `${key} = $${index + 1}`
    );

    const query = `
      SELECT EXISTS(
        SELECT 1 FROM ${tableName} 
        WHERE ${whereClauses.join(' AND ')}
      ) as exists
    `;

    const result = await this.queryOne<{ exists: boolean }>(
      query, 
      Object.values(whereConditions)
    );
    
    return result?.exists || false;
  }

  /**
   * 카운트 조회
   */
  protected async count(
    tableName: string,
    whereConditions?: Record<string, any>
  ): Promise<number> {
    let query = `SELECT COUNT(*) as count FROM ${tableName}`;
    let params: any[] = [];

    if (whereConditions && Object.keys(whereConditions).length > 0) {
      const whereClauses = Object.keys(whereConditions).map((key, index) => 
        `${key} = $${index + 1}`
      );
      query += ` WHERE ${whereClauses.join(' AND ')}`;
      params = Object.values(whereConditions);
    }

    const result = await this.queryOne<{ count: string }>(query, params);
    return parseInt(result?.count || '0');
  }
}
