import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";import { logger } from "@/utils/logger";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
  // import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
  // import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Key,
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon,
  Copy,
  Info,
} from "lucide-react";
import { z } from "zod";
import { useAuth, authenticatedApiRequest } from "@/hooks/useAuth";

// 타입 정의
interface Exchange {
  id: number;
  name: string;        // 실제 API 응답에서는 'name' 필드 사용
  isActive: boolean;
  apiKeyStart: string; // API 키 시작 부분 (마스킹된)
  hasApiKey: boolean;  // API 키 보유 여부
  hasApiSecret: boolean; // API 시크릿 보유 여부
}

interface BalanceInfo {
  [exchangeName: string]: {
    connected: boolean;
    krw?: number;
    usdt?: number;
    btc?: number;
  };
}

const exchangeFormSchema = z.object({
  exchange: z.string(),
  apiKey: z.string().min(1, "API 키를 입력해주세요"),
  apiSecret: z.string().min(1, "Secret 키를 입력해주세요"),
});

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedExchange, setSelectedExchange] = useState<"upbit" | "binance">(
    "upbit"
  );

  // 연동 테스트 상태 관리
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null);
  const [overrideConnected, setOverrideConnected] = useState<Record<'upbit'|'binance', boolean>>({ upbit: false, binance: false });

  // 인증된 사용자의 ID 사용
  const userId = user?.id;

  // Queries
  const { data: exchanges = [], refetch: refetchExchanges, isLoading, error } = useQuery<
    Exchange[]
  >({
    queryKey: [`/api/exchanges/${userId}`],
    enabled: !!userId,
  });

  // 디버깅 로그 (개발 환경에서만, 상태 변경 시에만)
  useEffect(() => {
    logger.debug('🔍 [settings.tsx] 쿼리 상태 변경:', {
      userId,
      exchangesCount: exchanges?.length || 0,
      isLoading,
      error: error?.message || null,
      queryKey: `/api/exchanges/${userId}`
    });
  }, [userId, exchanges?.length, isLoading, error]);

  const { data: balances, refetch: refetchBalances } = useQuery<BalanceInfo>({
    queryKey: [`/api/balances/${userId}`],
    refetchInterval: 30000,
    enabled: !!userId,
  });

  // 서버 정보 조회
  const { data: serverInfo } = useQuery<{
    ip: string;
    isReplit: boolean;
    environment: string;
  }>({
    queryKey: ["/api/server-info"],
  });

  // Live status: 서버의 실연동 상태 조회 (연결 뱃지 전용)
  const fetchLiveStatus = async () => {
    const res = await fetch('/api/v2/exchanges/status', {
      credentials: 'include',
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error('status fetch failed');
    return res.json();
  };
  const { data: liveStatus, isLoading: isStatusLoading, refetch: refetchLiveStatus } = useQuery({
    queryKey: ['liveStatus', userId],
    queryFn: fetchLiveStatus,
    staleTime: 15000,
    refetchOnWindowFocus: false,
    enabled: !!userId,
  });

  const isExchangeConnected = useCallback((exchangeName: 'upbit' | 'binance') => {
    // 서버 응답 구조: { exchanges: { upbit: {...}, binance: {...} } }
    const exchangesData = liveStatus?.exchanges;
    const serverConnected = exchangesData?.[exchangeName]?.connected === true;
    
    // DB에 API 키가 저장되어 있는지 확인
    const hasApiKeys = exchanges?.some(ex => 
      ex.name === exchangeName && 
      ex.hasApiKey && 
      ex.hasApiSecret && 
      ex.isActive !== false
    );
    
    // 연동 상태 판단: 서버 연결 상태 OR 수동 오버라이드 OR API 키 존재
    const result = !!(serverConnected || overrideConnected[exchangeName] || hasApiKeys);
    
    return result;
  }, [liveStatus?.exchanges, exchanges, overrideConnected]);
  
  // 연동 상태 변경 시에만 디버그 로그 출력
  useEffect(() => {
    if (exchanges?.length > 0 || liveStatus) {
      const upbitConnected = isExchangeConnected('upbit');
      const binanceConnected = isExchangeConnected('binance');
      
      logger.debug('🔍 [settings] 연동 상태 업데이트:', {
        upbit: {
          connected: upbitConnected,
          serverConnected: liveStatus?.exchanges?.upbit?.connected,
          hasApiKeys: exchanges?.some(ex => ex.name === 'upbit' && ex.hasApiKey && ex.hasApiSecret)
        },
        binance: {
          connected: binanceConnected,
          serverConnected: liveStatus?.exchanges?.binance?.connected,
          hasApiKeys: exchanges?.some(ex => ex.name === 'binance' && ex.hasApiKey && ex.hasApiSecret)
        },
        exchangeCount: exchanges?.length || 0,
        liveStatusLoaded: !!liveStatus
      });
    }
  }, [exchanges?.length, liveStatus?.exchanges?.upbit?.connected, liveStatus?.exchanges?.binance?.connected, isExchangeConnected]);

  // 연동 테스트 함수 (DB에서 기존 API 키 조회)
  const testExchangeConnection = async (exchangeName: string) => {
    console.log('🔍 연동테스트 시작:', exchangeName);
    console.log('📊 현재 exchanges 데이터:', exchanges);
    console.log('👤 현재 userId:', userId, '타입:', typeof userId);
    console.log('📤 전송할 데이터:', { exchange: exchangeName, userId });
    
    // 해당 거래소의 기존 API 키가 있는지 확인
    const existingExchange = exchanges.find(ex => ex.name === exchangeName);
    console.log('🔑 찾은 거래소 데이터:', existingExchange);
    
    // 임시로 API 키 체크를 건너뛰고 바로 서버 테스트 진행
    console.log('🔧 임시 - API 키 체크 건너뛰기');

    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      const response = await authenticatedApiRequest('/api/test-exchange-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          exchange: exchangeName,
          userId: userId
        })
      });
      
      console.log('📥 서버 응답 데이터:', response);
      
      setConnectionTestResult(response);

      if (response.success) {
        setOverrideConnected((prev) => ({ ...prev, [exchangeName]: true }));
        
        // 바이낸스 연동 성공 시 잔고 데이터 새로고침
        if (exchangeName === 'binance' && response.balance) {
          console.log(`🔄 바이낸스 잔고 새로고침: USDT ${response.balance.usdt}`);
          await refetchBalances(); // 잔고 데이터 새로고침
        }
        
        toast({
          title: "연동 테스트 성공! 🎉",
          description: response.message + (response.balance ? ` (USDT: ${response.balance.usdt})` : ""),
          variant: "default"
        });
        // 서버 상태와 exchanges 데이터 모두 새로고침
        await Promise.all([
          refetchLiveStatus(),
          refetchExchanges()
        ]);
      } else {
        setOverrideConnected((prev) => ({ ...prev, [exchangeName]: false }));
        
          // 가이드가 있는 경우 구체적인 해결 방법 표시
          if (response.guide) {
            const guide = response.guide;
            let description = guide.solution;
            
            // IP 관련 오류인 경우 서버 IP 정보 포함
            if (guide.serverIp && guide.serverIp !== '확인 불가') {
              description += `\n\n📍 현재 서버 IP: ${guide.serverIp}`;
            }
            
            toast({
              title: `${guide.title} 💡`,
              description: description,
              variant: "destructive",
              duration: 12000, // 12초 동안 표시 (읽을 시간 충분히 제공)
            });
            
            // 추가 행동 지침이 있는 경우 두 번째 토스트로 표시
            setTimeout(() => {
              toast({
                title: "💡 해결 방법",
                description: guide.actionRequired,
                variant: "default",
                duration: 10000, // 10초로 연장
              });
            }, 2000); // 2초 후 표시
          
        } else {
          // 기존 방식 (가이드가 없는 경우)
          toast({
            title: "연동 테스트 실패 ❌",
            description: `${response.message}: ${response.error}`,
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || '연동 테스트 중 오류가 발생했습니다';
      setConnectionTestResult({
        success: false,
        message: '연동 테스트 실패',
        error: errorMessage
      });
      
      // 서버에서 가이드가 포함된 오류 응답이 있는지 확인
      let responseData = null;
      try {
        if (error.response) {
          responseData = await error.response.json();
        }
      } catch (parseError) {
        // JSON 파싱 실패 시 무시
      }
      
      if (responseData?.guide) {
        const guide = responseData.guide;
        let description = guide.solution;
        
        // IP 관련 오류인 경우 서버 IP 정보 포함
        if (guide.serverIp && guide.serverIp !== '확인 불가') {
          description += `\n\n📍 현재 서버 IP: ${guide.serverIp}`;
        }
        
        toast({
          title: `${guide.title} 💡`,
          description: description,
          variant: "destructive",
          duration: 12000,
        });
        
        // 추가 행동 지침
        setTimeout(() => {
          toast({
            title: "💡 해결 방법",
            description: guide.actionRequired,
            variant: "default",
            duration: 10000,
          });
        }, 2000);
      } else {
        // 기존 방식 (가이드가 없는 경우)
        toast({
          title: "연동 테스트 오류",
          description: errorMessage,
          variant: "destructive"
        });
      }
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Exchange Form
  const exchangeForm = useForm({
    resolver: zodResolver(exchangeFormSchema),
    defaultValues: {
      exchange: "upbit",
      apiKey: "",
      apiSecret: "",
    },
  });

  // 선택된 거래소가 변경될 때 기존 데이터 로드
  useEffect(() => {
    const existingExchange = exchanges.find((e) => e.name === selectedExchange);
    if (existingExchange) {
      // 기존 데이터가 있으면 폼에 미리 채우기 (API 키는 보안상 마스킹)
      exchangeForm.setValue("exchange", selectedExchange);
      exchangeForm.setValue("apiKey", existingExchange.apiKeyStart + "..."); // 시작 부분만 표시
      exchangeForm.setValue("apiSecret", ""); // 보안상 비워둠
    } else {
      // 새로운 거래소면 폼 초기화
      exchangeForm.reset({
        exchange: selectedExchange,
        apiKey: "",
        apiSecret: "",
      });
    }
  }, [selectedExchange, exchanges, exchangeForm]);

  const onSubmitExchange = async (data: z.infer<typeof exchangeFormSchema>) => {
    try {
      // 기존 거래소 데이터 확인
      const existingExchange = exchanges.find((e) => e.name === data.exchange);
      
      if (existingExchange) {
        // 기존 데이터가 있으면 수정 (PUT)
        await authenticatedApiRequest(`/api/v2/exchanges/connect`, {
          method: "POST", // 서버에서 upsert 방식으로 처리
          body: JSON.stringify({
            exchange: data.exchange,
            apiKey: data.apiKey,
            secretKey: data.apiSecret,
          }),
        });
        toast({
          title: "API 키 수정 완료",
          description: `${
            data.exchange === "upbit" ? "업비트" : "바이낸스"
          } API 키가 수정되었습니다.`,
        });
      } else {
        // 새로운 데이터면 생성 (POST)
        await authenticatedApiRequest(`/api/v2/exchanges/connect`, {
          method: "POST",
          body: JSON.stringify({
            exchange: data.exchange,
            apiKey: data.apiKey,
            secretKey: data.apiSecret,
          }),
        });
        toast({
          title: "API 키 저장 완료",
          description: `${
            data.exchange === "upbit" ? "업비트" : "바이낸스"
          } API 키가 저장되었습니다.`,
        });
      }
      
      exchangeForm.reset();
      refetchExchanges();
      
      // 잔고 새로고침 (약간의 지연 후)
      setTimeout(() => {
        refetchBalances();
        refetchLiveStatus();
      }, 1000);
    } catch (error: any) {
      console.error('API 키 저장/수정 오류:', error);
      toast({
        title: "오류",
        description: error?.message || "API 키 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const getExchangeStatus = (exchangeName: string) => {
    const exchange = exchanges.find((e) => e.name === exchangeName);
    return exchange?.isActive ? "connected" : "disconnected";
  };

  const getBalanceInfo = (exchangeName: string) => {
    if (!balances) return null;
    return balances[exchangeName];
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">설정</h1>
      </div>

      <div className="space-y-6">
        {/* 거래소 API 키 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              거래소 API 키 설정
            </CardTitle>
            <CardDescription>
              {exchanges.find((e) => e.name === selectedExchange) 
                ? "기존 API 키를 수정합니다. 보안을 위해 새로운 키를 입력해주세요."
                : "거래소 API 키를 등록하여 자동 거래를 시작하세요."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...exchangeForm}>
              <form
                onSubmit={exchangeForm.handleSubmit(onSubmitExchange)}
                className="space-y-4"
              >
                <FormField
                  control={exchangeForm.control}
                  name="exchange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>거래소</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedExchange(value as "upbit" | "binance");
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="거래소를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="upbit">업비트 (Upbit)</SelectItem>
                          <SelectItem value="binance">
                            바이낸스 (Binance)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={exchangeForm.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="API 키를 입력하세요"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={exchangeForm.control}
                  name="apiSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Key</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder="Secret 키를 입력하세요"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  {exchanges.find((e) => e.name === selectedExchange) 
                    ? "API 키 수정" 
                    : "API 키 저장"
                  }
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>


        {/* 거래소 연결 상태 */}
        <Card>
          <CardHeader>
            <CardTitle>거래소 연결 상태</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {["upbit", "binance"].map((exchangeName) => {
              const status = getExchangeStatus(exchangeName);
              const balance = getBalanceInfo(exchangeName);

              return (
                <div
                  key={exchangeName}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          status === "connected" ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span className="font-medium">
                        {exchangeName === "upbit" ? "업비트" : "바이낸스"}
                      </span>
                    </div>
                    <Badge
                      variant={isExchangeConnected(exchangeName as 'upbit' | 'binance') ? "default" : "destructive"}
                    >
                      {isStatusLoading ? "확인 중…" : isExchangeConnected(exchangeName as 'upbit' | 'binance') ? "연결됨" : "연결 안됨"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* 연동 테스트 결과에서 잔고 표시 */}
                    {connectionTestResult && connectionTestResult.success && (
                      <div className="text-sm text-gray-600">
                        {exchangeName === 'upbit' && connectionTestResult.details?.balance && (
                          <span>{connectionTestResult.details.balance}</span>
                        )}
                        {exchangeName === 'binance' && connectionTestResult.balance?.usdt && (
                          <span>USDT: {Number(connectionTestResult.balance.usdt).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                        )}
                      </div>
                    )}
                    
                    {/* 기본 잔고 데이터 (연동 테스트 결과가 없을 때) */}
                    {!connectionTestResult && balance && (
                      <div className="text-sm text-gray-600">
                        {balance.krw != null && (
                          <span>KRW: {Number(balance.krw).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}원</span>
                        )}
                        {balance.usdt != null && (
                          <span className="ml-2">
                            USDT: {Number(balance.usdt).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                          </span>
                        )}
                        {balance.btc != null && (
                          <span className="ml-2">
                            BTC: {Math.floor(Number(balance.btc) * 1000) / 1000}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* 연동테스트 버튼 */}
                    <Button
                      onClick={async () => { await testExchangeConnection(exchangeName); await refetchLiveStatus(); }}
                      disabled={isTestingConnection}
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                    >
                      {isTestingConnection ? '테스트 중...' : '🔗 연동테스트'}
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {/* 연동 테스트 결과 표시 */}
            {connectionTestResult && (
              <div className={`p-3 rounded-md border ${
                connectionTestResult.success 
                  ? 'bg-green-950/50 border-green-600 text-green-200' 
                  : 'bg-red-950/50 border-red-600 text-red-200'
              }`}>
                <div className="font-medium">
                  {connectionTestResult.success ? '✅' : '❌'} {connectionTestResult.message}
                </div>

                {connectionTestResult.error && (
                  <div className="text-sm mt-1 opacity-80">
                    오류: {connectionTestResult.error}
                  </div>
                )}

                  {connectionTestResult.details && (
                    <div className="text-sm mt-1 opacity-80">
                      상세: {JSON.stringify(connectionTestResult.details)}
                      {connectionTestResult.balance && (
                        <span className="ml-2 text-blue-300">
                          USDT: {Math.floor(Number(connectionTestResult.balance.usdt))}
                        </span>
                      )}
                    </div>
                  )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
