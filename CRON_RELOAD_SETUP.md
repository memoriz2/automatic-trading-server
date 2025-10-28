# PM2 무중단 Reload 설정

매일 정오 12시에 서버를 무중단으로 reload하는 설정입니다.

## 설정 변경 사항

### Cluster Mode로 변경
- `exec_mode: 'cluster'` - 클러스터 모드 활성화
- `instances: 2` - 2개의 프로세스 실행 (무중단 reload 필수)

### 차이점
- **restart**: 프로세스 중지 → 시작 (다운타임 발생)
- **reload**: 새 프로세스 시작 → 요청 전환 → 기존 프로세스 종료 (무중단)

## 자동 Reload 설정 방법

### 1. 자동 설정 스크립트 사용 (권장)

```bash
./scripts/setup-cron-reload.sh
```

이 스크립트는 자동으로:
- PM2 경로 감지
- 프로젝트 경로 감지
- crontab에 reload 작업 등록
- 로그 파일 설정

### 2. 수동 설정

```bash
# crontab 편집기 열기
crontab -e

# 다음 라인 추가 (프로젝트 경로는 실제 경로로 변경)
0 12 * * * cd /path/to/project && pm2 reload trading-server >> /path/to/project/logs/cron-reload.log 2>&1
```

### 3. 설정 확인

```bash
# 등록된 cron 확인
crontab -l

# PM2 상태 확인
pm2 status

# 클러스터 모드 확인 (instances가 2개여야 함)
pm2 show trading-server
```

## 수동 Reload 명령어

```bash
# 프로덕션 서버 무중단 reload
pm2 reload trading-server

# 개발 서버 무중단 reload
pm2 reload trading-server-dev

# 또는 npm script 사용
npm run server:pm2:reload
```

## 로그 확인

```bash
# Cron 실행 로그
tail -f logs/cron-reload.log

# PM2 로그
pm2 logs trading-server
```

## Cron 제거

```bash
# crontab 편집
crontab -e

# 또는 명령어로 제거
crontab -l | grep -v 'pm2 reload trading-server' | crontab -
```

## 주의사항

1. **Cluster mode는 CPU 코어 수만큼 프로세스 생성 가능**
   - 현재 설정: instances: 2
   - 서버 사양에 따라 조정 가능

2. **메모리 사용량 증가**
   - 2개 프로세스가 동시 실행되므로 메모리 약 2배 사용
   - `max_memory_restart: '1G'` 설정으로 자동 재시작

3. **WebSocket 연결 주의**
   - Cluster mode에서는 Sticky Session 필요할 수 있음
   - 현재는 각 프로세스가 독립적으로 WebSocket 관리

## 트러블슈팅

### Reload가 작동하지 않는 경우
```bash
# PM2 재시작
pm2 restart trading-server

# 또는 완전 재시작
pm2 stop trading-server
pm2 start ecosystem.config.server.mjs
```

### Cron이 실행되지 않는 경우
```bash
# Cron 서비스 상태 확인 (Linux)
sudo service cron status

# macOS에서는 launchd 사용
# 로그 확인
tail -f logs/cron-reload.log
```
