import React from 'react';

interface TradingLogPanelProps {
  logs: string;
  logRef: React.RefObject<HTMLDivElement>;
}

export const TradingLogPanel: React.FC<TradingLogPanelProps> = ({
  logs,
  logRef
}) => {
  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold">실시간 로그</h3>
      </div>
      <div className="p-4">
        <div
          ref={logRef}
          className="bg-black text-green-400 font-mono text-xs p-4 rounded overflow-auto h-96 whitespace-pre-wrap"
          style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
        >
          {logs || '로그 로딩 중...'}
        </div>
      </div>
    </div>
  );
};