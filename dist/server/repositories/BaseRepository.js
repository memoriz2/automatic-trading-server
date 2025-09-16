import { Pool } from 'pg';
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
    pool;
    constructor() {
        this.pool = pool;
    }
    /**
     * 단일 결과 조회
     */
    async queryOne(query, params = []) {
        try {
            const result = await this.pool.query(query, params);
            return result.rows[0] || null;
        }
        catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }
    /**
     * 다중 결과 조회
     */
    async queryMany(query, params = []) {
        try {
            const result = await this.pool.query(query, params);
            return result.rows;
        }
        catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }
    /**
     * 트랜잭션 실행
     */
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 레코드 존재 여부 확인
     */
    async exists(tableName, conditions) {
        const whereClause = Object.keys(conditions)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(' AND ');
        const query = `SELECT EXISTS(SELECT 1 FROM ${tableName} WHERE ${whereClause})`;
        const values = Object.values(conditions);
        const result = await this.queryOne(query, values);
        return result?.exists || false;
    }
    /**
     * 페이징 처리된 결과 조회
     */
    async paginate(baseQuery, countQuery, params = [], page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        // LIMIT과 OFFSET을 추가한 쿼리
        const paginatedQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const paginatedParams = [...params, limit, offset];
        const [data, countResult] = await Promise.all([
            this.queryMany(paginatedQuery, paginatedParams),
            this.queryOne(countQuery, params)
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
    async query(query, params = []) {
        return this.queryMany(query, params);
    }
    /**
     * 페이징이 포함된 쿼리 실행
     */
    async queryWithPagination(baseQuery, countQuery, params = [], page = 1, limit = 50) {
        return this.paginate(baseQuery, countQuery, params, page, limit);
    }
    /**
     * 안전한 업데이트
     */
    async safeUpdate(tableName, updates, conditions) {
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
        }
        catch (error) {
            console.error(`Safe update error on ${tableName}:`, error);
            throw error;
        }
    }
    /**
     * 안전한 삭제
     */
    async safeDelete(tableName, conditions) {
        const whereClause = Object.keys(conditions)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(' AND ');
        const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
        const params = Object.values(conditions);
        try {
            const result = await this.pool.query(query, params);
            return result.rowCount || 0;
        }
        catch (error) {
            console.error(`Safe delete error on ${tableName}:`, error);
            throw error;
        }
    }
    /**
     * 레코드 개수 조회
     */
    async count(tableName, conditions = {}) {
        const whereClause = Object.keys(conditions).length > 0
            ? 'WHERE ' + Object.keys(conditions)
                .map((key, index) => `${key} = $${index + 1}`)
                .join(' AND ')
            : '';
        const query = `SELECT COUNT(*) as count FROM ${tableName} ${whereClause}`;
        const params = Object.values(conditions);
        const result = await this.queryOne(query, params);
        return parseInt(result?.count || '0');
    }
    /**
     * 대량 삽입
     */
    async bulkInsert(tableName, columns, rows) {
        if (rows.length === 0)
            return;
        const placeholders = rows.map((_, rowIndex) => `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`).join(', ');
        const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES ${placeholders}
    `;
        const params = rows.flat();
        try {
            await this.pool.query(query, params);
        }
        catch (error) {
            console.error(`Bulk insert error on ${tableName}:`, error);
            throw error;
        }
    }
}
