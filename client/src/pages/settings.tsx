import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
import { apiRequest } from "@/lib/queryClient";
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
  const [selectedExchange, setSelectedExchange] = useState<"upbit" | "binance">(
    "upbit"
  );

  // 인증된 사용자의 ID 사용
  const userId = user?.id;

  // Queries
  const { data: exchanges = [], refetch: refetchExchanges } = useQuery<
    Exchange[]
  >({
    queryKey: [`/api/exchanges/${userId}`],
    enabled: !!userId,
  });

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

  // Exchange Form
  const exchangeForm = useForm({
    resolver: zodResolver(exchangeFormSchema),
    defaultValues: {
      name: "upbit",
      apiKey: "",
      secretKey: "",
    },
  });

  const onSubmitExchange = async (data: z.infer<typeof exchangeFormSchema>) => {
    try {
      await authenticatedApiRequest("/api/exchanges", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast({
        title: "API 키 저장 완료",
        description: `${
          data.name === "upbit" ? "업비트" : "바이낸스"
        } API 키가 저장되었습니다.`,
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
        {/* 거래소 API 키 설정 - 기존 폼 주석 처리 */}
        {/* <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              거래소 API 키 설정
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...exchangeForm}>
              <form
                onSubmit={exchangeForm.handleSubmit(onSubmitExchange)}
                className="space-y-4"
              >
                <FormField
                  control={exchangeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>거래소</FormLabel>
                      <Select
                        onValueChange={field.onChange}
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
                  name="secretKey"
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
                  API 키 저장
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card> */}

        {/* 새로운 API 키 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              거래소 API 키 설정 (새로운 버전)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="exchange-select">거래소</Label>
              <Select
                value={selectedExchange}
                onValueChange={(v) =>
                  setSelectedExchange(v as "upbit" | "binance")
                }
              >
                <SelectTrigger id="exchange-select" className="mt-1">
                  <SelectValue placeholder="거래소를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upbit">업비트 (Upbit)</SelectItem>
                  <SelectItem value="binance">바이낸스 (Binance)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="API 키를 입력하세요"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="secret-key">Secret Key</Label>
              <Input
                id="secret-key"
                type="password"
                placeholder="Secret 키를 입력하세요"
                className="mt-1"
              />
            </div>

            <button
              className="bg-primary"
              onClick={async () => {
                try {
                  // 입력값 가져오기
                  const exchange = selectedExchange;
                  const apiKey = (
                    document.getElementById("api-key") as HTMLInputElement
                  )?.value;
                  const secretKey = (
                    document.getElementById("secret-key") as HTMLInputElement
                  )?.value;

                  if (!apiKey || !secretKey) {
                    toast({
                      title: "입력 오류",
                      description: "API 키와 Secret 키를 모두 입력해주세요.",
                      variant: "destructive",
                    });
                    return;
                  }

                  // 실제 API 키 저장 API 호출
                  const response = await fetch(`/api/exchanges/${userId}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      exchange: exchange,
                      apiKey: apiKey,
                      apiSecret: secretKey,
                    }),
                  });

                  if (response.ok) {
                    // 성공 시 서버 로그
                    await fetch("/api/test-log", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        message: `API 키 저장 성공: ${exchange}`,
                        timestamp: new Date().toISOString(),
                        userId: userId,
                        exchange: exchange,
                      }),
                    });

                    toast({
                      title: "저장 완료",
                      description: `${exchange} API 키가 저장되었습니다.`,
                    });

                    // 입력 필드 초기화
                    (
                      document.getElementById("api-key") as HTMLInputElement
                    ).value = "";
                    (
                      document.getElementById("secret-key") as HTMLInputElement
                    ).value = "";
                  } else {
                    // 실패 시 상세 에러 정보 가져오기
                    const errorData = await response.json().catch(() => ({}));
                    console.error("API 저장 실패 상세:", {
                      status: response.status,
                      statusText: response.statusText,
                      errorData: errorData,
                      responseHeaders: Object.fromEntries(
                        response.headers.entries()
                      ),
                    });

                    // 서버 에러 로그에 상세 정보 전송
                    await fetch("/api/test-log", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        message: `API 저장 실패 상세: ${response.status} ${response.statusText}`,
                        timestamp: new Date().toISOString(),
                        userId: userId,
                        exchange: exchange,
                        errorDetails: {
                          status: response.status,
                          statusText: response.statusText,
                          errorData: errorData,
                          requestBody: {
                            exchange: exchange,
                            apiKey: apiKey.substring(0, 8) + "...",
                            apiSecret: secretKey.substring(0, 8) + "...",
                          },
                        },
                      }),
                    });

                    throw new Error(
                      `API 저장 실패: ${response.status} - ${JSON.stringify(
                        errorData
                      )}`
                    );
                  }
                } catch (error) {
                  // 서버에 에러 로그 전송
                  try {
                    await fetch("/api/test-log", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        message: `API 키 저장 실패: ${error}`,
                        timestamp: new Date().toISOString(),
                        userId: userId,
                        error: error,
                        type: "error",
                      }),
                    });
                  } catch (logError) {
                    // 서버 로그 전송도 실패한 경우는 무시
                  }

                  toast({
                    title: "저장 실패",
                    description: "API 키 저장 중 오류가 발생했습니다.",
                    variant: "destructive",
                  });
                }
              }}
              style={{
                color: "white",
                padding: "12px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                width: "100%",
                fontSize: "16px",
                fontWeight: "bold",
              }}
            >
              API 키 저장
            </button>
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
                      variant={
                        status === "connected" ? "default" : "destructive"
                      }
                    >
                      {status === "connected" ? "연결됨" : "연결 안됨"}
                    </Badge>
                  </div>

                  {balance?.connected && (
                    <div className="text-sm text-gray-600">
                      {balance.krw && (
                        <span>KRW: {balance.krw.toLocaleString()}원</span>
                      )}
                      {balance.usdt && (
                        <span className="ml-2">
                          USDT: {balance.usdt.toFixed(2)}
                        </span>
                      )}
                      {balance.btc && (
                        <span className="ml-2">
                          BTC: {balance.btc.toFixed(6)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
