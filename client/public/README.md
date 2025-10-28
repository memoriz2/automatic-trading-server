# Public Assets

이 폴더는 정적 자산(이미지, 폰트 등)을 위한 폴더입니다.

## 로고 이미지 추가 방법

1. **이미지 파일을 이 폴더에 넣기**
   ```
   public/
   ├── logo.png        # 회사 로고
   ├── logo-dark.png   # 다크 모드용 (선택)
   └── favicon.ico     # 파비콘 (선택)
   ```

2. **코드에서 사용**
   ```tsx
   // 절대 경로로 참조 (public 폴더 기준)
   <img src="/logo.png" alt="Logo" />
   ```

3. **로그인 페이지 Shield 아이콘을 로고로 변경**
   ```tsx
   // client/src/pages/login.tsx 146번 라인
   // 변경 전:
   <Shield className="h-8 w-8 text-white" />

   // 변경 후:
   <img src="/logo.png" alt="에이펙스아비트라지" className="h-8 w-8" />
   ```

## 권장 이미지 사양

- **로고**: PNG (투명 배경) 또는 SVG
- **크기**: 512x512px 이상 (자동으로 축소됨)
- **파일명**: `logo.png`, `logo.svg` 등 간단하게

## 참고

- public 폴더의 파일은 빌드 시 자동으로 dist/public 으로 복사됩니다
- 경로는 항상 `/`로 시작합니다 (예: `/logo.png`)
- 이미지 최적화가 필요하면 src/assets 폴더에 넣고 import하는 방법도 있습니다
