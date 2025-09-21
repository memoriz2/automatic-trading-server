# 프로덕션 수준 로그 시스템

## 개요

새로운 로그 시스템은 환경에 따라 로그 레벨을 조정하고 구조화된 로그를 제공합니다.

## 로그 레벨

- **ERROR (0)**: 오류 상황만 출력
- **WARN (1)**: 경고 및 오류 출력  
- **INFO (2)**: 정보, 경고, 오류 출력 (프로덕션 기본값)
- **DEBUG (3)**: 모든 로그 출력 (개발 기본값)

## 환경변수 설정

```bash
# 로그 레벨 설정
LOG_LEVEL=info          # error, warn, info, debug 중 선택

# 환경 설정
NODE_ENV=production     # 프로덕션 환경에서는 JSON 형태로 구조화된 로그 출력
NODE_ENV=development    # 개발 환경에서는 가독성 좋은 형태로 출력
```

## 로그 형태

### 개발 환경 (NODE_ENV=development)
```
ℹ️ [2024-01-01T00:00:00.000Z] 서버 시작 {"port":"5000","nodeEnv":"development"}
🔍 [2024-01-01T00:00:00.000Z] 세션 갱신 {"method":"GET","path":"/dashboard","userId":1}
```

### 프로덕션 환경 (NODE_ENV=production)
```json
{"timestamp":"2024-01-01T00:00:00.000Z","level":"INFO","message":"서버 시작","port":"5000","nodeEnv":"production"}
{"timestamp":"2024-01-01T00:00:00.000Z","level":"DEBUG","message":"세션 갱신","method":"GET","path":"/dashboard","userId":1}
```

## 사용법

```typescript
import { logError, logWarn, logInfo, logDebug, logSystem, logSecurity } from './utils/logger.js';

// 기본 로그
logInfo('사용자 로그인 성공', { userId: 123, ip: '192.168.1.1' });
logError('데이터베이스 연결 실패', { error: error.message });

// 시스템 로그 (항상 출력)
logSystem('서버 시작', { port: 5000 });

// 보안 로그 (항상 출력)
logSecurity('의심스러운 로그인 시도', { ip: '1.2.3.4', attempts: 5 });
```

## 주요 개선사항

1. **로그 스팸 제거**: 세션 인증 실패 로그 30초 스로틀링
2. **구조화된 로그**: 프로덕션에서 JSON 형태로 출력하여 로그 분석 도구 호환
3. **환경별 최적화**: 개발/프로덕션 환경에 맞는 로그 출력
4. **중요도별 분류**: 시스템, 보안 로그는 항상 출력
5. **성능 최적화**: 불필요한 로그 제거로 I/O 부하 감소

## 프로덕션 배포 시 권장 설정

```bash
NODE_ENV=production
LOG_LEVEL=info
```

이 설정으로 중요한 정보는 놓치지 않으면서도 로그 볼륨을 적절히 관리할 수 있습니다.
