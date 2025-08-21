


// server/db.ts
import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { eq } from 'drizzle-orm';
import * as schema from '@shared/schema';

// Neon 네트워킹 최적화
neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');

export const pool = new Pool({
  connectionString: url,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  maxUses: 7_500,
});

export const db = drizzle({ client: pool, schema });

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

    console.log('✅ Neon(Postgres) ready (HTTP driver + drizzle)');
  } catch (err: any) {
    console.warn('⚠️ DB init warning:', err?.message ?? err);
  }
}

export async function closeDb() {
  try { await pool.end(); } catch { /* noop */ }
}

initializeTestData().catch(() => {});
