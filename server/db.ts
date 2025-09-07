


// server/db.ts
import 'dotenv/config';
import { PrismaClient } from './generated/prisma';

// Prisma 클라이언트 (싱글톤)
export const prisma = new PrismaClient();

export async function ping(): Promise<boolean> {
  try {
    // 간단한 ping 쿼리
    await prisma.$queryRawUnsafe('select 1');
    return true;
  } catch {
    return false;
  }
}

export async function initializeTestData() {
  try {
    // 필수 데이터 준비: cryptocurrencies 기본 심볼이 없다면 생성
    const btc = await prisma.cryptocurrency.findUnique({ where: { symbol: 'BTC' } });
    if (!btc) {
      await prisma.cryptocurrency.createMany({
        data: [
          { symbol: 'BTC', name: 'Bitcoin', isActive: true },
          { symbol: 'ETH', name: 'Ethereum', isActive: true },
          { symbol: 'XRP', name: 'XRP', isActive: true },
          { symbol: 'ADA', name: 'Cardano', isActive: true },
          { symbol: 'DOT', name: 'Polkadot', isActive: true },
        ],
        skipDuplicates: true,
      });
    }
  } catch (err) {
    // 초기 데이터는 필수는 아니므로 조용히 진행
  }
}

export async function closeDb() {
  try {
    await prisma.$disconnect();
  } catch {
    // noop
  }
}

// 초기화 루틴 (필요시)
initializeTestData().catch(() => {});
