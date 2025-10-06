import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
  // import { Label } from "@/components/ui/label";
import { BalanceDisplay } from "@/components/balance-display";
import { PositionsTable } from "@/components/positions-table";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { formatKoreanTime } from '@/utils/datetime';
import {
  Play,
  Pause,
  Settings,
  Activity,
  Wifi,
  WifiOff,
  StopCircle,
  Lightbulb,
  BarChart3,
  Target,
  TrendingUp,
  Clock,
} from "lucide-react";
import type { Position } from "@/types/trading";
import { apiRequest, apiFetchJson } from "@/lib/queryClient";
import { useAuth, authenticatedApiRequest } from "@/hooks/useAuth";

// kimpga 호환 타입
type KimpData = {
  kimp: number | null;
  upbit_price: number | null;
  binance_price: number | null;
  usdkrw: number | null;
};
type KimpgaStatus = {
  running: boolean;
  position_state: string;
  trade_count: number;
  logs?: string[];
};
type KimpgaMetrics = {
  loops: number;
  orders_binance: number;
  orders_upbit: number;
  api_errors: number;
};

export default function AutoTrading() {
  const [newKimchiActive, setNewKimchiActive] = useState(false);
  const [isTouched, setIsTouched] = useState(false); // 사용자 입력 추적 상태
  const { isConnected } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // 세션 조회 관련 상태
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [showSessionInfo, setShowSessionInfo] = useState(false);

  // 인증된 사용자의 ID 사용
  const userId = user?.id;

  // kimpga 호환 상태
  const [tick, setTick] = useState(0);
  const { data: kimp, isLoading: loadingKimp } = useQuery<KimpData>({
    queryKey: ["/api/kimpga/current", tick],
    queryFn: async () => {
      const r = await fetch("/api/kimpga/current");
      if (!r.ok) throw new Error("current_kimp failed");
      return r.json();
    },
    refetchInterval: 30000, // 30초마다 조회 (API 제한으로 인한 조정)
  });
  const { data: kimpgaStatus, refetch: refetchKimpgaStatus } =
    useQuery<KimpgaStatus>({
      queryKey: ["/api/kimpga/status", tick],
      queryFn: async () => {
        const r = await fetch("/api/kimpga/status");
        if (!r.ok) throw new Error("status failed");
        return r.json();
      },
      refetchInterval: 30000, // 30초마다 조회 (API 제한으로 인한 조정)
    });
  const { data: kimpgaMetrics } = useQuery<KimpgaMetrics>({
    queryKey: ["/api/kimpga/metrics", tick],
    queryFn: async () => {
      const r = await fetch("/api/kimpga/metrics");
      if (!r.ok) throw new Error("metrics failed");
      return r.json();
    },
    refetchInterval: 30000, // 30초마다 조회 (API 제한으로 인한 조정)
  });

  // kimpga 제어
  const kimpgaStart = async () => {
    await fetch("/api/kimpga/start", { method: "POST" }).catch(() => {});
    refetchKimpgaStatus();
  };
  const kimpgaStop = async () => {
    await fetch("/api/kimpga/stop", { method: "POST" }).catch(() => {});
    refetchKimpgaStatus();
  };
  const kimpgaForceExit = async () => {
    await fetch("/api/kimpga/force-exit", { method: "POST" }).catch(() => {});
    refetchKimpgaStatus();
  };

  // sparkline
  const [spark, setSpark] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (typeof kimp?.kimp === "number" && isFinite(kimp.kimp)) {
      setSpark((prev) => {
        const next = [...prev, Number(kimp.kimp) as number];
        if (next.length > 180) next.shift();
        return next;
      });
    }
  }, [kimp?.kimp]);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || spark.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth || 300;
    const h = c.clientHeight || 60;
    if (c.width !== w * dpr) c.width = w * dpr;
    if (c.height !== h * dpr) c.height = h * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const min = Math.min(...spark);
    const max = Math.max(...spark);
    const pad = 6;
    const span = Math.max(1e-9, max - min);
    // area
    ctx.beginPath();
    spark.forEach((v, i) => {
      const x = pad + ((w - 2 * pad) * i) / Math.max(1, spark.length - 1);
      const y = h - pad - ((h - 2 * pad) * (v - min)) / span;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(w - pad, h - pad);
    ctx.lineTo(pad, h - pad);
    ctx.closePath();
    ctx.fillStyle = "rgba(122,162,255,0.10)";
    ctx.fill();
    // line
    ctx.beginPath();
    spark.forEach((v, i) => {
      const x = pad + ((w - 2 * pad) * i) / Math.max(1, spark.length - 1);
      const y = h - pad - ((h - 2 * pad) * (v - min)) / span;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#7aa2ff";
    ctx.stroke();
  }, [spark]);

  // 설정값 기반 단순 매매 설정
  const [config, setConfig] = useState({
    entryRate: 0, // 진입 김프율
    exitRate: 0, // 청산 김프율
    tolerance: 0, // 허용오차
    leverage: 0, // 레버리지
    amount: 0, // 투자금액
  });

  // 멀티 밴드 설정
  interface TradingBand {
    id: string;
    name: string;
    entryRate: number;
    exitRate: number;
    tolerance: number;
    leverage: number;
    amount: number;
    isActive: boolean;
  }

  const [bands, setBands] = useState<TradingBand[]>([]);

  // 밴드 추가 함수
  const addBand = () => {
    const newBand: TradingBand = {
      id: `band-${Date.now()}`,
      name: `밴드 ${bands.length + 1}`,
      entryRate: 3.0,
      exitRate: 2.0,
      tolerance: 0.1,
      leverage: 1,
      amount: 0.01,
      isActive: false,
    };
    setBands(prev => [...prev, newBand]);
  };

  // 밴드 삭제 함수
  const deleteBand = (id: string) => {
    setBands(prev => prev.filter(band => band.id !== id));
  };

  // 밴드 업데이트 함수
  const updateBand = (id: string, field: keyof TradingBand, value: any) => {
    setBands(prev => prev.map(band => 
      band.id === id ? { ...band, [field]: value } : band
    ));
  };

  // 로컬 저장 함수
  const saveBandsToLocal = () => {
    localStorage.setItem('trading-bands', JSON.stringify(bands));
    toast({
      title: "설정 저장",
      description: `${bands.length}개 밴드가 로컬에 저장되었습니다.`,
    });
  };

  // 로컬 불러오기 함수
  const loadBandsFromLocal = () => {
    try {
      const saved = localStorage.getItem('trading-bands');
      if (saved) {
        const loadedBands = JSON.parse(saved);
        setBands(loadedBands);
        toast({
          title: "설정 불러오기",
          description: `${loadedBands.length}개 밴드를 불러왔습니다.`,
        });
      }
    } catch (error) {
      toast({
        title: "불러오기 실패",
        description: "저장된 설정을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  // Queries
  const { data: positions = [], refetch: refetchPositions } = useQuery<
    Position[]
  >({
    queryKey: ["/api/positions", userId],
    refetchInterval: 30000, // 30초마다 조회 (API 제한으로 인한 조정) // 1초마다 포지션 업데이트
    staleTime: 0, // 항상 fresh하게 처리
    gcTime: 0, // 캐시 무효화 (TanStack Query v5)
    enabled: !!userId,
  });

  const { data: tradingStatus } = useQuery({
    queryKey: ["/api/trading/status"],
    refetchInterval: 30000, // 30초마다 조회 (API 제한으로 인한 조정)
  });

  // 서버 저장된 거래 설정 불러와 폼 초기값 세팅
  const { data: serverSettings } = useQuery({
    queryKey: ["/api/trading-settings", userId],
    queryFn: async () => {
      const r = await authenticatedApiRequest(
        `/api/trading-settings/${userId}`,
        {
          method: "GET",
        }
      );
      if (!r.ok) throw new Error("settings fetch failed");
      return r.json();
    },
    enabled: !!userId,
    staleTime: 0,
  });

  useEffect(() => {
    // 사용자가 아직 값을 변경하지 않았고, 서버 설정값이 있을 때만 초기화
    if (serverSettings && !isTouched) {
      setConfig({
        entryRate: Number(serverSettings.kimchiEntryRate) || 0,
        exitRate: Number(serverSettings.kimchiExitRate) || 0,
        tolerance: Number(serverSettings.kimchiToleranceRate) || 0,
        leverage: Number(serverSettings.binanceLeverage) || 1,
        amount: Number(serverSettings.upbitEntryAmount) || 100000,
      });
    }
  }, [serverSettings, isTouched]);

  // Update trading status
  useEffect(() => {
    if (tradingStatus && typeof tradingStatus === "object") {
      if ("newKimchiActive" in tradingStatus) {
        setNewKimchiActive(tradingStatus.newKimchiActive as boolean);
      }
    }
  }, [tradingStatus]);

  // 설정값 기반 자동매매 시작
  const startTradingMutation = useMutation({
    mutationFn: async () => {
      const traceId = `start-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      console.log(`[TRACE ${traceId}] 시작 버튼 클릭: 현재 config`, config);

      if (!userId) {
        throw new Error(
          "로그인 정보가 유효하지 않습니다. 다시 로그인 후 시도하세요."
        );
      }
      // 입력값 검증
      if (config.amount === 0) {
        throw new Error("투자금액을 입력하세요.");
      }
      if (config.leverage === 0) {
        throw new Error("레버리지를 1배 이상 설정하세요.");
      }

      // 1. 기존 설정 조회 후 병합하여 전체 스키마로 저장 (서버는 전체 필드 요구)
      console.log(`[TRACE ${traceId}] GET /api/trading-settings/${userId}`);
      const current = await authenticatedApiRequest(
        `/api/trading-settings/${userId}`,
        { method: "GET", headers: { "X-Trace-Id": traceId } }
      );
      console.log(`[TRACE ${traceId}] 현재 서버 저장값`, current);
      const payload = {
        userId: Number(userId),
        entryPremiumRate: (current.entryPremiumRate ?? "2.5").toString(),
        exitPremiumRate: (current.exitPremiumRate ?? "1.0").toString(),
        stopLossRate: (current.stopLossRate ?? "-1.5").toString(),
        maxPositions: Number(current.maxPositions ?? 5),
        isAutoTrading: Boolean(current.isAutoTrading ?? false),
        maxInvestmentAmount: (
          current.maxInvestmentAmount ?? "1000000"
        ).toString(),
        // 오버라이드 값들
        kimchiEntryRate: config.entryRate.toString(),
        kimchiExitRate: config.exitRate.toString(),
        kimchiToleranceRate: config.tolerance.toString(),
        binanceLeverage: Number(config.leverage),
        upbitEntryAmount: config.amount.toString(),
      };

      console.log(
        `[TRACE ${traceId}] PUT /api/trading-settings/${userId} payload`,
        payload
      );
      const settingsSaved = await authenticatedApiRequest(
        `/api/trading-settings/${userId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "X-Trace-Id": traceId },
        }
      );
      console.log(`[TRACE ${traceId}] 설정 저장 응답`, settingsSaved);

      // 2. 자동매매 시작
      console.log(`[TRACE ${traceId}] POST /api/trading/start/${userId}`);
      const startRes = await authenticatedApiRequest(
        `/api/trading/start/${userId}`,
        {
          method: "POST",
          headers: { "X-Trace-Id": traceId },
        }
      );
      console.log(`[TRACE ${traceId}] 시작 응답`, startRes);
      return startRes;
    },
    onSuccess: () => {
      toast({
        title: "자동매매 시작",
        description: `진입 ${config.entryRate}% → 청산 ${config.exitRate}% 활성화`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "시작 실패",
        description: error.message || "자동매매 시작에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 자동매매 중지
  const stopTradingMutation = useMutation({
    mutationFn: async () => {
      return await authenticatedApiRequest(`/api/trading/stop/${userId}`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      toast({
        title: "자동매매 중지",
        description: "안전하게 중지되었습니다.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "중지 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEmergencyStop = async () => {
    try {
      await authenticatedApiRequest(`/api/trading/emergency-stop/${userId}`, {
        method: "POST",
      });
      toast({
        title: "긴급 정지",
        description: "모든 거래가 중단되었습니다.",
        variant: "destructive",
      });
      refetchPositions();
    } catch (error) {
      toast({
        title: "오류",
        description: "긴급 정지 실행 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleCheckSession = async () => {
    try {
      const data = await apiFetchJson('/api/auth/me', { method: 'GET' });

      setSessionInfo(data);
      setShowSessionInfo(true);
      toast({
        title: "세션 조회 성공",
        description: `현재 로그인된 사용자: ${data.username}`,
      });
    } catch (error: any) {
      setSessionInfo(null);
      setShowSessionInfo(true);
      toast({
        title: "세션 없음",
        description: "현재 로그인된 사용자가 없거나 인증이 만료되었습니다",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Lightbulb className="w-7 h-7 text-yellow-400" />
              설정값 기반 자동매매
            </h2>
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              ></div>
              <span
                className={`text-sm ${
                  isConnected ? "text-green-400" : "text-red-400"
                }`}
              >
                {isConnected ? "실시간 연결됨" : "연결 끊김"}
              </span>
              {isConnected ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <BalanceDisplay />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckSession}
              className="text-white border-white hover:bg-white hover:text-slate-900"
            >
              세션 확인
            </Button>
            <Button
              variant="destructive"
              onClick={handleEmergencyStop}
              className="bg-red-600 hover:bg-red-700"
            >
              <StopCircle className="w-4 h-4 mr-2" />
              긴급 정지
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 space-y-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        
        {/* 세션 정보 표시 */}
        {showSessionInfo && (
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                세션 정보
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionInfo ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">로그인 상태</div>
                    <div className="font-bold text-green-600 dark:text-green-400">활성</div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">사용자명</div>
                    <div className="font-bold">{sessionInfo.username}</div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">권한</div>
                    <div className="font-bold">{sessionInfo.role}</div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">사용자 ID</div>
                    <div className="font-bold">{sessionInfo.id}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-red-600 dark:text-red-400 font-bold">로그인 상태: 비활성</div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm mt-1">로그인이 필요합니다</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {/* 설정값 기반 단순 자동매매 컨트롤 */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              설정값 기반 자동매매 제어
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 멀티 밴드 전략 설정 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">전략 설정 (멀티 밴드)</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={addBand}>
                    밴드 추가
                  </Button>
                  <Button variant="outline" size="sm" onClick={saveBandsToLocal}>
                    설정 저장(로컬)
                  </Button>
                  <Button variant="outline" size="sm" onClick={loadBandsFromLocal}>
                    불러오기
                  </Button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 dark:border-slate-600">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                      <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left min-w-[90px]">이름</th>
                      <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left min-w-[120px]">진입 김프율(%)</th>
                      <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left min-w-[120px]">청산 김프율(%)</th>
                      <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left min-w-[120px]">허용오차(%)</th>
                      <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left min-w-[120px]">레버리지</th>
                      <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left min-w-[150px]">투자수량(BTC)</th>
                      <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left min-w-[220px]">미리보기 (Upbit KRW / Binance USDT) 수수료 포함</th>
                      <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left min-w-[130px]">상태</th>
                      <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left min-w-[220px]">서버</th>
                      <th className="border border-slate-300 dark:border-slate-600 px-3 py-2 text-left min-w-[80px]">삭제</th>
                    </tr>
                  </thead>
                  <tbody id="band-tbody">
                    {bands.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="border border-slate-300 dark:border-slate-600 px-3 py-4 text-center text-slate-500 dark:text-slate-400">
                          밴드를 추가하세요
                        </td>
                      </tr>
                    ) : (
                      bands.map((band) => (
                        <tr key={band.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                          <td className="border border-slate-300 dark:border-slate-600 px-2 py-2">
                            <Input
                              value={band.name}
                              onChange={(e) => updateBand(band.id, 'name', e.target.value)}
                              className="w-full text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 dark:border-slate-600 px-2 py-2">
                            <Input
                              type="number"
                              step="0.1"
                              value={band.entryRate}
                              onChange={(e) => updateBand(band.id, 'entryRate', Number(e.target.value))}
                              className="w-full text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 dark:border-slate-600 px-2 py-2">
                            <Input
                              type="number"
                              step="0.1"
                              value={band.exitRate}
                              onChange={(e) => updateBand(band.id, 'exitRate', Number(e.target.value))}
                              className="w-full text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 dark:border-slate-600 px-2 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={band.tolerance}
                              onChange={(e) => updateBand(band.id, 'tolerance', Number(e.target.value))}
                              className="w-full text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 dark:border-slate-600 px-2 py-2">
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={band.leverage}
                              onChange={(e) => updateBand(band.id, 'leverage', Number(e.target.value))}
                              className="w-full text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 dark:border-slate-600 px-2 py-2">
                            <Input
                              type="number"
                              step="0.001"
                              value={band.amount}
                              onChange={(e) => updateBand(band.id, 'amount', Number(e.target.value))}
                              className="w-full text-xs"
                            />
                          </td>
                          <td className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-xs">
                            <div className="space-y-1">
                              <div>업비트: ₩{(band.amount * (kimp?.upbit_price || 156000000)).toLocaleString()}</div>
                              <div>바이낸스: ${(band.amount * (kimp?.binance_price || 112000) * band.leverage).toFixed(2)}</div>
                              <div className="text-slate-500">수수료: ~0.1%</div>
                            </div>
                          </td>
                          <td className="border border-slate-300 dark:border-slate-600 px-2 py-2">
                            <Badge variant={band.isActive ? "default" : "secondary"} className="text-xs">
                              {band.isActive ? "활성" : "비활성"}
                            </Badge>
                          </td>
                          <td className="border border-slate-300 dark:border-slate-600 px-2 py-2 text-xs">
                            <div className="space-y-1">
                              <div>진입: {band.entryRate - band.tolerance}% ~ {band.entryRate + band.tolerance}%</div>
                              <div>청산: {band.exitRate}%</div>
                              <div>현재: {kimp?.kimp?.toFixed(3) || '0.000'}%</div>
                            </div>
                          </td>
                          <td className="border border-slate-300 dark:border-slate-600 px-2 py-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteBand(band.id)}
                              className="w-full text-xs"
                            >
                              삭제
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="flex gap-4 mt-4">
                <Button id="btn-start" className="bg-green-600 hover:bg-green-700">
                  ▶ 전략 시작
                </Button>
                <Button variant="secondary" id="btn-stop" disabled>
                  ■ 전략 중지
                </Button>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ※ 이 UI는 <strong>강제 진입이 없습니다.</strong> 각 밴드는 <strong>entry_kimp±tolerance</strong> 범위에 <strong>도달하면 자동 진입</strong>, 이후 <strong>exit_kimp</strong> 등 조건 충족 시 자동 청산됩니다.
                </p>
              </div>
            </div>


            {/* 자동매매 시작/중지 버튼 */}
            <div className="flex flex-col gap-4">
              {!newKimchiActive ? (
                <Button
                  onClick={() => startTradingMutation.mutate()}
                  disabled={startTradingMutation.isPending}
                  className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                >
                  <Play className="w-6 h-6 mr-3" />
                  {startTradingMutation.isPending
                    ? "시작 중..."
                    : "설정값 기반 자동매매 시작"}
                </Button>
              ) : (
                <Button
                  onClick={() => stopTradingMutation.mutate()}
                  disabled={stopTradingMutation.isPending}
                  variant="destructive"
                  className="w-full h-16 text-xl font-bold"
                >
                  <Pause className="w-6 h-6 mr-3" />
                  {stopTradingMutation.isPending
                    ? "중지 중..."
                    : "자동매매 중지"}
                </Button>
              )}

              {/* 현재 상태 표시 */}
              {newKimchiActive && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      설정값 기반 자동매매 실행 중
                    </span>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse animation-delay-200"></div>
                  </div>
                  <div className="text-center text-sm text-green-600 dark:text-green-400">
                    진입 {config.entryRate}% → 청산 {config.exitRate}% |
                    투자금액 {config.amount.toLocaleString()}원 | 레버리지{" "}
                    {config.leverage}배
                  </div>
                </div>
              )}

              {/* 자동매매 실시간 상태 */}
              <TradingStatusCard
                newKimchiActive={newKimchiActive}
                config={config}
              />
            </div>
          </CardContent>
        </Card>

        {/* kimpga 호환 위젯 */}
        <Card>
          <CardHeader>
            <CardTitle>kimpga 호환</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">현재 김프(%)</div>
              <div className="text-2xl font-bold">
                {loadingKimp
                  ? "-"
                  : kimp?.kimp != null
                  ? kimp.kimp.toFixed(3)
                  : "-"}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">업비트 KRW</div>
              <div className="text-2xl font-bold">
                {loadingKimp || !kimp?.upbit_price
                  ? "-"
                  : kimp.upbit_price.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                바이낸스 선물(USDT)
              </div>
              <div className="text-2xl font-bold">
                {loadingKimp || !kimp?.binance_price
                  ? "-"
                  : Number(kimp.binance_price).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">USD/KRW</div>
              <div className="text-xl font-semibold">
                {loadingKimp || !kimp?.usdkrw
                  ? "-"
                  : Number(kimp.usdkrw).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">상태</div>
              <div className="text-xl font-semibold">
                {kimpgaStatus?.running ? "Running" : "Stopped"} (
                {kimpgaStatus?.position_state || "-"})
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={kimpgaStart} variant="default">
                시작
              </Button>
              <Button onClick={kimpgaStop} variant="secondary">
                중지
              </Button>
              <Button onClick={kimpgaForceExit} variant="destructive">
                강제청산
              </Button>
              <Button onClick={() => setTick((n) => n + 1)} variant="outline">
                새로고침
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>스파크라인</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              className="w-full h-[64px] bg-slate-900 rounded border border-slate-700"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>메트릭</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">루프</div>
              <div className="text-xl font-semibold">
                {kimpgaMetrics?.loops ?? 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">API 오류</div>
              <div className="text-xl font-semibold">
                {kimpgaMetrics?.api_errors ?? 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Binance 주문</div>
              <div className="text-xl font-semibold">
                {kimpgaMetrics?.orders_binance ?? 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Upbit 주문</div>
              <div className="text-xl font-semibold">
                {kimpgaMetrics?.orders_upbit ?? 0}
              </div>
            </div>
          </CardContent>
        </Card>

        {Array.isArray(kimpgaStatus?.logs) && (
          <Card>
            <CardHeader>
              <CardTitle>로그</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-black/60 text-green-300 p-3 rounded min-h-[160px] max-h-[320px] overflow-auto">
                {(kimpgaStatus?.logs as string[]).join("\n")}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* 활성 포지션 상태 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    자동매매 상태
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      newKimchiActive ? "text-green-600" : "text-slate-400"
                    }`}
                  >
                    {newKimchiActive ? "실행 중" : "대기 중"}
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    newKimchiActive
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-slate-100 dark:bg-slate-700"
                  }`}
                >
                  {newKimchiActive ? (
                    <Activity className="text-green-600" />
                  ) : (
                    <Settings className="text-slate-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    활성 포지션
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    {
                      positions.filter(
                        (pos) =>
                          pos.status.toLowerCase() === "open" ||
                          pos.status.toLowerCase() === "active"
                      ).length
                    }
                    개
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    거래소 연결
                  </p>
                  <p className="text-xl font-bold text-green-600">정상</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Wifi className="text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 활성 포지션 테이블 */}
        {positions.length > 0 && (
          <PositionsTable
            positions={positions}
            onRefresh={refetchPositions}
            onClosePosition={async (positionId: number) => {
              try {
                await apiRequest("POST", `/api/positions/${positionId}/close`);
                refetchPositions();
                toast({
                  title: "포지션 청산",
                  description: "포지션이 성공적으로 청산되었습니다.",
                });
              } catch (error) {
                toast({
                  title: "청산 실패",
                  description: "포지션 청산 중 오류가 발생했습니다.",
                  variant: "destructive",
                });
              }
            }}
          />
        )}
      </main>
    </div>
  );
}

// 실시간 자동매매 상태 컴포넌트
interface TradingStatusCardProps {
  newKimchiActive: boolean;
  config: {
    entryRate: number;
    exitRate: number;
    amount: number;
    leverage: number;
    tolerance: number;
  };
}

function TradingStatusCard({
  newKimchiActive,
  config,
}: TradingStatusCardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 김프 데이터 가져오기 (대체 엔드포인트 사용)
  const { data: kimchiData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/kimchi-premium/simple"],
    refetchInterval: 30000, // 30초마다 조회 (API 제한으로 인한 조정)
    enabled: newKimchiActive,
  });

  // 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!newKimchiActive) return null;

  const btcData = kimchiData?.find((item: any) => item.symbol === "BTC");
  const currentRate = btcData?.premiumRate || 0;

  // 진입 조건 계산
  const entryDifference = Math.abs(currentRate - config.entryRate);
  const isInEntryRange = entryDifference <= config.tolerance;
  const exitDifference = Math.abs(currentRate - config.exitRate);
  const isInExitRange = exitDifference <= config.tolerance;

  // 상태 결정
  let status = "대기중";
  let statusColor = "text-yellow-600 dark:text-yellow-400";
  let statusBg =
    "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800";
  let statusIcon = <Clock className="w-5 h-5" />;

  if (isInEntryRange) {
    status = "진입 조건 만족";
    statusColor = "text-green-600 dark:text-green-400";
    statusBg =
      "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800";
    statusIcon = <Target className="w-5 h-5" />;
  } else if (isInExitRange) {
    status = "청산 조건 만족";
    statusColor = "text-blue-600 dark:text-blue-400";
    statusBg =
      "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800";
    statusIcon = <TrendingUp className="w-5 h-5" />;
  }

  return (
    <div className={`${statusBg} border rounded-lg p-4 space-y-3`}>
      {/* 상태 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {statusIcon}
          <span className={`font-bold ${statusColor}`}>{status}</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {formatKoreanTime()}
        </div>
      </div>

      {/* 실시간 데이터 */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-slate-600 dark:text-slate-400">
            현재 BTC 김프율
          </div>
          <div
            className={`font-bold text-lg ${
              currentRate >= 0 ? "text-red-600" : "text-blue-600"
            }`}
          >
            {isLoading ? "조회중..." : `${currentRate.toFixed(3)}%`}
          </div>
        </div>
        <div>
          <div className="text-slate-600 dark:text-slate-400">설정 진입율</div>
          <div className="font-bold text-lg text-slate-800 dark:text-slate-200">
            {config.entryRate}%
          </div>
        </div>
      </div>

      {/* 조건 상세 */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div
          className={`p-2 rounded ${
            isInEntryRange
              ? "bg-green-100 dark:bg-green-900"
              : "bg-slate-100 dark:bg-slate-800"
          }`}
        >
          <div className="text-slate-600 dark:text-slate-400">진입 조건</div>
          <div
            className={
              isInEntryRange
                ? "text-green-700 dark:text-green-300 font-bold"
                : "text-slate-700 dark:text-slate-300"
            }
          >
            차이: {entryDifference.toFixed(3)}% (허용: ±{config.tolerance}%)
          </div>
        </div>
        <div
          className={`p-2 rounded ${
            isInExitRange
              ? "bg-blue-100 dark:bg-blue-900"
              : "bg-slate-100 dark:bg-slate-800"
          }`}
        >
          <div className="text-slate-600 dark:text-slate-400">청산 조건</div>
          <div
            className={
              isInExitRange
                ? "text-blue-700 dark:text-blue-300 font-bold"
                : "text-slate-700 dark:text-slate-300"
            }
          >
            차이: {exitDifference.toFixed(3)}% (허용: ±{config.tolerance}%)
          </div>
        </div>
      </div>

      {/* 투자 정보 */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
        투자금액: {config.amount.toLocaleString()}원 | 레버리지:{" "}
        {config.leverage}배 | 범위:{" "}
        {(config.entryRate - config.tolerance).toFixed(2)}% ~{" "}
        {(config.entryRate + config.tolerance).toFixed(2)}%
      </div>
    </div>
  );
}
