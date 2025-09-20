import React from 'react';
import { fx, loc } from '@/utils/trading/formatters';

interface TradingHeaderProps {
  serverState: any;
  netOk: boolean;
  errCount: number;
  netMs: number | null;
  canUseMock: boolean;
  tradingMode: 'real' | 'mock' | 'live';
  onModeChange: (mode: 'real' | 'mock' | 'live') => void;
  onCheckSession: () => void;
  kimp: any;
}

export const TradingHeader: React.FC<TradingHeaderProps> = ({
  serverState,
  netOk,
  errCount,
  netMs,
  canUseMock,
  tradingMode,
  onModeChange,
  onCheckSession,
  kimp
}) => {
  return (
    <header>
      <div className="nav">
        <div className="brand">
          <div className="logo" aria-hidden="true">₿</div>
          <div>
            김치프리미엄 자동매매<br/>
            <span className="sub">Pro Dashboard+ · Multi-Band + Queue (강제진입 없음)</span>
          </div>
        </div>

        <span id="run-badge" className={`chip ${serverState.running ? 'ok' : ''}`} title="전략 실행 상태">
          <i className={`dot ${serverState.running ? 'ok' : ''}`}></i>
          <span>{serverState.running ? '실행중' : '중지됨'}</span>
        </span>
        <span id="arm-badge" className="chip" title="진입 정책">
          <i className={`dot ${serverState.running ? 'ok' : 'danger'}`}></i>
          <span>정확한 일치 시 자동 대기→진입</span>
        </span>
        <span className="chip" title="수수료 기준">
          <i className="dot ok"></i>추정 비용 ≈ 0.18%p
        </span>
        <span id="net-badge" className="chip" title="네트워크 상태">
          <i className={`dot ${netOk ? 'ok' : (errCount > 0 ? 'warn' : 'danger')}`}></i>
          <span>{netMs != null ? `NET ${netMs}ms` : 'NET …'}</span>
        </span>

        <div className="grow"></div>
        
        {/* Mock/Real 모드 전환 (로컬에서는 모든 유저, 서버에서는 어드민만) */}
        {canUseMock && (
          <div style={{ display: 'flex', gap: '5px', marginRight: '10px' }}>
            <button 
              onClick={() => onModeChange('real')}
              className={`chip ${tradingMode === 'real' ? 'ok' : ''}`}
              style={{ cursor: 'pointer', fontSize: '12px' }}
              title="실거래 모드"
            >
              <i className={`dot ${tradingMode === 'real' ? 'ok' : ''}`}></i>
              <span>실거래</span>
            </button>
            <button 
              onClick={() => onModeChange('mock')}
              className={`chip ${tradingMode === 'mock' ? 'ok' : ''}`}
              style={{ cursor: 'pointer', fontSize: '12px' }}
              title="Mock 거래 모드"
            >
              <i className={`dot ${tradingMode === 'mock' ? 'ok' : ''}`}></i>
              <span>Mock</span>
            </button>
          </div>
        )}
        
        <button 
          onClick={onCheckSession}
          className="chip"
          style={{ cursor: 'pointer', marginRight: '10px' }}
          title="현재 세션 정보 확인"
        >
          <i className="dot ok"></i>
          <span>세션 확인</span>
        </button>
        <span id="kimp-brief" className="kimp-brief mono" aria-live="polite">
          {`김프 ${fx(kimp.kimp, 3)}% · 업비트 ${loc(kimp.upbit_price)} KRW · 바이낸스 $${Math.floor(kimp.binance_price).toLocaleString('en-US')} · 환율 ${fx(kimp.usdkrw, 2)}`}
        </span>
      </div>
    </header>
  );
};
