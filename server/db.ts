


// server/db.ts
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');

// 환경에 따라 다른 드라이버 사용
const isNeon = url.includes('neon.tech') || process.env.NODE_ENV === 'production';

let db: any;
let pool: any;

// 데이터베이스 초기화 함수
async function initializeDatabase() {
  if (isNeon) {
    // Neon (서버 환경)
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const ws = await import('ws');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    
    neonConfig.webSocketConstructor = ws.default;
    neonConfig.poolQueryViaFetch = true;
    
    pool = new Pool({
      connectionString: url,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      maxUses: 7_500,
    });
    
    db = drizzle({ client: pool, schema });
    console.log('🌐 Using Neon database (serverless)');
  } else {
    // Local PostgreSQL
    const { Pool } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    
    pool = new Pool({
      connectionString: url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
    
    db = drizzle(pool, { schema });
    console.log('🐘 Using local PostgreSQL database');
  }
}

// 데이터베이스 초기화 실행
initializeDatabase().catch(console.error);

export { db, pool };

export async function ping(): Promise<boolean> {
  try { await pool.query('select 1'); return true; } catch { return false; }
}

export async function initializeTestData() {
  try {
    await pool.query('select 1');

    const exists = await db
      .select({ id: schema.cryptocurrencies.id })
      .from(schema.cryptocurrencies)
      .where(eq(schema.cryptocurrencies.symbol, 'BTC'))
      .limit(1);

    if (exists.length === 0) {
      await db
        .insert(schema.cryptocurrencies)
        .values([
          { symbol: 'BTC', name: 'Bitcoin' },
          { symbol: 'ETH', name: 'Ethereum' },
          { symbol: 'XRP', name: 'XRP' },
          { symbol: 'ADA', name: 'Cardano' },
          { symbol: 'DOT', name: 'Polkadot' },
        ])
        .onConflictDoNothing({ target: schema.cryptocurrencies.symbol });
    }

    console.log(`✅ Database ready (${isNeon ? 'Neon serverless' : 'Local PostgreSQL'})`);
  } catch (err: any) {
    console.warn('⚠️ DB init warning:', err?.message ?? err);
  }
}

export async function closeDb() {
  try { await pool.end(); } catch { /* noop */ }
}

initializeTestData().catch(() => {});
