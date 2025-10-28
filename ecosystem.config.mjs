// 로컬 개발용 설정 (PORT 5001 고정)
export default {
  apps: [{
    name: 'trading-server-dev',
    script: './server/index.ts',
    interpreter: 'tsx',
    instances: 2, // 무중단 reload를 위해 2개 이상 필요
    exec_mode: 'cluster',
    // cron_restart는 restart만 지원하므로 제거
    // 무중단 reload는 시스템 cron에서 'pm2 reload trading-server-dev' 사용
    env: {
      NODE_ENV: 'development',
      PORT: 5001,
      ENCRYPTION_KEY: 'kimchi-premium-master-key-2025',
      ENABLE_REAL_TRADING: 'false'
    },
    watch: ['server', 'client'],
    ignore_watch: ['node_modules', 'dist', 'logs'],
    log_file: './logs/dev.log',
    out_file: './logs/dev-out.log',
    error_file: './logs/dev-error.log'
  }]
};