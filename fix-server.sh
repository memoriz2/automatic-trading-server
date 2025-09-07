#!/bin/bash

echo "🔧 서버 TypeScript 오류 수정 스크립트"
echo "====================================="

cd /root/automatic-trading1

echo "1. 기존 파일 정리..."
rm -rf generated dist

echo "2. tsconfig.server.json 수정..."
cat > tsconfig.server.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "rootDir": ".",
    "outDir": "dist/server"
  },
  "include": ["server/**/*.ts"],
  "exclude": ["node_modules", "dist", "client"]
}
EOF

echo "3. import 경로 수정..."
# server/db.ts
sed -i 's|from "\./generated/prisma"|from "../../generated/prisma"|g' server/db.ts

# server/services/new-kimchi-trading.ts
sed -i 's|from "\.\./generated/prisma"|from "../../../generated/prisma"|g' server/services/new-kimchi-trading.ts

# server/storage.ts
sed -i 's|from "\./generated/prisma"|from "../../generated/prisma"|g' server/storage.ts

echo "4. server/index.ts import 수정..."
sed -i "s|from './vite.ts'|from './vite'|g" server/index.ts

echo "5. Prisma 심볼릭 링크 생성..."
rm -f prisma
ln -sf server/prisma prisma

echo "6. Prisma 클라이언트 생성..."
npx prisma generate

echo "7. 서버 빌드..."
npm run build:server

echo "8. 빌드 결과 확인..."
ls -la dist/server/

echo "✅ 서버 수정 완료!"
echo ""
echo "이제 다음 명령어로 실행:"
echo "npm run server:pm2:start"
echo "npm run server:pm2:logs"
