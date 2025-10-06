import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, AlertTriangle } from 'lucide-react';
import { LEVERAGE_CONFIG, parseLeverage, validateLeverage} from '@/utils/trading/leverage';
import { formatBTC } from '@/utils/trading/formatters';
import { useToast } from '@/hooks/use-toast';

interface ForceEntrySettings {
  margin: string;           // 증거금 (KRW)
  leverage: string;         // 레버리지
  investmentAmount: string; // 투자수량 (BTC)
}

interface ForceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKimp: number;
  onForceEntry: (settings: ForceEntrySettings) => void;
  isLiveMode: boolean;
}

const STORAGE_KEY = 'force-entry-settings';

export const ForceEntryModal: React.FC<ForceEntryModalProps> = React.memo(({
  isOpen,
  onClose,
  currentKimp,
  onForceEntry,
  isLiveMode
}) => {
  const { toast } = useToast();
  
  // 강제진입 설정 상태 (로컬스토리지에서 복원)
  const [settings, setSettings] = useState<ForceEntrySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const investment = parsed.investmentAmount || '0.003';
        const leverage = parsed.leverage || String(LEVERAGE_CONFIG.DEFAULT);
        
        // 투자수량과 레버리지로 증거금 계산
        const btcPrice = 156000000; // 기본 BTC 가격
        const calculatedMargin = Math.round(parseFloat(investment) * parseLeverage(leverage) * btcPrice);
        
        return {
          margin: String(calculatedMargin),
          leverage: leverage,
          investmentAmount: formatBTC(parseFloat(investment))
        };
      }
    } catch (error) {
      console.warn('강제진입 설정 로드 실패:', error);
    }
    
    // 기본값 - 투자수량 기준으로 증거금 계산
    const defaultInvestment = '0.003';
    const defaultLeverage = LEVERAGE_CONFIG.DEFAULT;
    const btcPrice = 156000000;
    const calculatedMargin = Math.round(parseFloat(defaultInvestment) * defaultLeverage * btcPrice);
    
    return {
      margin: String(calculatedMargin),
      leverage: String(defaultLeverage),
      investmentAmount: formatBTC(parseFloat(defaultInvestment))
    };
  });

  // 설정 변경 시 로컬스토리지에 저장
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('강제진입 설정 저장 실패:', error);
    }
  }, [settings]);

  // 투자수량 변경 시 증거금 자동 계산
  const handleInvestmentChange = (investmentValue: string) => {
    const investment = parseFloat(investmentValue) || 0.003;
    const leverage = parseLeverage(settings.leverage);
    const btcPrice = currentKimp ? (currentKimp > 0 ? 156000000 : 112000 * 1390) : 156000000; // 김프에 따른 BTC 가격
    const calculatedMargin = Math.round(investment * leverage * btcPrice);
    
    // 입력값을 formatBTC로 정리해서 저장
    const formattedInvestment = formatBTC(investment);
    
    setSettings(prev => ({
      ...prev,
      investmentAmount: formattedInvestment,
      margin: String(calculatedMargin)
    }));
  };

  // 레버리지 변경 시 증거금 자동 계산
  const handleLeverageChange = (leverageValue: string) => {
    const leverage = parseLeverage(leverageValue);
    const investment = parseFloat(settings.investmentAmount) || 0.003;
    const btcPrice = currentKimp ? (currentKimp > 0 ? 156000000 : 112000 * 1390) : 156000000;
    const calculatedMargin = Math.round(investment * leverage * btcPrice);
    
    // 투자수량도 다시 포맷팅해서 정리
    const formattedInvestment = formatBTC(investment);
    
    setSettings(prev => ({
      ...prev,
      leverage: leverageValue,
      investmentAmount: formattedInvestment,
      margin: String(calculatedMargin)
    }));
  };

  // 강제진입 실행
  const handleExecuteEntry = () => {
    const leverageValidation = validateLeverage(parseLeverage(settings.leverage));
    if (!leverageValidation.isValid) {
      toast({
        title: '레버리지 오류',
        description: leverageValidation.message,
        variant: 'destructive'
      });
      return;
    }

    const margin = parseFloat(settings.margin);
    const investmentAmount = parseFloat(settings.investmentAmount);
    
    if (margin <= 0 || investmentAmount <= 0) {
      toast({
        title: '입력 오류',
        description: '증거금과 투자수량은 0보다 커야 합니다.',
        variant: 'destructive'
      });
      return;
    }

    // 강제진입 실행
    onForceEntry(settings);
    
    toast({
      title: '강제진입 실행',
      description: `김프 ${currentKimp.toFixed(3)}%에서 ${investmentAmount} BTC 진입`,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <Card className="relative z-10 w-full max-w-md mx-4 bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              강제진입 설정
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={isLiveMode ? "destructive" : "secondary"}>
              {isLiveMode ? '실거래 모드' : 'Mock 모드'}
            </Badge>
            <Badge variant="outline" className={currentKimp > 0 ? 'text-green-600' : 'text-red-600'}>
              현재 김프: {currentKimp.toFixed(3)}%
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 경고 메시지 */}
          {isLiveMode && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800">실거래 모드 경고</p>
                <p className="text-red-600 mt-1">실제 자금으로 거래가 실행됩니다. 신중하게 설정해주세요.</p>
              </div>
            </div>
          )}

          {/* 설정 입력 폼 */}
          <div className="space-y-4">
            {/* 투자수량 입력 (메인 설정) */}
            <div>
              <Label htmlFor="investment" className="text-sm font-medium">
                투자수량 (BTC) ⭐
              </Label>
              <Input
                id="investment"
                type="number"
                min="0.001"
                step="0.001"
                value={settings.investmentAmount}
                onChange={(e) => handleInvestmentChange(e.target.value)}
                placeholder="0.003"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formatBTC(parseFloat(settings.investmentAmount || '0'))} BTC
              </p>
            </div>

            {/* 레버리지 입력 */}
            <div>
              <Label htmlFor="leverage" className="text-sm font-medium">
                레버리지 (배)
              </Label>
              <Input
                id="leverage"
                type="number"
                min={LEVERAGE_CONFIG.MIN}
                max={LEVERAGE_CONFIG.MAX}
                step={LEVERAGE_CONFIG.STEP}
                value={settings.leverage}
                onChange={(e) => handleLeverageChange(e.target.value)}
                placeholder={String(LEVERAGE_CONFIG.DEFAULT)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {LEVERAGE_CONFIG.MIN}배 ~ {LEVERAGE_CONFIG.MAX}배
              </p>
            </div>

            {/* 증거금 (자동 계산됨) */}
            <div>
              <Label htmlFor="margin" className="text-sm font-medium">
                필요 증거금 (KRW) 📊
              </Label>
              <Input
                id="margin"
                type="text"
                value={`₩${Math.floor(parseFloat(settings.margin || '0')).toLocaleString()}`}
                readOnly
                className="mt-1 bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground mt-1">
                투자수량 × 레버리지 × BTC가격으로 자동 계산
              </p>
            </div>
          </div>

          {/* 계산된 정보 표시 */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-3">📊 계산된 진입 정보</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">진입 김프율</p>
                <p className="font-medium text-primary">{currentKimp.toFixed(3)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">예상 익절점</p>
                <p className="font-medium text-green-500">{Math.max(0.1, currentKimp + 0.5).toFixed(3)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">투자 수량</p>
                <p className="font-medium text-blue-500">{formatBTC(parseFloat(settings.investmentAmount || '0'))} BTC</p>
              </div>
              <div>
                <p className="text-muted-foreground">실효 레버리지</p>
                <p className="font-medium text-orange-500">{parseLeverage(settings.leverage)}배</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">필요 증거금</p>
                <p className="font-bold text-lg text-red-500">₩{Math.floor(parseFloat(settings.margin || '0')).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* 실행 버튼들 */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={handleExecuteEntry}
                className="flex-1"
                variant={isLiveMode ? "destructive" : "default"}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                강제진입 실행
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6"
              >
                닫기
              </Button>
            </div>
            
            {/* 연속 진입 안내 */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                💡 모달을 열어둔 채로 <strong>강제진입 실행</strong> 버튼을 여러 번 눌러서 연속 진입이 가능합니다
              </p>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="text-xs text-muted-foreground text-center">
            설정은 로컬스토리지에 자동 저장되며, 브라우저 데이터 삭제 전까지 영구 보관됩니다.
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
