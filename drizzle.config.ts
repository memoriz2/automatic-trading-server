/*import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
*/

// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './shared/schema.ts', // 파일 경로(절대 @shared 같은 alias 금지)
  out: './drizzle',
  dialect: 'postgresql',        // ← driver 대신 dialect를 쓰면 타입 충돌을 확실히 피합니다
  dbCredentials: {
    url: process.env.DATABASE_URL!, // ← postgresql://... 그대로
  },
  verbose: true,
  strict: true,
});
