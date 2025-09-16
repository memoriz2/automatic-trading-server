import { pool } from '../db.js';
/**
 * 기본 Repository 클래스
 * 모든 Repository가 상속받아 사용하는 공통 기능 제공
 */
export class BaseRepository {
    pool;
    constructor() {
        this.pool = pool;
    }
    /**
     * 단일 쿼리 실행
     */
    async query(text, params) {
        try {
            const result = await this.pool.query(text, params);
            return result.rows;
        }
        catch (error) {
            console.error('❌ Database query error:', { text, params, error });
            throw error;
        }
    }
    /**
     * 단일 레코드 조회
     */
    async queryOne(text, params) {
        const rows = await this.query(text, params);
        return rows.length > 0 ? rows[0] : null;
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
            console.error('❌ Transaction error:', error);
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * 페이지네이션 쿼리
     */
    async queryWithPagination(baseQuery, countQuery, params = [], page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        // 데이터와 총 개수를 병렬로 조회
        const [dataResult, countResult] = await Promise.all([
            this.query(`${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]),
            this.queryOne(countQuery, params)
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
    async bulkInsert(tableName, columns, values, onConflict) {
        if (values.length === 0)
            return;
        const placeholders = values.map((_, rowIndex) => `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`).join(', ');
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
    async safeUpdate(tableName, updates, whereConditions) {
        if (Object.keys(whereConditions).length === 0) {
            throw new Error('WHERE 조건이 필요합니다. 전체 테이블 업데이트는 허용되지 않습니다.');
        }
        const updateClauses = Object.keys(updates).map((key, index) => `${key} = $${index + 1}`);
        const whereClauses = Object.keys(whereConditions).map((key, index) => `${key} = $${Object.keys(updates).length + index + 1}`);
        const query = `
      UPDATE ${tableName} 
      SET ${updateClauses.join(', ')}, updated_at = NOW()
      WHERE ${whereClauses.join(' AND ')}
    `;
        const params = [...Object.values(updates), ...Object.values(whereConditions)];
        const result = await this.query(query, params);
        return result.rowCount || 0;
    }
    /**
     * 안전한 삭제 (WHERE 조건 필수)
     */
    async safeDelete(tableName, whereConditions) {
        if (Object.keys(whereConditions).length === 0) {
            throw new Error('WHERE 조건이 필요합니다. 전체 테이블 삭제는 허용되지 않습니다.');
        }
        const whereClauses = Object.keys(whereConditions).map((key, index) => `${key} = $${index + 1}`);
        const query = `
      DELETE FROM ${tableName} 
      WHERE ${whereClauses.join(' AND ')}
    `;
        const result = await this.query(query, Object.values(whereConditions));
        return result.rowCount || 0;
    }
    /**
     * 존재 여부 확인
     */
    async exists(tableName, whereConditions) {
        const whereClauses = Object.keys(whereConditions).map((key, index) => `${key} = $${index + 1}`);
        const query = `
      SELECT EXISTS(
        SELECT 1 FROM ${tableName} 
        WHERE ${whereClauses.join(' AND ')}
      ) as exists
    `;
        const result = await this.queryOne(query, Object.values(whereConditions));
        return result?.exists || false;
    }
    /**
     * 카운트 조회
     */
    async count(tableName, whereConditions) {
        let query = `SELECT COUNT(*) as count FROM ${tableName}`;
        let params = [];
        if (whereConditions && Object.keys(whereConditions).length > 0) {
            const whereClauses = Object.keys(whereConditions).map((key, index) => `${key} = $${index + 1}`);
            query += ` WHERE ${whereClauses.join(' AND ')}`;
            params = Object.values(whereConditions);
        }
        const result = await this.queryOne(query, params);
        return parseInt(result?.count || '0');
    }
}
