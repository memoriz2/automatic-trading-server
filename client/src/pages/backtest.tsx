
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, PlayCircle } from "lucide-react";

// Types from the backend service
interface BacktestParams {
  startDate: string;
  endDate: string;
  entryRate: number;
  exitRate: number;
  amount: number;
  leverage: number;
}

interface BacktestTrade {
  entryTime: string;
  entryPrice: number;
  entryKimchiPremium: number;
  exitTime: string;
  exitPrice: number;
  exitKimchiPremium: number;
  profit: number;
}

interface BacktestResult {
  totalProfit: number;
  winRate: number;
  totalTrades: number;
  averageProfitPerTrade: number;
  trades: BacktestTrade[];
  params: BacktestParams;
}


export default function BacktestPage() {
  const { toast } = useToast();
  const [params, setParams] = useState<BacktestParams>({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    entryRate: 2.0,
    exitRate: 1.0,
    amount: 1000000,
    leverage: 1,
  });

  const [result, setResult] = useState<BacktestResult | null>(null);

  const backtestMutation = useMutation({
    mutationFn: async (newParams: BacktestParams): Promise<BacktestResult> => {
      const response = await apiRequest('POST', '/api/backtest', newParams);
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: '백테스트 완료', description: `총 ${data.totalTrades}건의 거래가 시뮬레이션되었습니다.` });
      setResult(data);
    },
    onError: (error: any) => {
      toast({
        title: '백테스트 실패',
        description: error.message || '백테스트 실행 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setParams(prev => ({ ...prev, [id]: Number(value) }));
  };

  const handleRunBacktest = () => {
    // Basic validation
    if (new Date(params.startDate) >= new Date(params.endDate)) {
        toast({ title: '입력 오류', description: '시작일은 종료일보다 이전이어야 합니다.', variant: 'destructive' });
        return;
    }
     if (params.amount <= 0) {
        toast({ title: '입력 오류', description: '투자금액은 0보다 커야 합니다.', variant: 'destructive' });
        return;
    }
    backtestMutation.mutate(params);
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">전략 백테스트</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parameters Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>백테스트 설정</CardTitle>
            <CardDescription>시뮬레이션할 조건을 입력하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                <Label htmlFor="startDate">시작일</Label>
                 <Input id="startDate" type="date" value={params.startDate} onChange={(e) => setParams(p => ({...p, startDate: e.target.value}))}/>
              </div>
              <div>
                <Label htmlFor="endDate">종료일</Label>
                 <Input id="endDate" type="date" value={params.endDate} onChange={(e) => setParams(p => ({...p, endDate: e.target.value}))}/>
              </div>
            </div>
            <div>
              <Label htmlFor="entryRate">진입 김프율 (%)</Label>
              <Input id="entryRate" type="number" value={params.entryRate} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="exitRate">청산 김프율 (%)</Label>
              <Input id="exitRate" type="number" value={params.exitRate} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="amount">투자금액 (원)</Label>
              <Input id="amount" type="number" value={params.amount} onChange={handleInputChange} />
            </div>
             <div>
              <Label htmlFor="leverage">레버리지 (배)</Label>
              <Input id="leverage" type="number" min="1" value={params.leverage} onChange={handleInputChange} />
            </div>
            <Button onClick={handleRunBacktest} disabled={backtestMutation.isPending} className="w-full">
              {backtestMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlayCircle className="mr-2 h-4 w-4" />}
              백테스트 실행
            </Button>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>백테스트 결과</CardTitle>
            <CardDescription>설정된 조건에 대한 시뮬레이션 결과입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {backtestMutation.isPending ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-4 text-muted-foreground">백테스트를 실행하는 중입니다...</p>
              </div>
            ) : result ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center p-4 bg-muted/50 rounded-lg">
                    <div>
                        <p className="text-sm text-muted-foreground">총 손익</p>
                        <p className={`text-2xl font-bold ${result.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{result.totalProfit.toLocaleString()}원</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">총 거래 횟수</p>
                        <p className="text-2xl font-bold">{result.totalTrades}회</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">승률</p>
                        <p className="text-2xl font-bold">{result.winRate.toFixed(2)}%</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">거래당 평균 손익</p>
                        <p className={`text-2xl font-bold ${result.averageProfitPerTrade >= 0 ? 'text-green-500' : 'text-red-500'}`}>{Math.round(result.averageProfitPerTrade).toLocaleString()}원</p>
                    </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">거래 내역</h3>
                   <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>진입 시간</TableHead>
                        <TableHead>진입 김프</TableHead>
                        <TableHead>청산 시간</TableHead>
                        <TableHead>청산 김프</TableHead>
                        <TableHead className="text-right">손익 (원)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.trades.map((trade, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(trade.entryTime).toLocaleString('ko-KR')}</TableCell>
                          <TableCell>{trade.entryKimchiPremium.toFixed(2)}%</TableCell>
                          <TableCell>{new Date(trade.exitTime).toLocaleString('ko-KR')}</TableCell>
                          <TableCell>{trade.exitKimchiPremium.toFixed(2)}%</TableCell>
                          <TableCell className={`text-right font-mono ${trade.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trade.profit >= 0 ? '+' : ''}{trade.profit.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground h-64 flex items-center justify-center">
                <p>백테스트를 실행하여 결과를 확인하세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
