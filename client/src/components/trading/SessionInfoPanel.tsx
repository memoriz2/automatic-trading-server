import React from 'react';

interface SessionInfoPanelProps {
  showSessionInfo: boolean;
  sessionInfo: any;
}

export const SessionInfoPanel: React.FC<SessionInfoPanelProps> = ({
  showSessionInfo,
  sessionInfo
}) => {
  if (!showSessionInfo) return null;

  return (
    <section style={{gridColumn: 'span 12', marginBottom: '20px'}}>
      <div className="card" style={{padding: '15px', backgroundColor: sessionInfo ? '#e8f5e8' : '#ffe8e8'}}>
        <h3 style={{margin: '0 0 10px 0', color: sessionInfo ? '#2d5a2d' : '#8b0000'}}>
          세션 정보
        </h3>
        {sessionInfo ? (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '14px'}}>
            <div>
              <strong>로그인 상태:</strong> <span style={{color: '#2d5a2d'}}>활성</span>
            </div>
            <div>
              <strong>사용자명:</strong> {sessionInfo.username}
            </div>
            <div>
              <strong>권한:</strong> {sessionInfo.role}
            </div>
            <div>
              <strong>사용자 ID:</strong> {sessionInfo.id}
            </div>
          </div>
        ) : (
          <div style={{textAlign: 'center', color: '#8b0000'}}>
            <strong>로그인 상태: 비활성</strong><br/>
            <small>로그인이 필요합니다</small>
          </div>
        )}
      </div>
    </section>
  );
};
