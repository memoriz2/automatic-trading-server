import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { TRADING_CONSTANTS } from '@/lib/utils';
import { LEVERAGE_CONFIG, parseLeverage } from '@/utils/trading/leverage';
import { formatBTC } from '@/utils/trading/formatters';
import { STRATEGY_DEFAULTS } from '@/config/strategy-defaults';
import { userIdManager } from '@/utils/user-id-manager';
import { markStrategyAsDeleted } from '@/utils/emergency-strategy-restore';

interface Strategy {
  id: string;
  name: string;
  crypto: string;
  entryCondition: string;
  takeProfitCondition: string;
  investmentAmount: string;
  leverage: string;
  tolerance: string;
  riskLevel: string;
  isActive: boolean;
  profitRate: string;
  executionCount: number;
  strategyType?: string;
  toleranceRate?: string;
}

interface StrategyListProps {
  strategies: Strategy[];
  isLoadingStrategies: boolean;
  onStrategyUpdate: (strategies: Strategy[]) => void;
  onStrategyEdit: (strategy: Strategy) => void;
  onCreateNew: () => void;
  fetchJson: (url: string, options?: any) => Promise<any>;
  loadStrategiesFromDB: () => void;
  user?: { id: number };
  effectiveUserId: string;
  isAuthenticated: boolean;
  checkSession: () => void;
  isLoading: boolean;
}

