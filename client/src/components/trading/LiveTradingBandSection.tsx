import React from 'react';
import { Badge } from '@/components/ui/badge';

interface Band {
  name?: string;
  target_kimp?: number | string;
  exit_kimp?: number | string;
  tolerance?: number | string;
  leverage?: number | string;
  amount_btc?: number | string;
  serverId?: string | number;
}

interface LiveTradingBandSectionProps {
  bands: Band[];
  serverBands: any[];
  serverStatusBands: any[];
  kimp: any;
  registeringIndex: number | null;
  unregisteringIndex: number | null;
  bandTbodyRef: React.RefObject<HTMLTableSectionElement>;
  bandRefs: React.MutableRefObject<Array<HTMLTableRowElement | null>>;
  configuredByNameUtil: Map<string, any>;
  statusByIdUtil: Map<string, any>;
  statusByNameUtil: Map<string, any>;
  handleAddBand: () => void;
  handleBandChange: (index: number, key: keyof Band, value: string | number) => void;
  handleDeleteBand: (index: number) => void;
  handleRegisterBand: (index: number) => void;
  handleUnregisterBandAt: (index: number) => void;
  handleSaveBands: () => void;
  handleLoadBands: () => void;
  updatePreviewForRow: (tr: HTMLTableRowElement) => void;
}

export const LiveTradingBandSection: React.FC<LiveTradingBandSectionProps> = ({
  bands,
  serverBands,
  serverStatusBands,
  kimp,
  registeringIndex,
  unregisteringIndex,
  bandTbodyRef,
  bandRefs,
  configuredByNameUtil,
  statusByIdUtil,
  statusByNameUtil,
  handleAddBand,
  handleBandChange,
  handleDeleteBand,
  handleRegisterBand,
  handleUnregisterBandAt,
  handleSaveBands,
  handleLoadBands,
  updatePreviewForRow
}) => {
  const renderBands = (): JSX.Element | JSX.Element[] => {
    if (!bands || bands.length === 0) {
      return <tr><td colSpan={10} className="muted">밴드를 추가하세요</td></tr>;
    }
    return bands.map((b, index) => {
      const configured = b.serverId != null ? undefined : configuredByNameUtil.get(String(b.name || ''));
      const isRegistered = !!(b.serverId != null || configured);
      const runtime = b.serverId != null
        ? statusByIdUtil.get(String(b.serverId))
        : statusByNameUtil.get(String(b.name || ''));
      const stateText: string | undefined = runtime?.state ? String(runtime.state) : (isRegistered ? '대기중' : undefined);
      const stateClass = stateText === 'entered' ? 'good' : (stateText === 'waiting' ? 'warn' : '');
      return (
        <tr key={index} ref={el => {
          bandRefs.current[index] = el;
          if (el) setTimeout(() => updatePreviewForRow(el), 100);
        }}>
          <td>
            <input
              type="text"
              value={b.name || ''}
              placeholder={`B${index + 1}`}
              data-k="name"
              onChange={(e) => handleBandChange(index, 'name', e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              step="0.01"
              value={b.target_kimp || ''}
              data-k="target_kimp"
              onChange={(e) => handleBandChange(index, 'target_kimp', e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              step="0.01"
              value={b.exit_kimp || ''}
              data-k="exit_kimp"
              onChange={(e) => handleBandChange(index, 'exit_kimp', e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              step="0.001"
              value={b.tolerance || ''}
              data-k="tolerance"
              onChange={(e) => handleBandChange(index, 'tolerance', e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              step="1"
              min="1"
              value={b.leverage || ''}
              data-k="leverage"
              onChange={(e) => handleBandChange(index, 'leverage', e.target.value)}
            />
          </td>
          <td>
            <input
              type="number"
              step="0.001"
              value={b.amount_btc || ''}
              data-k="amount_btc"
              onChange={(e) => handleBandChange(index, 'amount_btc', e.target.value)}
            />
          </td>
          <td>
            <div data-size="auto" className="preview-cell">-</div>
          </td>
          <td>
            {stateText && (
              <Badge variant={stateClass === 'good' ? 'default' : stateClass === 'warn' ? 'secondary' : 'outline'}>
                {stateText}
              </Badge>
            )}
          </td>
          <td>
            <div className="flex gap-1">
              {!isRegistered ? (
                <button
                  onClick={() => handleRegisterBand(index)}
                  disabled={registeringIndex === index}
                  className="btn btn-sm btn-primary"
                >
                  {registeringIndex === index ? '등록중...' : '등록'}
                </button>
              ) : (
                <button
                  onClick={() => handleUnregisterBandAt(index)}
                  disabled={unregisteringIndex === index}
                  className="btn btn-sm btn-destructive"
                >
                  {unregisteringIndex === index ? '해제중...' : '해제'}
                </button>
              )}
              <button
                onClick={() => handleDeleteBand(index)}
                className="btn btn-sm btn-destructive"
              >
                삭제
              </button>
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="bg-card rounded-lg p-6 border border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">실시간 자동매매 설정</h3>
        <div className="flex gap-2">
          <button onClick={handleLoadBands} className="btn btn-sm btn-outline">
            불러오기
          </button>
          <button onClick={handleSaveBands} className="btn btn-sm btn-outline">
            저장
          </button>
          <button onClick={handleAddBand} className="btn btn-sm btn-primary">
            밴드 추가
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th>이름</th>
              <th>진입김프(%)</th>
              <th>청산김프(%)</th>
              <th>허용오차</th>
              <th>레버리지</th>
              <th>BTC수량</th>
              <th>미리보기</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody ref={bandTbodyRef} id="band-tbody">
            {renderBands()}
          </tbody>
        </table>
      </div>

      {bands.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          밴드를 추가하여 자동매매를 시작하세요
        </div>
      )}
    </div>
  );
};