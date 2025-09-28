import React from 'react';
import { SessionInfoPanel } from './SessionInfoPanel';

interface SessionInfoSectionProps {
  sessionInfo: any;
  showSessionInfo: boolean;
  setShowSessionInfo: (show: boolean) => void;
  fetchSessionInfo: () => void;
}

export function SessionInfoSection({
  sessionInfo,
  showSessionInfo,
  setShowSessionInfo,
  fetchSessionInfo
}: SessionInfoSectionProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => {
            setShowSessionInfo(!showSessionInfo);
            if (!showSessionInfo && !sessionInfo) {
              fetchSessionInfo();
            }
          }}
          className="px-3 py-1 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors text-sm"
        >
          {showSessionInfo ? '세션 정보 숨기기' : '세션 정보 보기'}
        </button>
      </div>

      {showSessionInfo && sessionInfo && (
        <SessionInfoPanel
          showSessionInfo={showSessionInfo}
          sessionInfo={sessionInfo}
        />
      )}
    </div>
  );
}