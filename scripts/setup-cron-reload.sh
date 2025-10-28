#!/bin/bash

# 매일 정오 12시에 PM2 무중단 reload 실행하는 cron 설정 스크립트

echo "🔧 PM2 무중단 reload cron 설정 중..."

# 현재 디렉토리 절대 경로
PROJECT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

# PM2 경로 찾기
PM2_PATH=$(which pm2)

if [ -z "$PM2_PATH" ]; then
  echo "❌ PM2를 찾을 수 없습니다. PM2를 먼저 설치해주세요."
  echo "   npm install -g pm2"
  exit 1
fi

echo "✅ PM2 경로: $PM2_PATH"
echo "✅ 프로젝트 경로: $PROJECT_DIR"

# crontab 라인 생성
CRON_LINE="0 12 * * * cd $PROJECT_DIR && $PM2_PATH reload trading-server >> $PROJECT_DIR/logs/cron-reload.log 2>&1"

# 기존 crontab 백업
crontab -l > /tmp/crontab.backup 2>/dev/null || true

# 이미 등록된 항목이 있는지 확인
if crontab -l 2>/dev/null | grep -q "pm2 reload trading-server"; then
  echo "⚠️  이미 cron에 등록되어 있습니다. 기존 항목을 제거하고 다시 추가합니다."
  crontab -l 2>/dev/null | grep -v "pm2 reload trading-server" | crontab -
fi

# crontab에 추가
(crontab -l 2>/dev/null; echo "$CRON_LINE") | crontab -

echo ""
echo "✅ Cron 설정 완료!"
echo ""
echo "📋 등록된 cron 내용:"
echo "   $CRON_LINE"
echo ""
echo "🕐 실행 시간: 매일 정오 12시"
echo "📝 로그 위치: $PROJECT_DIR/logs/cron-reload.log"
echo ""
echo "현재 등록된 crontab:"
crontab -l
echo ""
echo "💡 Cron 제거 방법:"
echo "   crontab -e 로 편집기 열어서 해당 라인 삭제"
echo "   또는: crontab -l | grep -v 'pm2 reload trading-server' | crontab -"
