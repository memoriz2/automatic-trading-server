# PM2 환경별 실행 가이드

## 📋 파일 구조

### 로컬 개발용 파일들:
```
ecosystem.config.mjs              # 로컬 PM2 설정
tsconfig.server.local.json       # 로컬 TypeScript 설정
```

### 서버 프로덕션용 파일들:
```
ecosystem.config.server.mjs       # 서버 PM2 설정
tsconfig.server.server.json      # 서버 TypeScript 설정
```

### 공통 파일들:
```
tsconfig.server.json             # 기존 설정 (호환용)
server/prisma/schema.prisma      # Prisma 스키마
```

## 🚀 로컬 개발 환경

### 빌드
```bash
npm run build:server:local    # 로컬용 서버 빌드
```

### 시작
```bash
npm run dev:pm2
```

### 관리 명령어
```bash
npm run dev:pm2:stop      # 정지
npm run dev:pm2:restart   # 재시작
npm run dev:pm2:delete    # 삭제
npm run dev:pm2:logs      # 로그 보기
```

### 특징
- **PORT**: 5001
- **NODE_ENV**: development
- **Script**: `./server/index.ts` (tsx로 직접 실행)
- **Watch**: 파일 변경 시 자동 재시작
- **Name**: `trading-server-dev`
- **Config**: `ecosystem.config.mjs`
- **TS Config**: `tsconfig.server.local.json`

## 🖥️ 서버 프로덕션 환경

### 빌드
```bash
npm run build:server:server  # 서버용 빌드
```

### 시작
```bash
npm run server:pm2:start
```

### 관리 명령어
```bash
npm run server:pm2:stop      # 정지
npm run server:pm2:restart   # 재시작
npm run server:pm2:delete    # 삭제
npm run server:pm2:logs      # 로그 보기
```

### 특징
- **PORT**: 5000
- **NODE_ENV**: production
- **Script**: `./dist/server/index.js` (빌드된 파일)
- **Name**: `trading-server`
- **Config**: `ecosystem.config.server.mjs`
- **TS Config**: `tsconfig.server.server.json`

## 📊 상태 확인

```bash
npm run pm2:status
```

## 🔄 전체 흐름

### 로컬 개발
```bash
# 1. 개발 시작
npm run dev:pm2

# 2. 코드 수정 (자동 재시작)

# 3. 개발 끝
npm run dev:pm2:stop
```

### 서버 배포
```bash
# 1. 코드 빌드
npm run build

# 2. 서버 시작
npm run server:pm2:start

# 3. 로그 확인
npm run server:pm2:logs
```

## ⚙️ 환경별 차이점

| 항목 | 로컬 개발 | 서버 프로덕션 |
|------|-----------|---------------|
| 설정 파일 | `ecosystem.config.mjs` | `ecosystem.config.server.mjs` |
| TS 설정 파일 | `tsconfig.server.local.json` | `tsconfig.server.server.json` |
| 빌드 명령어 | `npm run build:server:local` | `npm run build:server:server` |
| 포트 | 5001 | 5000 |
| 실행 파일 | 소스코드 (tsx) | 빌드 파일 |
| 자동 재시작 | 파일 변경 시 | 메모리 초과 시 |
| 로그 파일 | `./logs/dev-*.log` | `./logs/*.log` |

## 🚀 빠른 시작

### 로컬 개발:
```bash
npm run build:server:local  # 빌드
npm run dev:pm2            # 실행
npm run dev:pm2:logs       # 로그
```

### 서버 배포:
```bash
npm run build:server:server  # 빌드
npm run server:pm2:start     # 실행
npm run server:pm2:logs      # 로그
```

## 🚨 주의사항

- 각 환경에 맞는 설정 파일과 빌드 명령어 사용
- 로컬에서는 `npm run dev:pm2` 사용
- 서버에서는 `npm run server:pm2:start` 사용
- 환경에 맞는 포트가 자동으로 설정됨
- 로그 파일이 분리되어 관리됨
