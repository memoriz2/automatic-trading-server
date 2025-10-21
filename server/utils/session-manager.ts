/**
 * 세션 관리 유틸리티
 * - 사용자별 세션 무효화
 * - 중복 로그인 방지
 */

import type { RedisStore } from 'connect-redis';

/**
 * Redis에서 특정 사용자의 모든 활성 세션을 무효화
 * @param redisStore Redis 세션 스토어
 * @param userId 무효화할 사용자 ID
 * @returns 삭제된 세션 수
 */
export async function invalidateUserSessions(
  redisStore: RedisStore | null,
  userId: number
): Promise<number> {
  if (!redisStore) {
    console.warn('⚠️ Redis 스토어가 없어서 기존 세션을 무효화할 수 없습니다 (메모리 세션 사용 중)');
    return 0;
  }

  try {
    const redisClient = (redisStore as any).client;
    if (!redisClient) {
      console.warn('⚠️ Redis 클라이언트를 찾을 수 없습니다');
      return 0;
    }

    // Redis에서 모든 세션 키 가져오기
    const keys = await redisClient.keys('sess:*');
    let deletedCount = 0;

    // 각 세션을 검사하여 해당 사용자의 세션이면 삭제
    for (const key of keys) {
      try {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          const session = JSON.parse(sessionData);

          // 세션에 저장된 사용자 ID와 비교
          if (session.user && session.user.id === userId) {
            await redisClient.del(key);
            deletedCount++;
            console.log(`🗑️ 사용자 ${userId}의 기존 세션 삭제: ${key}`);
          }
        }
      } catch (sessionError) {
        // 개별 세션 처리 실패는 무시하고 계속
        console.warn(`⚠️ 세션 처리 중 오류 (${key}):`, (sessionError as Error).message);
      }
    }

    if (deletedCount > 0) {
      console.log(`✅ 사용자 ${userId}의 기존 세션 ${deletedCount}개 무효화 완료`);
    }

    return deletedCount;
  } catch (error) {
    console.error('❌ 세션 무효화 중 오류:', error);
    return 0;
  }
}
