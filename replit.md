# replit.md

## Overview

This is a comprehensive cryptocurrency kimchi premium trading application built with a modern full-stack architecture. The application enables automated arbitrage trading based on kimchi premium rates between Korean and international cryptocurrency exchanges (primarily Upbit and Binance). It features real-time data monitoring, automated trading capabilities, risk management, and a sophisticated dashboard interface.

**Recent Update (July 24, 2025)**: 
- **실시간 환율 시스템 구축**: ExchangeRate-API + 업비트 USDT-KRW 대체 환율 사용
- **바이낸스 API 지역 제한 문제 해결**: Replit 서버에서 451 오류, CryptoCompare 대체 API 구축
- **실시간 가격 시스템 완성**: CryptoCompare API로 실시간 바이낸스 선물 가격 대체
- **새로운 김프 자동매매 전략 완성**: 업비트 롱 + 바이낸스 숏 헤지 시스템
- **UI/UX 대폭 개선**: 대시보드는 김프율 모니터링 전용, 자동매매는 별도 페이지로 분리
- **완전한 거래내역 시스템**: 캘린더 기반 일별 거래 조회, 일일 통계, 매매 일지 작성 기능
- **실시간 거래 페이지**: 김프 기회 발견 시 즉시 매매, 실시간 가격 분석, 김프 알림 설정
- **설정 페이지 단순화**: 거래소 API 키 연결만 남기고 거래 설정은 자동매매 페이지로 통합
- **전략 설정 시스템 완성**: 데이터베이스 연동 및 실시간 표시 구현 완료 (July 24, 2025)
- **활성 포지션 실시간 업데이트 완성**: React Query 캐시 문제 해결, 자동매매 시작 시 즉시 포지션 표시 (July 25, 2025)
- **포지션 테이블 UI 개선**: 각 항목별 상세 설명 추가, 버튼 기능 명시, 툴팁 설명 완성 (July 25, 2025)
- **API 연결 문제 확인**: 업비트 IP 제한으로 실시간 가격 업데이트 중단, 한국 서버 이전 필요 (July 25, 2025)
- **자동매매 로직 개선**: 추세 기반 안전한 진입 시스템 구축, 김프 상승 돌파 시에만 진입 (July 25, 2025)  
- **다중 전략 시스템 백엔드 완전 구현**: MultiStrategyKimchiTradingService 클래스 (July 25, 2025)
- **전략별 독립 진입/청산 로직**: 동시 다중 구간 거래 지원, 전략 신호 분석 시스템
- **다중 전략 포지션 관리**: 각 전략별 독립적인 포지션 추적 및 실시간 업데이트
- **전략별 맞춤 알림**: 전략명 기반 진입/청산 알림 시스템 구축
- **데이터베이스 제약 조건 오류 해결**: trading_strategies 테이블 필수 필드 null 값 문제 완전 해결 (July 25, 2025)
- **다중 전략 자동매매 시스템 완전 작동**: MultiStrategyKimchiTradingService 성공적으로 시작, 기본 전략 자동 생성 (July 25, 2025)
- **BTC 단일 포지션 자동매매 완성**: 사용자 설정 기준(-0.4% 진입) BTC 전용 시스템, 모의거래로 안전 작동 (July 25, 2025)
- **24시간 무한루프 자동매매 완성**: 진입→청산→재진입 자동 반복, 사용자 중지 전까지 연속 운영 (July 25, 2025)
- **정확한 수량 계산 시스템**: 1천만원 ÷ 실제 BTC 가격으로 정밀한 포지션 크기 계산 완성 (July 25, 2025)
- **김치프리미엄 로직 수정 완료**: 양수 김프(+1.0% 이상) 진입, +1.5% 청산으로 올바른 차익거래 구현 (July 25, 2025)
- **통합 헷지 전략 완성**: 양수/음수 김프 모두 동일한 헷지 전략(업비트 매수 + 바이낸스 숏) 적용 (July 25, 2025)
- **레버리지 설정 UI 완성**: 양수/음수 전략별 1배~10배 레버리지 선택 기능 추가 (July 25, 2025)
- **투자금액 표시 개선**: 콤마 구분자(10,000,000원 형식) 실시간 표시 완성 (July 25, 2025)
- **🎯 중대한 거래 로직 오류 수정 완료**: 임계값 기반(≤) 거래에서 정확한 값 매칭으로 변경 (July 25, 2025)
- **🎯 정밀한 진입/청산 조건 구현**: 사용자 설정값 ± 허용오차 범위에서만 거래 실행하는 안전 시스템 (July 25, 2025)
- **🎯 24시간 무인 자동매매 완성**: 설정 범위 벗어나면 거래 미실행, 정확한 값에서만 진입/청산 (July 25, 2025)
- **🔐 전체 인증 시스템 통합 완료**: JWT 토큰 기반 로그인/회원가입, 암호화된 API 키 관리, 사용자별 데이터 분리 (August 3, 2025)
- **🔐 보안 강화 시스템 완성**: 개별 사용자 인증, 비밀번호 해싱, API 키 AES 암호화, 사용자별 거래 설정 분리 (August 3, 2025)
- **🔐 배포 준비 완료**: 모든 보안 요구사항 충족, 프로덕션 환경 대응, 완전한 사용자 관리 시스템 구축 (August 3, 2025)
- **한국 서버 배포 권장**: 모든 바이낸스 API 제한 해결 가능

