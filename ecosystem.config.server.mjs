// 서버 프로덕션용 설정 (PORT 5000 고정)
export default {
  apps: [{
    name: 'trading-server',
    script: './dist/server/index.js',
    instances: 2, // 무중단 reload를 위해 2개 이상 필요
    exec_mode: 'cluster',
    // cron_restart는 restart만 지원하므로 제거
    // 무중단 reload는 시스템 cron에서 'pm2 reload trading-server' 사용
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      LOG_LEVEL: 'info',
      ENCRYPTION_KEY: 'kimchi-premium-master-key-2025',
      ENABLE_REAL_TRADING: 'true'
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    // 로그 로테이션 설정
    merge_logs: true,
    max_memory_restart: '1G',
    max_restarts: 10,
    min_uptime: '10s'
  }]
};