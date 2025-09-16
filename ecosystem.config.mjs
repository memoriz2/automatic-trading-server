// 로컬 개발용 설정 (PORT 5001 고정)
export default {
  apps: [{
    name: 'trading-server-dev',
    script: './server/index.ts',
    interpreter: 'tsx',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'development',
      PORT: 5001,
      ENCRYPTION_KEY: 'kimchi-premium-master-key-2025'
    },
    watch: ['server', 'client'],
    ignore_watch: ['node_modules', 'dist', 'logs'],
    log_file: './logs/dev.log',
    out_file: './logs/dev-out.log',
    error_file: './logs/dev-error.log'
  }]
};