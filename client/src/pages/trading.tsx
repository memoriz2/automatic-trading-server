import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Activity, 
  DollarSign, 
  AlertTriangle,
  Target,
  Timer
} from "lucide-react";
import type { KimchiPremium } from "@/types/trading";
import { apiRequest } from "@/lib/queryClient";

export default function Trading() {
  const [kimchiData, setKimchiData] = useState<KimchiPremium[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC');
  const [orderAmount, setOrderAmount] = useState<string>('100000');
  const [isOrderPending, setIsOrderPending] = useState(false);
  const { toast } = useToast();
  
  // WebSocket으로 실시간 김프 데이터 수신
  const { isConnected, lastMessage } = useWebSocket();

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'kimchi-premium') {
      setKimchiData(lastMessage.data || []);
    }
  }, [lastMessage]);

  // 선택된 심볼의 김프 데이터
  const selectedCrypto = kimchiData.find(item => item.symbol === selectedSymbol);

  // 즉시 주문 실행
  const executeQuickOrder = async (type: 'buy' | 'sell') => {
    if (!selectedCrypto) return;
    
    setIsOrderPending(true);
    try {
      await apiRequest('POST', '/api/trades/quick-order', {
        symbol: selectedSymbol,
        type,
        amount: parseInt(orderAmount),
        premiumRate: selectedCrypto.premiumRate
      });
      
      toast({
        title: "주문 실행 완료",
        description: `${selectedSymbol} ${type === 'buy' ? '매수' : '매도'} 주문이 실행되었습니다.`,
      });
    } catch (error: any) {
      toast({
        title: "주문 실행 실패",
        description: error?.message || "주문 실행 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsOrderPending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">실시간 거래</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? '실시간 연결됨' : '연결 끊김'}
            </span>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 실시간 김프율 모니터링 */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-850 border-slate-700 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  실시간 김프율 모니터링
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kimchiData.map((crypto) => (
                    <div 
                      key={crypto.symbol}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedSymbol === crypto.symbol 
                          ? 'border-blue-500 bg-blue-500/10' 
                          : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                      }`}
                      onClick={() => setSelectedSymbol(crypto.symbol)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-semibold">{crypto.symbol}</h3>
                        <Badge 
                          variant={crypto.premiumRate >= 0 ? "default" : "destructive"}
                          className={crypto.premiumRate >= 0 ? "bg-green-600" : "bg-red-600"}
                        >
                          {crypto.premiumRate >= 0 ? '+' : ''}{crypto.premiumRate.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-400">
                          업비트: {crypto.upbitPrice.toLocaleString()}원
                        </p>
                        <p className="text-sm text-slate-400">
                          바이낸스: {crypto.binancePrice.toLocaleString()}원
                        </p>
                        {crypto.premiumRate >= 1.0 && (
                          <div className="flex items-center text-yellow-400 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            김프 기회
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 선택된 코인 상세 정보 */}
            {selectedCrypto && (
              <Card className="bg-slate-850 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    {selectedCrypto.symbol} 상세 정보
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-slate-800 rounded-lg">
                      <p className="text-slate-400 text-sm">김프율</p>
                      <p className={`text-xl font-bold ${
                        selectedCrypto.premiumRate >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedCrypto.premiumRate >= 0 ? '+' : ''}
                        {selectedCrypto.premiumRate.toFixed(2)}%
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-800 rounded-lg">
                      <p className="text-slate-400 text-sm">업비트 가격</p>
                      <p className="text-xl font-bold text-white">
                        {selectedCrypto.upbitPrice.toLocaleString()}원
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-800 rounded-lg">
                      <p className="text-slate-400 text-sm">바이낸스 가격</p>
                      <p className="text-xl font-bold text-white">
                        {selectedCrypto.binancePrice.toLocaleString()}원
                      </p>
                    </div>
                    <div className="text-center p-4 bg-slate-800 rounded-lg">
                      <p className="text-slate-400 text-sm">환율</p>
                      <p className="text-xl font-bold text-white">
                        {selectedCrypto.exchangeRate?.toFixed(2) || '0'}원
                      </p>
                    </div>
                  </div>

                  {/* 가격 차이 분석 */}
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <h4 className="text-white font-semibold mb-2">가격 차이 분석</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">절대 가격 차이</span>
                        <span className="text-white font-mono">
                          {Math.abs(selectedCrypto.upbitPrice - selectedCrypto.binancePrice).toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">100만원 기준 차익</span>
                        <span className={`font-mono ${
                          selectedCrypto.premiumRate >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {selectedCrypto.premiumRate >= 0 ? '+' : ''}
                          {(1000000 * selectedCrypto.premiumRate / 100).toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 빠른 주문 패널 */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-850 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  빠른 주문
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">선택된 코인</Label>
                  <div className="text-white font-semibold text-lg">{selectedSymbol}</div>
                </div>

                <div>
                  <Label htmlFor="orderAmount" className="text-slate-300">주문 금액 (원)</Label>
                  <Input
                    id="orderAmount"
                    type="number"
                    value={orderAmount}
                    onChange={(e) => setOrderAmount(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="100000"
                  />
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => executeQuickOrder('buy')}
                    disabled={isOrderPending || !selectedCrypto}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {isOrderPending ? '주문 중...' : '즉시 매수'}
                  </Button>
                  
                  <Button
                    onClick={() => executeQuickOrder('sell')}
                    disabled={isOrderPending || !selectedCrypto}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-600"
                  >
                    <TrendingDown className="w-4 h-4 mr-2" />
                    {isOrderPending ? '주문 중...' : '즉시 매도'}
                  </Button>
                </div>

                {selectedCrypto && (
                  <div className="p-3 bg-slate-800 rounded-lg">
                    <p className="text-slate-400 text-sm mb-1">예상 수익률</p>
                    <p className={`font-bold ${
                      selectedCrypto.premiumRate >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedCrypto.premiumRate >= 0 ? '+' : ''}
                      {selectedCrypto.premiumRate.toFixed(2)}%
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 김프 알림 설정 */}
            <Card className="bg-slate-850 border-slate-700 mt-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Timer className="w-5 h-5 mr-2" />
                  김프 알림 설정
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">알림 김프율 (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    defaultValue="1.0"
                    className="bg-slate-800 border-slate-600 text-white"
                    placeholder="1.0"
                  />
                </div>
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                  알림 설정
                </Button>
                
                <div className="text-center">
                  <p className="text-slate-400 text-sm">
                    김프율이 설정값을 초과하면<br />
                    즉시 알림을 받습니다
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
