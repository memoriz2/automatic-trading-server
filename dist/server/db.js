// server/db.ts
import 'dotenv/config';
import { Pool } from 'pg';
// PostgreSQL 연결 풀 (싱글톤) - 로컬 DB 강제 연결
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://ahndj@localhost:5432/trading_db",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
// 디버깅: 실제 연결 URL 확인
console.log('🔧 [db.ts] DATABASE_URL:', process.env.DATABASE_URL || "postgresql://ahndj@localhost:5432/trading_db");
export async function ping() {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        return true;
    }
    catch {
        return false;
    }
}
export async function initializeTestData() {
    try {
        // 필수 데이터 준비: cryptocurrencies 기본 심볼이 없다면 생성
        const result = await pool.query("SELECT COUNT(*) FROM cryptocurrencies WHERE symbol = 'BTC'");
        const btcExists = parseInt(result.rows[0].count) > 0;
        if (!btcExists) {
            await pool.query(`
        INSERT INTO cryptocurrencies (symbol, name, is_active, created_at) VALUES
        ('BTC', 'Bitcoin', true, NOW()),
        ('ETH', 'Ethereum', true, NOW()),
        ('XRP', 'XRP', true, NOW()),
        ('ADA', 'Cardano', true, NOW()),
        ('DOT', 'Polkadot', true, NOW())
        ON CONFLICT (symbol) DO NOTHING
      `);
        }
    }
    catch (err) {
        console.log('초기 데이터 설정 중 오류 (무시됨):', err);
    }
}
export async function closeDb() {
    try {
        await pool.end();
    }
    catch {
        // noop
    }
}
// 초기화 루틴 (필요시)
initializeTestData().catch(() => { });
