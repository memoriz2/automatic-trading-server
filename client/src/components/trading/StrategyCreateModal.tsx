import React from 'react';
import { getInitialStrategy, STRATEGY_DEFAULTS } from '@/config/strategy-defaults';
import { LEVERAGE_CONFIG} from '@/utils/trading/leverage';

interface StrategyCreateModalProps {
  showCreateModal: boolean;
  newStrategy: any;
  setNewStrategy: (strategy: any) => void;
  editingStrategyId: string | null;
  setEditingStrategyId: (id: string | null) => void;
  setShowCreateModal: (show: boolean) => void;
  strategies: any[];
  setStrategies: (strategies: any[]) => void;
  saveStrategiesToLocal: (strategies: any[]) => void;
  effectiveUserId: string;
  toast: any;
}

export const StrategyCreateModal: React.FC<StrategyCreateModalProps> = ({
  showCreateModal,
  newStrategy,
  setNewStrategy,
  editingStrategyId,
  setEditingStrategyId,
  setShowCreateModal,
  strategies,
  setStrategies,
  saveStrategiesToLocal,
  effectiveUserId,
  toast
}) => {
  if (!showCreateModal) return null;

  const handleSaveStrategy = () => {
    try {
      if (!newStrategy.name.trim()) {
        toast({
          title: '오류',
          description: '전략 이름을 입력해주세요.',
          variant: 'destructive'
        });
        return;
      }

      const strategyData = {
        ...newStrategy,
        id: editingStrategyId || `strategy-${Date.now()}`,
        created_at: editingStrategyId ? strategies.find(s => s.id === editingStrategyId)?.created_at : new Date().toISOString()
      };

      let updatedStrategies;
      if (editingStrategyId) {
        updatedStrategies = strategies.map(s => s.id === editingStrategyId ? strategyData : s);
      } else {
        updatedStrategies = [...strategies, strategyData];
      }

      setStrategies(updatedStrategies);
      saveStrategiesToLocal(updatedStrategies);

      toast({
        title: editingStrategyId ? '전략 수정 완료' : '전략 생성 완료',
        description: `${newStrategy.name} 전략이 ${editingStrategyId ? '수정' : '생성'}되었습니다.`
      });

      setShowCreateModal(false);
      setEditingStrategyId(null);
      setNewStrategy(getInitialStrategy());
    } catch (error) {
      console.error('전략 저장 오류:', error);
      toast({
        title: '저장 실패',
        description: '전략 저장 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div
      role="dialog"
      id="radix-:r0:"
      aria-describedby="radix-:r2:"
      aria-labelledby="radix-:r1:"
      data-state="open"
      className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border p-6 shadow-lg rounded-lg"
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '500px',
        backgroundColor: 'var(--background)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        zIndex: 1000
      }}
    >
      <div className="flex flex-col space-y-1.5 text-center sm:text-left">
        <h2 id="radix-:r1:" className="text-lg font-semibold leading-none tracking-tight">
          {editingStrategyId ? '전략 수정' : '새 전략 생성'}
        </h2>
        <p id="radix-:r2:" className="text-sm text-muted-foreground">
          김치프리미엄을 활용한 자동매매 전략을 설정하세요.
        </p>
      </div>

      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="name" className="text-right text-sm font-medium">
            전략명
          </label>
          <input
            id="name"
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newStrategy.name}
            onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
            placeholder="전략 이름"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="crypto" className="text-right text-sm font-medium">
            암호화폐
          </label>
          <select
            id="crypto"
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newStrategy.crypto}
            onChange={(e) => setNewStrategy({ ...newStrategy, crypto: e.target.value })}
          >
            <option value="BTC">비트코인 (BTC)</option>
            <option value="ETH">이더리움 (ETH)</option>
          </select>
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="entryCondition" className="text-right text-sm font-medium">
            진입 조건 (%)
          </label>
          <input
            id="entryCondition"
            type="number"
            step="0.01"
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newStrategy.entryCondition}
            onChange={(e) => setNewStrategy({ ...newStrategy, entryCondition: e.target.value })}
            placeholder="예: 1.5"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="takeProfitCondition" className="text-right text-sm font-medium">
            익절 조건 (%)
          </label>
          <input
            id="takeProfitCondition"
            type="number"
            step="0.01"
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newStrategy.takeProfitCondition}
            onChange={(e) => setNewStrategy({ ...newStrategy, takeProfitCondition: e.target.value })}
            placeholder="예: 0.5"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="investmentAmount" className="text-right text-sm font-medium">
            투자금액 (KRW)
          </label>
          <input
            id="investmentAmount"
            type="number"
            step="1000"
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newStrategy.investmentAmount}
            onChange={(e) => setNewStrategy({ ...newStrategy, investmentAmount: e.target.value })}
            placeholder="예: 100000"
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="leverage" className="text-right text-sm font-medium">
            레버리지
          </label>
          <input
            id="leverage"
            type="number"
            step={LEVERAGE_CONFIG.STEP}
            min={LEVERAGE_CONFIG.MIN}
            max={LEVERAGE_CONFIG.MAX}
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newStrategy.leverage}
            onChange={(e) => setNewStrategy({ ...newStrategy, leverage: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="tolerance" className="text-right text-sm font-medium">
            허용 오차
          </label>
          <input
            id="tolerance"
            type="number"
            step="0.001"
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newStrategy.tolerance}
            onChange={(e) => setNewStrategy({ ...newStrategy, tolerance: e.target.value })}
            placeholder={STRATEGY_DEFAULTS.TOLERANCE}
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4">
          <label htmlFor="riskLevel" className="text-right text-sm font-medium">
            위험 수준
          </label>
          <select
            id="riskLevel"
            className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={newStrategy.riskLevel}
            onChange={(e) => setNewStrategy({ ...newStrategy, riskLevel: e.target.value })}
          >
            <option value="conservative">보수적</option>
            <option value="moderate">보통</option>
            <option value="aggressive">공격적</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="activateImmediately"
            className="rounded border-gray-300"
            checked={newStrategy.activateImmediately}
            onChange={(e) => setNewStrategy({ ...newStrategy, activateImmediately: e.target.checked })}
          />
          <label htmlFor="activateImmediately" className="text-sm font-medium">
            즉시 활성화
          </label>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          onClick={() => {
            setShowCreateModal(false);
            setEditingStrategyId(null);
            setNewStrategy(getInitialStrategy());
          }}
        >
          취소
        </button>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleSaveStrategy}
        >
          {editingStrategyId ? '수정' : '생성'}
        </button>
      </div>
    </div>
  );
};