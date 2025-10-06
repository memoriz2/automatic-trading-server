import React from 'react';
import { Band } from '@/hooks/useBandManagement';

interface BandConfigurationSectionProps {
  bands: Band[];
  registeringIndex: number | null;
  unregisteringIndex: number | null;
  onAddBand: () => void;
  onUpdateBand: (index: number, field: keyof Band, value: string | number) => void;
  onRemoveBand: (index: number) => void;
  onRegisterBand: (index: number) => void;
  onUnregisterBand: (index: number) => void;
}

export function BandConfigurationSection({
  bands,
  registeringIndex,
  onAddBand,
  onUpdateBand,
  onRemoveBand,
  onRegisterBand
}: BandConfigurationSectionProps) {
  return (
    <div className="bg-slate-800 p-4 rounded-lg mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">밴드 설정</h3>
        <button
          onClick={onAddBand}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
        >
          + 밴드 추가
        </button>
      </div>

      <div className="space-y-3">
        {bands.map((band, index) => (
          <div key={index} className="bg-slate-700 p-3 rounded border">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
              <div>
                <label className="block text-xs text-slate-400 mb-1">밴드명</label>
                <input
                  type="text"
                  value={band.name || ''}
                  onChange={(e) => onUpdateBand(index, 'name', e.target.value)}
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
                  onChange={(e) => onUpdateBand(index, 'target_kimp', e.target.value)}
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
                  onChange={(e) => onUpdateBand(index, 'exit_kimp', e.target.value)}
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
                  onChange={(e) => onUpdateBand(index, 'tolerance', e.target.value)}
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
                  onChange={(e) => onUpdateBand(index, 'leverage', e.target.value)}
                  className="w-full px-2 py-1 bg-slate-600 text-white rounded text-sm"
                  placeholder="1"
                />
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => onRegisterBand(index)}
                  disabled={registeringIndex === index}
                  className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs flex-1"
                >
                  {registeringIndex === index ? '등록중...' : '등록'}
                </button>
                <button
                  onClick={() => onRemoveBand(index)}
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {bands.length === 0 && (
        <div className="text-center text-slate-400 py-8">
          밴드를 추가하여 자동매매를 설정하세요
        </div>
      )}
    </div>
  );
}