import React from 'react';
import { fx, loc } from '@/utils/trading/formatters';

interface TradingHeaderProps {
  serverState: any;
  netOk: boolean;
  errCount: number;
  netMs: number | null;
  onCheckSession: () => void;
  kimp: any;
}

export const TradingHeader: React.FC<TradingHeaderProps> = ({
  serverState,
  netOk,
  errCount,
  netMs,
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
