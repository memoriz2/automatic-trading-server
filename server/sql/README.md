# 데이터베이스 초기화 가이드

## 📋 개요

이 디렉토리에는 자동거래 시스템의 데이터베이스 초기화를 위한 통합 SQL 스크립트가 포함되어 있습니다.

## 🚀 빠른 시작

### 1. 데이터베이스 초기화

```bash
# PostgreSQL에 연결 후 실행
psql -U your_username -d your_database -f server/sql/init-database.sql
```

### 2. 또는 psql 내에서 실행

```sql
-- psql 접속 후
\i server/sql/init-database.sql
```

## 📁 파일 구조

```
server/sql/
├── init-database.sql    # 🎯 통합 초기화 스크립트 (이것만 실행하세요!)
└── README.md           # 이 파일
```

## 🎯 init-database.sql 포함 내용

### 1. 기본 설정
- 타임존 설정 (Asia/Seoul)
- 모든 필수 테이블 생성

### 2. 핵심 테이블 (8개)
- `users` - 사용자 관리
- `cryptocurrencies` - 암호화폐 정보
- `exchanges` - 거래소 API 키
- `kimchi_premiums` - 김치 프리미엄 데이터
- `trading_strategies` - 거래 전략
- `trading_settings` - 거래 설정
- `positions` - 포지션 (Mock/Live 통합)
- `trades` - 거래 내역

### 3. 실거래 전용 테이블 (5개)
- `api_keys` - 실거래 API 키 관리
- `real_orders` - 실거래 주문
- `real_positions` - 실거래 포지션
- `real_trades` - 실거래 체결 내역
- `real_daily_stats` - 실거래 일일 통계

### 4. 시스템 테이블 (6개)
- `sessions` - 세션 관리
- `system_alerts` - 시스템 알림
- `performance_stats` - 성능 통계
- `daily_stats` - 일일 통계
- `balance_snapshots` - 잔고 스냅샷
- `exchange_connections` - 거래소 연결 상태

### 5. 관리자 테이블 (2개)
- `admins` - 관리자 권한 관리
- `admin_activity_logs` - 관리자 활동 로그

### 6. 오류 추적 테이블 (4개)
- `trading_errors` - 거래 오류 추적
- `error_notifications` - 오류 알림
- `error_patterns` - 오류 패턴 분석
- `retry_history` - 재시도 히스토리

### 7. 자동화 기능
- 모든 테이블에 성능 최적화 인덱스 자동 생성
- `updated_at` 자동 업데이트 트리거
- 기본 관리자 계정 자동 생성 (admin/admin123!)
- 기본 암호화폐 5개 자동 등록 (BTC, ETH, XRP, ADA, DOT)
- 거래소 연결 상태 초기화

## ⚡ 특징

### ✅ 장점
- **단일 파일**: 모든 스키마가 하나의 파일에 통합
- **멱등성**: 여러 번 실행해도 안전 (`IF NOT EXISTS` 사용)
- **자동화**: 인덱스, 트리거, 초기 데이터 자동 생성
- **완전성**: 모든 필수 테이블과 관계 포함

### 🔧 기술적 특징
- PostgreSQL 전용 최적화
- JSONB 컬럼 활용 (권한, 설정)
- 외래 키 제약 조건 완비
- 성능 최적화된 인덱스

## 🛠️ 사용 시나리오

### 새 환경 설정
```bash
# 1. 새 데이터베이스 생성
createdb trading_system

# 2. 초기화 스크립트 실행
psql -d trading_system -f server/sql/init-database.sql
```

### 기존 환경 업데이트
```bash
# 안전하게 기존 환경에 적용 (멱등성 보장)
psql -d existing_db -f server/sql/init-database.sql
```

## 🔐 기본 관리자 계정

스크립트 실행 후 다음 관리자 계정이 생성됩니다:

- **사용자명**: `admin`
- **비밀번호**: 별도 설정 필요 (해시된 기본값 포함)
- **권한**: `super_admin`

## 📊 생성되는 테이블 수

총 **25개 테이블** 생성:
- 핵심 테이블: 8개 (users, cryptocurrencies, exchanges, kimchi_premiums, trading_strategies, trading_settings, positions, trades)
- 실거래 전용: 5개 (api_keys, real_orders, real_positions, real_trades, real_daily_stats)
- 시스템 관리: 6개 (sessions, system_alerts, performance_stats, daily_stats, balance_snapshots, exchange_connections)
- 관리자: 2개 (admins, admin_activity_logs)
- 오류 추적: 4개 (trading_errors, error_notifications, error_patterns, retry_history)

## 🚨 주의사항

1. **백업 필수**: 기존 데이터베이스가 있다면 백업 후 실행
2. **권한 확인**: 테이블 생성 권한이 있는 사용자로 실행
3. **네트워크**: 데이터베이스 서버 접근 가능한 환경에서 실행

## 🔄 이전 버전에서 마이그레이션

이전에 개별 SQL 파일들을 사용했다면:

```bash
# 기존 파일들은 더 이상 필요하지 않습니다
# init-database.sql 하나로 모든 것이 통합되었습니다
psql -d your_db -f server/sql/init-database.sql
```

---

**✨ 이제 하나의 명령어로 전체 데이터베이스를 초기화할 수 있습니다!**