## User Preferences

Preferred communication style: Simple, everyday language.
Trading preference: Real trading preferred over mock trading (July 25, 2025)

**Trading Standards:**
- 업비트 API 실제 가격 사용
- 바이낸스 선물거래소 API 실제 가격 사용  
- 실시간 USD/KRW 환율 (Github Currency API + 다중 백업 소스)
- 김프율 계산: (업비트가격 - 바이낸스선물가격KRW) / 바이낸스선물가격KRW × 100
- **통합 헷지 전략**: 양수/음수 김프 모두 동일한 방식 (업비트 매수 + 바이낸스 숏)
- 양수 김프: +1.1% 진입 → +1.5% 청산
- 음수 김프: -0.4% 진입 → -0.1% 청산  
- 레버리지: 1배~10배 사용자 선택 가능
- 무한 루프: 진입→청산→재진입 24시간 자동 반복

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom dark theme configuration
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live data updates

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API endpoints
- **WebSocket**: Native WebSocket server for real-time data streaming
- **Database**: PostgreSQL with Drizzle ORM for persistent data storage
- **Database Provider**: Replit's PostgreSQL service (replaces previous in-memory storage)
- **API Integration**: Custom services for Upbit and Binance exchanges
- **Session Management**: PostgreSQL-based session storage

### Build and Development
- **Module System**: ESM (ES Modules) throughout the application
- **Development**: tsx for TypeScript execution in development
- **Production Build**: esbuild for server bundling, Vite for client bundling
- **Database Migrations**: Drizzle Kit for schema management

## Key Components

### Database Schema
The application uses a comprehensive PostgreSQL schema with the following main tables:
- **users**: User authentication and management
- **exchanges**: API credentials for different exchanges per user
- **cryptocurrencies**: Supported cryptocurrency symbols and metadata
- **kimchi_premiums**: Historical kimchi premium rate data
- **trading_settings**: User-specific trading configuration
- **positions**: Active and historical trading positions
- **trades**: Individual trade execution records
- **system_alerts**: Application notifications and alerts

### Exchange Services
- **UpbitService**: Korean exchange API integration with authentication
- **BinanceService**: International exchange API integration
- **KimchiService**: Premium calculation and monitoring logic
- **TradingService**: Automated trading execution and position management

### Frontend Components
- **Dashboard**: Main overview with real-time kimchi premium monitoring
- **Trading Controls**: Manual and automated trading interface
- **Position Management**: Active position tracking and management
- **Chart Visualization**: Real-time kimchi premium charts
- **Settings Management**: Trading parameter configuration

## Data Flow

### Real-time Data Pipeline
1. **Data Collection**: Services continuously fetch price data from Upbit and Binance APIs
2. **Premium Calculation**: KimchiService calculates premium rates and USDT/KRW conversion
3. **WebSocket Broadcasting**: Real-time premium data is broadcast to connected clients
4. **Client Updates**: Frontend components automatically update with new data via React Query

### Trading Flow
1. **Signal Generation**: TradingService analyzes premium rates against user settings
2. **Position Management**: Automatic entry/exit based on configured thresholds
3. **Risk Management**: Stop-loss and position size limits enforcement
4. **Trade Execution**: Coordinated buy/sell orders across exchanges
5. **Position Tracking**: Real-time P&L calculation and status updates

### Authentication Flow
1. **User Authentication**: Username/password based authentication
2. **Session Management**: PostgreSQL-stored sessions with connect-pg-simple
3. **API Key Storage**: Encrypted exchange API credentials per user
4. **Authorization**: Route-level protection for user-specific data

## External Dependencies

### Cryptocurrency Exchange APIs
- **Upbit API**: Korean cryptocurrency exchange for KRW markets
- **Binance API**: International exchange for USDT markets
- **Rate Limiting**: Implemented to comply with exchange API limits
- **Error Handling**: Comprehensive error handling for API failures

### Database and Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **WebSocket Server**: Built-in WebSocket support for real-time features
- **Environment Variables**: Secure configuration management for API keys and database credentials

### Third-party Libraries
- **UI Components**: Extensive Radix UI component library
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns for timestamp management
- **Utilities**: Various utility libraries for styling and functionality

## Deployment Strategy

### Development Environment
- **Hot Reload**: Vite development server with HMR
- **TypeScript Checking**: Real-time type checking during development
- **Database Migrations**: Development-time schema synchronization
- **Environment Setup**: Local environment variable configuration

### Production Deployment
- **Build Process**: Separate client and server builds
- **Static Assets**: Client build served as static files
- **Server Bundle**: Single ESM bundle for server deployment
- **Database Migrations**: Production schema deployment via Drizzle Kit
- **Environment Variables**: Production configuration for database and API keys

### Monitoring and Reliability
- **Error Handling**: Comprehensive error boundaries and API error handling
- **Logging**: Structured logging for debugging and monitoring
- **Health Checks**: Basic application health monitoring
- **Session Management**: Persistent session storage for user state

The application is designed for scalability with a clear separation of concerns between data collection, processing, and presentation layers. The real-time nature of cryptocurrency trading is supported through WebSocket connections and efficient state management.