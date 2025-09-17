import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X, Shield, AlertTriangle, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RollbackSettings {
  autoRollbackEnabled: boolean;
  highRiskThreshold: number;
  mediumRiskThreshold: number;
  tolerance: number;
  autoExecuteDelay: number;
}

interface RollbackSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'rollback-settings';

export const RollbackSettingsModal: React.FC<RollbackSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  
  // 롤백 설정 상태
  const [settings, setSettings] = useState<RollbackSettings>({
    autoRollbackEnabled: true,
    highRiskThreshold: 80,
    mediumRiskThreshold: 50,
    tolerance: 0.001,
    autoExecuteDelay: 3000
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 서버에서 설정 로드
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/rollback/settings', { 
        credentials: 'include' 
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSettings(result.settings);
          // 로컬스토리지에도 저장
          localStorage.setItem(STORAGE_KEY, JSON.stringify(result.settings));
        }
      }
    } catch (error) {
      console.error('롤백 설정 로드 실패:', error);
      // 로컬스토리지에서 복원 시도
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setSettings(JSON.parse(saved));
        }
      } catch (storageError) {
        console.error('로컬스토리지 복원 실패:', storageError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 설정 저장
  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      // 유효성 검증
      if (settings.highRiskThreshold <= settings.mediumRiskThreshold) {
        toast({
          title: "설정 오류",
          description: "HIGH 리스크 임계값은 MEDIUM 리스크 임계값보다 커야 합니다",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch('/api/rollback/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // 로컬스토리지에도 저장
          localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
          
          toast({
            title: "설정 저장 완료",
            description: "롤백 설정이 성공적으로 저장되었습니다",
          });
          
          onClose();
        } else {
          throw new Error(result.error || '설정 저장 실패');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      console.error('롤백 설정 저장 실패:', error);
      toast({
        title: "설정 저장 실패",
        description: error.message || '설정 저장 중 오류가 발생했습니다',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 기본값 복원
  const resetToDefault = () => {
    setSettings({
      autoRollbackEnabled: true,
      highRiskThreshold: 80,
      mediumRiskThreshold: 50,
      tolerance: 0.001,
      autoExecuteDelay: 3000
    });
    toast({
      title: "기본값 복원",
      description: "설정이 기본값으로 복원되었습니다",
    });
  };

  // 컴포넌트 마운트 시 설정 로드
  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 bg-slate-900 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            🛡️ 자동 롤백 설정
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 현재 기준 설명 */}
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">📋 롤백 기준 설명</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-600 text-white">80% 이상</Badge>
                <span className="text-slate-300">HIGH 리스크 → 🚨 자동 롤백 실행</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-600 text-white">50% ~ 80%</Badge>
                <span className="text-slate-300">MEDIUM 리스크 → ⚠️ 경고만 표시</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white">50% 미만</Badge>
                <span className="text-slate-300">LOW 리스크 → ✅ 정상 유지</span>
              </div>
              <div className="text-xs text-slate-400 mt-2">
                * 불균형 비율 = (바이낸스 포지션 - 업비트 현물) ÷ 바이낸스 포지션 × 100
              </div>
            </div>
          </div>

          {/* 설정 폼 */}
          <div className="space-y-4">
            {/* 자동 롤백 활성화 */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-slate-300 font-medium">자동 롤백 활성화</Label>
                <p className="text-xs text-slate-400">체크 해제 시 수동으로만 롤백 가능</p>
              </div>
              <Switch
                checked={settings.autoRollbackEnabled}
                onCheckedChange={(checked) => 
                  setSettings(prev => ({ ...prev, autoRollbackEnabled: checked }))
                }
              />
            </div>

            {/* 임계값 설정 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="highRisk" className="text-slate-300">HIGH 리스크 임계값 (%)</Label>
                <Input
                  id="highRisk"
                  type="number"
                  min="10"
                  max="100"
                  step="5"
                  value={settings.highRiskThreshold}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      highRiskThreshold: Math.max(10, Math.min(100, parseInt(e.target.value) || 80))
                    }))
                  }
                  className="bg-slate-800 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">이 값 이상 시 자동 롤백</p>
              </div>
              
              <div>
                <Label htmlFor="mediumRisk" className="text-slate-300">MEDIUM 리스크 임계값 (%)</Label>
                <Input
                  id="mediumRisk"
                  type="number"
                  min="5"
                  max="99"
                  step="5"
                  value={settings.mediumRiskThreshold}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      mediumRiskThreshold: Math.max(5, Math.min(99, parseInt(e.target.value) || 50))
                    }))
                  }
                  className="bg-slate-800 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">이 값 이상 시 경고 표시</p>
              </div>
            </div>

            {/* 고급 설정 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tolerance" className="text-slate-300">허용 오차 (BTC)</Label>
                <Input
                  id="tolerance"
                  type="number"
                  min="0.0001"
                  max="1"
                  step="0.0001"
                  value={settings.tolerance}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      tolerance: Math.max(0.0001, Math.min(1, parseFloat(e.target.value) || 0.001))
                    }))
                  }
                  className="bg-slate-800 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">이 값 이하는 무시</p>
              </div>
              
              <div>
                <Label htmlFor="delay" className="text-slate-300">자동 실행 지연 (초)</Label>
                <Input
                  id="delay"
                  type="number"
                  min="1"
                  max="30"
                  step="1"
                  value={settings.autoExecuteDelay / 1000}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      autoExecuteDelay: Math.max(1000, Math.min(30000, parseInt(e.target.value) * 1000 || 3000))
                    }))
                  }
                  className="bg-slate-800 border-slate-600 text-white"
                />
                <p className="text-xs text-slate-400 mt-1">주문 후 체크 지연 시간</p>
              </div>
            </div>
          </div>

          {/* 경고 메시지 */}
          {!settings.autoRollbackEnabled && (
            <div className="bg-orange-900/20 border border-orange-600 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">경고: 자동 롤백이 비활성화되었습니다</span>
              </div>
              <p className="text-xs text-orange-300 mt-1">
                불균형 포지션 발생 시 수동으로 롤백해야 합니다
              </p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={resetToDefault}
              className="border-slate-600 text-slate-300 hover:text-white"
            >
              🔧 기본값 복원
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-slate-600 text-slate-300 hover:text-white"
              >
                취소
              </Button>
              <Button
                onClick={saveSettings}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? '저장 중...' : '💾 설정 저장'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
