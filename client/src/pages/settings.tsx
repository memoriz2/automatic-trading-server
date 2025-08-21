import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Key, AlertTriangle, CheckCircle, Settings as SettingsIcon, Copy, Info } from "lucide-react";
import { z } from "zod";
import { useAuth, authenticatedApiRequest } from "@/hooks/useAuth";

// 타입 정의
interface Exchange {
  id: number;
  userId: number;
  name: string;
  apiKey: string;
  secretKey: string;
  isActive: boolean;
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
  name: z.string(),
  apiKey: z.string().min(1, "API 키를 입력해주세요"),
  secretKey: z.string().min(1, "Secret 키를 입력해주세요"),
});

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();

  // 인증된 사용자의 ID 사용
  const userId = user?.id;

  // Queries
  const { data: exchanges = [], refetch: refetchExchanges } = useQuery<Exchange[]>({
    queryKey: [`/api/exchanges/${userId}`],
    enabled: !!userId,
  });

  const { data: balances, refetch: refetchBalances } = useQuery<BalanceInfo>({
    queryKey: [`/api/balances/${userId}`],
    refetchInterval: 30000,
    enabled: !!userId,
  });

  // 서버 정보 조회
  const { data: serverInfo } = useQuery<{ip: string; isReplit: boolean; environment: string}>({
    queryKey: ['/api/server-info'],
  });

  // Exchange Form
  const exchangeForm = useForm({
    resolver: zodResolver(exchangeFormSchema),
    defaultValues: {
      name: "upbit",
      apiKey: "",
      secretKey: ""
    }
  });

  const onSubmitExchange = async (data: z.infer<typeof exchangeFormSchema>) => {
    try {
      await authenticatedApiRequest('/api/exchanges', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      toast({
        title: "API 키 저장 완료",
        description: `${data.name === 'upbit' ? '업비트' : '바이낸스'} API 키가 저장되었습니다.`,
      });
      exchangeForm.reset();
      refetchExchanges();
      refetchBalances();
    } catch (error) {
      toast({
        title: "오류",
        description: "API 키 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const getExchangeStatus = (exchangeName: string) => {
    const exchange = exchanges.find(e => e.name === exchangeName);
    return exchange?.isActive ? 'connected' : 'disconnected';
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
          </CardHeader>
          <CardContent>
            <Form {...exchangeForm}>
              <form onSubmit={exchangeForm.handleSubmit(onSubmitExchange)} className="space-y-4">
                <FormField
                  control={exchangeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>거래소</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="거래소를 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="upbit">업비트 (Upbit)</SelectItem>
                          <SelectItem value="binance">바이낸스 (Binance)</SelectItem>
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
                        <Input {...field} type="password" placeholder="API 키를 입력하세요" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={exchangeForm.control}
                  name="secretKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Key</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Secret 키를 입력하세요" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full">
                  API 키 저장
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
            {['upbit', 'binance'].map((exchangeName) => {
              const status = getExchangeStatus(exchangeName);
              const balance = getBalanceInfo(exchangeName);
              
              return (
                <div key={exchangeName} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="font-medium">
                        {exchangeName === 'upbit' ? '업비트' : '바이낸스'}
                      </span>
                    </div>
                    <Badge variant={status === 'connected' ? 'default' : 'destructive'}>
                      {status === 'connected' ? '연결됨' : '연결 안됨'}
                    </Badge>
                  </div>
                  
                  {balance?.connected && (
                    <div className="text-sm text-gray-600">
                      {balance.krw && <span>KRW: {balance.krw.toLocaleString()}원</span>}
                      {balance.usdt && <span className="ml-2">USDT: {balance.usdt.toFixed(2)}</span>}
                      {balance.btc && <span className="ml-2">BTC: {balance.btc.toFixed(6)}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 서버 정보 */}
        {serverInfo && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                서버 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>서버 IP:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{serverInfo.ip}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(serverInfo.ip)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span>환경:</span>
                <Badge variant={serverInfo.isReplit ? "default" : "secondary"}>
                  {serverInfo.environment}
                </Badge>
              </div>
              {serverInfo.isReplit && (
                <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg mt-4">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  Replit 환경에서는 바이낸스 API 접근에 제한이 있을 수 있습니다. 
                  최적 성능을 위해 네이버 클라우드 플랫폼 배포를 권장합니다.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}