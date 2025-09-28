import React, { useMemo } from 'react';
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

interface LegacyBandManagerProps {
  bands: Band[];
  serverBands: any[];
  serverStatusBands: any[];
  registeringIndex: number | null;
  unregisteringIndex: number | null;
  onAddBand: () => void;
  onUpdateBand: (index: number, field: keyof Band, value: string | number) => void;
  onRemoveBand: (index: number) => void;
  onRegisterBand: (index: number) => void;
  onUnregisterBand: (index: number) => void;
  onClearBands: () => void;
  onLoadPreset: (preset: string) => void;
}

export const LegacyBandManager = React.memo(({
  bands,
  serverBands,
  serverStatusBands,
  registeringIndex,
  unregisteringIndex,
  onAddBand,
  onUpdateBand,
  onRemoveBand,
  onRegisterBand,
  onUnregisterBand,
  onClearBands,
  onLoadPreset
}: LegacyBandManagerProps) => {

  const bandStats = useMemo(() => ({
    total: bands.length,
    registered: serverBands.length,
    active: serverStatusBands.filter(b => b.status === 'active').length
  }), [bands.length, serverBands.length, serverStatusBands]);

  const presetOptions = useMemo(() => [
    { name: '보수적 (1-3%)', value: 'conservative' },
    { name: '균형 (2-4%)', value: 'balanced' },
    { name: '공격적 (3-5%)', value: 'aggressive' }
  ], []);

  return (
    <div className="bg-slate-800 p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white">밴드 관리</h3>
          <div className="flex gap-2">
            <Badge variant="secondary">총 {bandStats.total}개</Badge>
            <Badge variant={bandStats.active > 0 ? "default" : "secondary"}>
              활성 {bandStats.active}개
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            onChange={(e) => e.target.value && onLoadPreset(e.target.value)}
            className="px-2 py-1 bg-slate-600 text-white rounded text-sm"
            defaultValue=""
          >
            <option value="">프리셋 선택</option>
            {presetOptions.map(preset => (
              <option key={preset.value} value={preset.value}>
                {preset.name}
              </option>
            ))}
          </select>
          <button
            onClick={onAddBand}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            + 밴드 추가
          </button>
          {bands.length > 0 && (
            <button
              onClick={onClearBands}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
            >
              전체 삭제
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {bands.map((band, index) => (
          <BandConfigItem
            key={index}
            band={band}
            index={index}
            isRegistering={registeringIndex === index}
            isUnregistering={unregisteringIndex === index}
            onUpdate={onUpdateBand}
            onRemove={onRemoveBand}
            onRegister={onRegisterBand}
            onUnregister={onUnregisterBand}
          />
        ))}
      </div>

      {bands.length === 0 && (
        <div className="text-center text-slate-400 py-8">
          밴드를 추가하여 자동매매를 설정하세요
        </div>
      )}
    </div>
  );
});

const BandConfigItem = React.memo(({
  band,
  index,
  isRegistering,
  isUnregistering,
  onUpdate,
  onRemove,
  onRegister,
  onUnregister
}: {
  band: Band;
  index: number;
  isRegistering: boolean;
  isUnregistering: boolean;
  onUpdate: (index: number, field: keyof Band, value: string | number) => void;
  onRemove: (index: number) => void;
  onRegister: (index: number) => void;
  onUnregister: (index: number) => void;
}) => {
  return (
    <div className="bg-slate-700 p-3 rounded border">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">밴드명</label>
          <input
            type="text"
            value={band.name || ''}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
            placeholder="밴드명"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">목표 김프 (%)</label>
          <input
            type="number"
            step="0.01"
            value={band.target_kimp || ''}
            onChange={(e) => onUpdate(index, 'target_kimp', e.target.value)}
            className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
            placeholder="2.5"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">청산 김프 (%)</label>
          <input
            type="number"
            step="0.01"
            value={band.exit_kimp || ''}
            onChange={(e) => onUpdate(index, 'exit_kimp', e.target.value)}
            className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
            placeholder="1.5"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">허용오차 (%)</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max="10.0"
            value={band.tolerance || ''}
            onChange={(e) => onUpdate(index, 'tolerance', e.target.value)}
            className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
            placeholder="0.05"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">레버리지</label>
          <input
            type="number"
            step="0.1"
            min="1"
            max="20"
            value={band.leverage || ''}
            onChange={(e) => onUpdate(index, 'leverage', e.target.value)}
            className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
            placeholder="1"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">BTC 수량</label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={band.amount_btc || ''}
            onChange={(e) => onUpdate(index, 'amount_btc', e.target.value)}
            className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
            placeholder="0.01"
          />
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => onRegister(index)}
            disabled={isRegistering}
            className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs flex-1"
          >
            {isRegistering ? '등록중...' : '등록'}
          </button>
          <button
            onClick={() => onRemove(index)}
            className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
});

LegacyBandManager.displayName = 'LegacyBandManager';
BandConfigItem.displayName = 'BandConfigItem';