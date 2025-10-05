// 서버 프로덕션용 설정 (PORT 5000 고정)
export default {
  apps: [{
    name: 'trading-server',
    script: './dist/server/index.js',
    instances: 1,
    exec_mode: 'fork',
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