export const StrategyList: React.FC<StrategyListProps> = ({
  strategies,
  isLoadingStrategies,
  onStrategyUpdate,
  onStrategyEdit,
  onCreateNew,
  fetchJson,
  loadStrategiesFromDB,
  user,
  effectiveUserId,
  isAuthenticated,
  checkSession,
  isLoading
}) => {
  const { toast } = useToast();

  const handleStrategyToggle = async (strategy: Strategy) => {
    console.log('🔄 전략 토글 시작:', { strategyId: strategy.id, name: strategy.name, currentState: strategy.isActive });
    
    // 1. 사용자 ID 확립 (localStorage 우선)
    const userId = localStorage.getItem('x-user-id') || effectiveUserId || user?.id;
    if (!userId) {
      console.error('❌ 사용자 ID 없음');
      toast({ title: '오류', description: '사용자 ID를 확인할 수 없습니다.', variant: 'destructive' });
      return;
    }

    const newActiveState = !strategy.isActive;
    console.log('🔄 전략 상태 변경:', { from: strategy.isActive, to: newActiveState });
    
    // 🔒 활성화 시 기존 포지션 확인 (중복 진입 방지)
    if (newActiveState) {
      try {
        const positionsResponse = await fetch('/api/positions', { credentials: 'include' });
        if (positionsResponse.ok) {
          const positions = await positionsResponse.json();
          const activePosition = positions.find((p: any) => 
            p.status === 'open' && 
            p.strategyId === strategy.id && 
            p.symbol === (strategy.crypto || 'BTC')
          );
          
          if (activePosition && activePosition.status === 'open') {
            toast({ 
              title: '포지션 보유 중', 
              description: `이 전략은 현재 포지션을 청산한 후 다시 활성화할 수 있습니다.`,
              variant: 'destructive' 
            });
            return;
          }
        }
      } catch (error) {
        console.error('포지션 확인 실패:', error);
      }
    }

i    // 2. DB에 상태 변경 저장 (실거래 모드)
    try {
      const payload = {
        name: strategy.name,
        strategyType: strategy.strategyType || 'positive_kimchi',
        entryRate: strategy.entryCondition,
        exitRate: strategy.takeProfitCondition,
        toleranceRate: strategy.tolerance || strategy.toleranceRate || '0.05',
        leverage: parseInt(strategy.leverage) || 3,
        investmentAmount: strategy.investmentAmount,
        symbol: strategy.crypto || 'BTC',
        isActive: newActiveState,
        isAutoTrading: newActiveState,
        tolerance: strategy.tolerance || strategy.toleranceRate || '0.05'
      };
      
      console.log('🔄 전략 활성화 상태 변경:', { strategyId: strategy.id, newActiveState, payload });
      
      await fetchJson(`/api/trading-strategies/${strategy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('✅ 전략 상태 변경 DB 저장 성공');
      toast({
        title: newActiveState ? '전략 활성화' : '전략 비활성화',
        description: `${strategy.name} 전략이 ${newActiveState ? '활성화' : '비활성화'}되었습니다.`
      });

      // 3. DB에서 최신 전략 목록 다시 로드 (비동기)
      setTimeout(async () => {
        try {
          console.log('🔄 전략 상태 변경 후 목록 새로고침');
          await loadStrategiesFromDB();
        } catch (error) {
          console.error('❌ 전략 목록 새로고침 실패:', error);
        }
      }, 500); // 0.5초 후 새로고침

    } catch (error) {
      console.error('❌ 전략 상태 변경 DB 저장 실패:', error);
      toast({ 
        title: '전략 상태 변경 실패', 
        description: '서버 저장에 실패했습니다.', 
        variant: 'destructive' 
      });
      return; // 실패 시 UI 업데이트 중단
    }

    // 4. 즉시 UI 업데이트 (낙관적 업데이트)
    const updatedStrategies = strategies.map(s =>
      s.id === strategy.id ? { ...s, isActive: newActiveState } : s
    );
    onStrategyUpdate(updatedStrategies);
  };

  const handleStrategyDelete = async (strategy: Strategy) => {
    // 사용자 ID 확립 (localStorage 우선)
    const userId = localStorage.getItem('x-user-id') || effectiveUserId || user?.id;
    if (!userId) {
      toast({ title: '사용자 ID 확인 불가', variant: 'destructive' });
      return;
    }

    // 1. 활성 포지션 확인 (삭제 방지)
    try {
      const positionKey = `mock-positions-${userId}`;
      const savedPositions = localStorage.getItem(positionKey);
      
      if (savedPositions) {
        const positions = JSON.parse(savedPositions);
        const activePosition = positions.find((p: any) => 
          p.status === 'open' && 
          p.strategyId === strategy.id
        );
        
        if (activePosition) {
          toast({
            title: '전략 삭제 불가',
            description: `이 전략은 활성 포지션이 있어 삭제할 수 없습니다. 먼저 포지션을 청산해주세요.`,
            variant: 'destructive'
          });
          console.warn('⚠️ 활성 포지션으로 인한 전략 삭제 방지:', {
            strategyId: strategy.id,
            strategyName: strategy.name,
            activePositionId: activePosition.id,
            positionStatus: activePosition.status
          });
          return;
        }
      }
    } catch (error) {
      console.error('포지션 확인 실패:', error);
    }

    // 2. 삭제 확인
    if (!confirm(`"${strategy.name || '이름 없는 전략'}" 전략을 정말 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다!`)) {
      return;
    }
    
    // 3. UI에서 즉시 제거
    const updatedStrategies = strategies.filter(s => s.id !== strategy.id);
    onStrategyUpdate(updatedStrategies);
    
    // Mock 모드와 실거래 모드 구분 처리
    const isMockMode = window.location.hostname === 'localhost' || 
                       window.location.hostname.includes('localhost') ||
                       localStorage.getItem('trading-mode') === 'mock' ||
                       !isAuthenticated;
    
    if (isMockMode) {
      // Mock 모드: 로컬스토리지에서 삭제
      try {
        // 🔒 안정적인 사용자 ID 사용 (전략 데이터 손실 방지)
        const stableUserId = userIdManager.getCurrentUserId();
        const storageKey = `mock-strategies-${stableUserId}`;
        // 전략 이름 자동 생성 (빈 이름 방지)
        const strategiesWithNames = updatedStrategies.map(s => ({
          ...s,
          name: s.name || `전략 #${s.id.slice(-4)}`
        }));
        localStorage.setItem(storageKey, JSON.stringify(strategiesWithNames));
        
        // 삭제된 전략 기록 (복원 방지)
        markStrategyAsDeleted(stableUserId, strategy.id);
        
        console.log('🧪 Mock 모드 - 전략 로컬 삭제:', {
          userId,
          storageKey,
          deletedStrategy: strategy.name || `전략 #${strategy.id.slice(-4)}`,
          remainingCount: strategiesWithNames.length
        });
        
        toast({ 
          title: '전략 삭제 완료 (Mock)', 
          description: `${strategy.name || '이름 없는 전략'} 전략이 삭제되었습니다.` 
        });
      } catch (error) {
        console.error('Mock 전략 삭제 실패:', error);
        // 실패 시 롤백
        onStrategyUpdate(strategies);
        toast({ title: '전략 삭제 실패', description: '로컬 저장에 실패했습니다.', variant: 'destructive' });
      }
    } else {
      // 실거래 모드: DB에서 삭제
      try {
        await fetchJson(`/api/trading-strategies/${strategy.id}`, {
          method: 'DELETE'
        });
        
        // 삭제된 전략 기록 (복원 방지)
        markStrategyAsDeleted(effectiveUserId, strategy.id);
        
        console.log('✅ 전략 삭제 성공:', strategy.id);
        toast({ title: '전략 삭제 완료', description: `${strategy.name} 전략이 삭제되었습니다.` });
      } catch (error) {
        console.error('❌ 전략 삭제 실패:', error);
        // 실패 시 UI에 다시 추가 (롤백)
        onStrategyUpdate([...updatedStrategies, strategy]);
        toast({ title: '전략 삭제 실패', description: '서버에서 삭제에 실패했습니다.', variant: 'destructive' });
      }
    }
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">자동매매 전략</h2>
        <div className="flex items-center space-x-2">
          {!isAuthenticated && !isLoading && (
            <button 
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              onClick={checkSession}
            >
              <i className="fas fa-sync-alt mr-2"></i>세션 조회
            </button>
          )}
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            data-testid="button-add-strategy"
            type="button"
            onClick={onCreateNew}
            disabled={!isAuthenticated}
            title={!isAuthenticated ? "로그인 후 사용할 수 있습니다" : ""}
          >
            <i className="fas fa-plus mr-2"></i>새 전략 추가
          </button>
        </div>
      </div>

      {/* 전략 목록 */}
      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2" style={{scrollbarWidth: 'thin', scrollbarColor: '#64748b #1e293b'}}>
        {isLoadingStrategies ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">전략을 불러오는 중...</p>
          </div>
        ) : strategies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="text-4xl">📊</div>
            <div className="text-center">
              <p className="text-sm font-medium">등록된 전략이 없습니다</p>
              <p className="text-xs text-muted-foreground mt-1">새로운 전략을 생성해보세요</p>
            </div>
          </div>
        ) : (
          strategies.map((strategy) => {
            // 각 전략의 활성 포지션 확인
            const hasActivePosition = (() => {
              try {
                const userId = localStorage.getItem('x-user-id') || effectiveUserId;
                const positionKey = `mock-positions-${userId}`;
                const savedPositions = localStorage.getItem(positionKey);
                if (savedPositions) {
                  const positions = JSON.parse(savedPositions);
                  return positions.some((p: any) => 
                    p.status === 'open' && p.strategyId === strategy.id
                  );
                }
              } catch (error) {
                console.error('포지션 확인 실패:', error);
              }
              return false;
            })();

            return (
            <div key={strategy.id} className={`border rounded-lg p-4 transition-colors ${
              hasActivePosition 
                ? 'border-yellow-500 bg-yellow-50/5' // 활성 포지션 있는 전략
                : 'border-border hover:border-primary' // 일반 전략
            }`} data-testid={`card-strategy-${strategy.id}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${strategy.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <h3 className="font-medium" data-testid={`text-strategy-name-${strategy.id}`}>
                    {strategy.name}
                    {hasActivePosition && (
                      <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded-full">
                        포지션 보유
                      </span>
                    )}
                  </h3>
                  
                  <button 
                    type="button" 
                    role="switch" 
                    aria-checked={strategy.isActive} 
                    data-state={strategy.isActive ? "checked" : "unchecked"} 
                    className="peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-400" 
                    data-testid={`switch-status-${strategy.id}`}
                    onClick={() => handleStrategyToggle(strategy)}
                  >
                    <span 
                      data-state={strategy.isActive ? "checked" : "unchecked"} 
                      className="pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
                    ></span>
                  </button>
                  <span className={`text-xs font-medium ${strategy.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {strategy.isActive ? '활성' : '비활성'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-9 rounded-md px-3 ${
                      hasActivePosition 
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed' // 비활성화
                        : 'bg-red-600 text-white hover:bg-red-700' // 활성화
                    }`}
                    data-testid={`button-delete-${strategy.id}`}
                    disabled={hasActivePosition}
                    title={hasActivePosition ? '활성 포지션이 있어 삭제할 수 없습니다' : '전략 삭제'}
                    onClick={() => handleStrategyDelete(strategy)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                      <path d="M18 6 6 18"></path>
                      <path d="m6 6 12 12"></path>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">코인</p>
                  <p className="font-medium" data-testid={`text-crypto-${strategy.id}`}>{strategy.crypto}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">진입 조건 (정확한 일치)</p>
                  <p className="font-medium text-green-500" data-testid={`text-entry-${strategy.id}`}>
                    {parseFloat(Number(strategy.entryCondition).toFixed(3))}% ± {parseFloat(Number(strategy.tolerance || STRATEGY_DEFAULTS.TOLERANCE).toFixed(3))}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">익절 조건 (이상이면 청산)</p>
                  <p className="font-medium text-primary" data-testid={`text-take-profit-${strategy.id}`}>
                    {parseFloat(Number(strategy.takeProfitCondition).toFixed(3))}% ≤ 김프율
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">투자 수량</p>
                  <p className="font-medium" data-testid={`text-amount-${strategy.id}`}>
                    {formatBTC(Number(strategy.investmentAmount || 0))} BTC
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">수익률: </span>
                  <span className="text-green-500 font-medium" data-testid={`text-profit-rate-${strategy.id}`}>{strategy.profitRate}%</span>
                  <span className="text-muted-foreground ml-4">실행 횟수: </span>
                  <span className="font-medium" data-testid={`text-execution-count-${strategy.id}`}>{strategy.executionCount}회</span>
                </div>
                <button 
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3" 
                  data-testid={`button-details-${strategy.id}`}
                  onClick={() => onStrategyEdit(strategy)}
                >
                  상세 보기
                </button>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};
