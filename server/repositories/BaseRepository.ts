import { Pool, PoolClient } from 'pg';

// PostgreSQL 연결 풀
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * 기본 Repository 클래스
 * 공통 데이터베이스 작업을 위한 베이스 클래스
 */
export class BaseRepository {
  protected pool: Pool;

  constructor() {
    this.pool = pool;
  }

  /**
   * 단일 결과 조회
   */
  protected async queryOne<T>(query: string, params: any[] = []): Promise<T | null> {
    try {
      const result = await this.pool.query(query, params);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * 다중 결과 조회
   */
  protected async queryMany<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  /**
   * 트랜잭션 실행
   */
  protected async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 레코드 존재 여부 확인
   */
  protected async exists(tableName: string, conditions: Record<string, any>): Promise<boolean> {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const query = `SELECT EXISTS(SELECT 1 FROM ${tableName} WHERE ${whereClause})`;
    const values = Object.values(conditions);
    
    const result = await this.queryOne<{ exists: boolean }>(query, values);
    return result?.exists || false;
  }

  /**
   * 페이징 처리된 결과 조회
   */
  protected async paginate<T>(
    baseQuery: string,
    countQuery: string,
    params: any[] = [],
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: T[]; total: number; page: number; limit: number; pages: number; totalPages: number }> {
    const offset = (page - 1) * limit;
    
    // LIMIT과 OFFSET을 추가한 쿼리
    const paginatedQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const paginatedParams = [...params, limit, offset];
    
    const [data, countResult] = await Promise.all([
      this.queryMany<T>(paginatedQuery, paginatedParams),
      this.queryOne<{ count: string }>(countQuery, params)
    ]);
    
    const total = parseInt(countResult?.count || '0');
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      total,
      page,
      limit,
      pages: totalPages, // 호환성을 위해 pages도 추가
      totalPages
    };
  }

  /**
   * 일반 쿼리 실행 (기존 호환성을 위해)
   */
  protected async query<T>(query: string, params: any[] = []): Promise<T[]> {
    return this.queryMany<T>(query, params);
  }

  /**
   * 페이징이 포함된 쿼리 실행
   */
  protected async queryWithPagination<T>(
    baseQuery: string,
    countQuery: string,
    params: any[] = [],
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: T[]; total: number; page: number; limit: number; pages: number; totalPages: number }> {
    return this.paginate<T>(baseQuery, countQuery, params, page, limit);
  }

  /**
   * 안전한 업데이트
   */
  protected async safeUpdate(
    tableName: string, 
    updates: Record<string, any>, 
    conditions: Record<string, any>
  ): Promise<number> {
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${Object.keys(updates).length + index + 1}`)
      .join(' AND ');
    
    const query = `
      UPDATE ${tableName} 
      SET ${setClause}, updated_at = NOW()
      WHERE ${whereClause}
    `;
    
    const params = [...Object.values(updates), ...Object.values(conditions)];
    
    try {
      const result = await this.pool.query(query, params);
      return result.rowCount || 0;
    } catch (error) {
      console.error(`Safe update error on ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * 안전한 삭제
   */
  protected async safeDelete(
    tableName: string,
    conditions: Record<string, any>
  ): Promise<number> {
    const whereClause = Object.keys(conditions)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');
    
    const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    const params = Object.values(conditions);
    
    try {
      const result = await this.pool.query(query, params);
      return result.rowCount || 0;
    } catch (error) {
      console.error(`Safe delete error on ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * 레코드 개수 조회
   */
  protected async count(tableName: string, conditions: Record<string, any> = {}): Promise<number> {
    const whereClause = Object.keys(conditions).length > 0
      ? 'WHERE ' + Object.keys(conditions)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(' AND ')
      : '';
    
    const query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
    const params = Object.values(conditions);
    
    const result = await this.queryOne<{ count: string }>(query, params);
    return parseInt(result?.count || '0');
  }

  /**
   * 대량 삽입
   */
  protected async bulkInsert(
    tableName: string,
    columns: string[],
    rows: any[][]
  ): Promise<void> {
    if (rows.length === 0) return;
    
    const placeholders = rows.map((_, rowIndex) => 
      `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
    ).join(', ');
    
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders}
    `;
    
    const params = rows.flat();
    
    try {
      await this.pool.query(query, params);
    } catch (error) {
      console.error(`Bulk insert error on ${tableName}:`, error);
      throw error;
    }
  }
}