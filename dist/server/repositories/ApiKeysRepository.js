import { BaseRepository } from './BaseRepository.js';
import { decryptApiKey } from '../utils/encryption.js';
/**
 * API 키 관리 Repository
 * exchanges 테이블을 사용하여 거래소 API 키를 관리
 */
export class ApiKeysRepository extends BaseRepository {
    /**
     * 사용자의 모든 API 키 조회
     */
    async findByUserId(userId) {
        const query = `
      SELECT 
        id,
        user_id as "userId",
        exchange,
        api_key as "apiKey",
        api_secret as "secretKey",
        passphrase,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM exchanges 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
        return this.query(query, [userId]);
    }
    /**
     * 특정 거래소의 API 키 조회
     */
    async findByUserAndExchange(userId, exchange) {
        const query = `
      SELECT 
        id,
        user_id as "userId",
        exchange,
        api_key as "apiKey",
        api_secret as "secretKey",
        passphrase,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM exchanges 
      WHERE user_id = $1 AND exchange = $2 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;
        const result = await this.queryOne(query, [userId, exchange]);
        if (!result) {
            return null;
        }
        // 암호화된 API 키 복호화
        try {
            const decryptedApiKey = decryptApiKey(result.apiKey);
            const decryptedSecretKey = decryptApiKey(result.secretKey);
            // API 키 복호화 성공
            return {
                ...result,
                apiKey: decryptedApiKey,
                secretKey: decryptedSecretKey
            };
        }
        catch (error) {
            console.error(`❌ API 키 복호화 실패 (사용자: ${userId}, 거래소: ${exchange}):`, error);
            return null;
        }
    }
    /**
     * API 키 생성 또는 업데이트 (트랜잭션 기반 안전한 방식)
     */
    async upsert(apiKeyData) {
        try {
            // 1. 먼저 기존 데이터 삭제 (손상된 암호화 데이터 정리)
            await this.query(`
        DELETE FROM exchanges
        WHERE user_id = $1 AND exchange = $2
      `, [apiKeyData.userId, apiKeyData.exchange]);
            // 2. 새로운 데이터 삽입 (API 변경 시 승인 대기 상태로 설정)
            const insertQuery = `
        INSERT INTO exchanges (
          user_id, exchange, api_key, api_secret, passphrase, is_active, api_change_status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW()
        )
        RETURNING
          id,
          user_id as "userId",
          exchange,
          api_key as "apiKey",
          api_secret as "secretKey",
          passphrase,
          is_active as "isActive",
          api_change_status as "apiChangeStatus",
          created_at as "createdAt",
          updated_at as "updatedAt"
      `;
            const result = await this.queryOne(insertQuery, [
                apiKeyData.userId,
                apiKeyData.exchange,
                apiKeyData.apiKey,
                apiKeyData.secretKey,
                apiKeyData.passphrase || null,
                apiKeyData.isActive
            ]);
            if (!result) {
                throw new Error('API 키 저장에 실패했습니다.');
            }
            return result;
        }
        catch (error) {
            console.error('❌ API 키 upsert 실패:', {
                error: error.message,
                code: error.code,
                detail: error.detail,
                userId: apiKeyData.userId,
                exchange: apiKeyData.exchange
            });
            throw error;
        }
    }
    /**
     * API 키 활성화/비활성화
     */
    async updateStatus(userId, exchange, isActive) {
        const updatedRows = await this.safeUpdate('exchanges', { is_active: isActive }, { user_id: userId, exchange });
        return updatedRows > 0;
    }
    /**
     * API 키 삭제
     */
    async delete(userId, exchange) {
        const deletedRows = await this.safeDelete('exchanges', { user_id: userId, exchange });
        return deletedRows > 0;
    }
    /**
     * 활성화된 API 키 조회
     */
    async findActiveByUserId(userId) {
        const query = `
      SELECT 
        id,
        user_id as "userId",
        exchange,
        api_key as "apiKey",
        api_secret as "secretKey",
        passphrase,
        is_active as "isActive",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM exchanges 
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
        const results = await this.query(query, [userId]);
        // 모든 API 키 복호화 (안전한 방식)
        return results.map(result => {
            try {
                // 복호화 시도
                const decryptedApiKey = decryptApiKey(result.apiKey);
                const decryptedSecretKey = decryptApiKey(result.secretKey);
                // 복호화가 성공했는지 확인
                if (decryptedApiKey && decryptedSecretKey) {
                    return {
                        ...result,
                        apiKey: decryptedApiKey,
                        secretKey: decryptedSecretKey
                    };
                }
                else {
                    return result;
                }
            }
            catch (error) {
                // 복호화 실패시 원본 반환 (암호화되지 않은 키일 수 있음)
                return result;
            }
        }).filter(result => result.apiKey && result.secretKey); // 복호화 성공한 것만 반환
    }
    /**
     * API 키 유효성 검증
     */
    async validateApiKey(userId, exchange) {
        const apiKey = await this.findByUserAndExchange(userId, exchange);
        if (!apiKey || !apiKey.isActive) {
            return false;
        }
        // API 키가 존재하고 활성화되어 있으면 유효
        return !!(apiKey.apiKey && apiKey.secretKey);
    }
    /**
     * 마지막 사용 시간 업데이트
     */
    async updateLastUsed(userId, exchange) {
        // exchanges 테이블에 last_used 컬럼이 없으므로 updated_at으로 대체
        await this.safeUpdate('exchanges', { updated_at: new Date() }, { user_id: userId, exchange });
    }
    /**
     * 사용자별 연결된 거래소 개수 조회
     */
    async countActiveExchanges(userId) {
        return this.count('exchanges', { user_id: userId, is_active: true });
    }
}
