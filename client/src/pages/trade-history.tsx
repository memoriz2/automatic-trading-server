import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { RefreshCw, Download, Filter } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

export default function TradeHistory() {
  const { user } = useAuth();
  const [selectedExchange, setSelectedExchange] = useState<string>('all');
  const [selectedSymbol, setSelectedSymbol] = useState<string>(''); // 전체 심볼 (빈 문자열)

  // 거래내역 조회
  const { data: tradesResponse, isLoading, refetch, error } = useQuery<{
    success: boolean;
    count: number;
    trades: any[];
  }>({
    queryKey: ['/api/trades/history', selectedExchange, selectedSymbol],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedExchange !== 'all') params.append('exchange', selectedExchange);
      if (selectedSymbol) params.append('symbol', selectedSymbol);
      // limit은 서버에서 자동으로 50건씩 조회

      console.log('🔍 거래내역 조회 요청:', {
        exchange: selectedExchange,
        symbol: selectedSymbol,
        url: `/api/trades/history?${params.toString()}`
      });

      const response = await fetch(`/api/trades/history?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ 거래내역 조회 실패:', errorData);
        throw new Error(errorData.error || 'Failed to fetch trades');
      }

      const data = await response.json();
      console.log('✅ 거래내역 조회 성공:', data);
      return data;
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  const trades = tradesResponse?.trades || [];

  console.log('📊 현재 거래내역:', {
    count: trades.length,
    isLoading,
    error: error?.message,
    response: tradesResponse
  });

  // CSV 다운로드
  const downloadCSV = () => {
    if (trades.length === 0) return;

    const headers = ['거래소', '타입', '심볼', '사이드', '수량', '가격', '수수료', '시간'];
    const rows = trades.map(trade => [
      trade.exchange,
      trade.type || 'spot',
      trade.symbol,
      trade.side,
      trade.quantity,
      trade.price,
      trade.fee,
      format(new Date(trade.timestamp), 'yyyy-MM-dd HH:mm:ss')
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `trades_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">거래내역 (테이블)</h2>
            <p className="text-sm text-slate-400 mt-1">
              업비트와 바이낸스의 실제 거래내역을 조회합니다
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </Button>
            <Button
              onClick={downloadCSV}
              variant="outline"
              size="sm"
              className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
              disabled={trades.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV 다운로드
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <Card className="bg-slate-850 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                필터
              </CardTitle>
              <span className="text-sm text-slate-400">
                총 {trades.length}건의 거래내역
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {/* 필터 */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-slate-400">거래소:</label>
                <select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  className="bg-slate-800 border border-slate-600 text-white rounded px-3 py-1.5 text-sm"
                >
                  <option value="all">전체</option>
                  <option value="upbit">업비트</option>
                  <option value="binance">바이낸스</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm text-slate-400">심볼:</label>
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="bg-slate-800 border border-slate-600 text-white rounded px-3 py-1.5 text-sm"
                >
                  <option value="">전체</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="BNB">BNB</option>
                  <option value="SOL">SOL</option>
                  <option value="XRP">XRP</option>
                  <option value="ADA">ADA</option>
                  <option value="DOGE">DOGE</option>
                </select>
              </div>
            </div>

            {/* 테이블 */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-slate-400">거래내역을 불러오는 중...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-400 text-lg mb-2">❌ 오류 발생</p>
                <p className="text-slate-400 text-sm">{(error as Error).message}</p>
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  size="sm"
                  className="mt-4 bg-slate-800 border-slate-600 text-white hover:bg-slate-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 시도
                </Button>
              </div>
            ) : trades.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-600 hover:bg-slate-800">
                      <TableHead className="text-slate-300">거래소</TableHead>
                      <TableHead className="text-slate-300">타입</TableHead>
                      <TableHead className="text-slate-300">심볼</TableHead>
                      <TableHead className="text-slate-300">사이드</TableHead>
                      <TableHead className="text-slate-300 text-right">수량</TableHead>
                      <TableHead className="text-slate-300 text-right">가격</TableHead>
                      <TableHead className="text-slate-300 text-right">거래금액</TableHead>
                      <TableHead className="text-slate-300 text-right">수수료</TableHead>
                      <TableHead className="text-slate-300">시간</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.map((trade, index) => (
                      <TableRow
                        key={`${trade.id || index}-${trade.timestamp}`}
                        className="border-slate-700 hover:bg-slate-800"
                      >
                        <TableCell className="font-medium">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            trade.exchange === 'upbit'
                              ? 'bg-green-900 text-green-300'
                              : 'bg-orange-900 text-orange-300'
                          }`}>
                            {trade.exchange.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-300 text-sm">
                            {trade.type === 'futures' ? '선물' : '현물'}
                          </span>
                        </TableCell>
                        <TableCell className="text-white font-semibold">
                          {trade.symbol}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            trade.side === 'buy'
                              ? 'bg-blue-900 text-blue-300'
                              : 'bg-red-900 text-red-300'
                          }`}>
                            {trade.side === 'buy' ? '매수' : '매도'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-slate-300">
                          {parseFloat(trade.quantity).toFixed(8)}
                        </TableCell>
                        <TableCell className="text-right text-slate-300">
                          <div>
                            <div>{parseFloat(trade.price).toLocaleString()}</div>
                            {trade.exchange === 'binance' && trade.usdtKrwRate && (
                              <div className="text-xs text-slate-500">
                                ≈ ₩{Math.floor(parseFloat(trade.price) * trade.usdtKrwRate).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-white font-semibold">
                          <div>
                            <div>
                              {(parseFloat(trade.quantity) * parseFloat(trade.price)).toLocaleString(undefined, {
                                maximumFractionDigits: 2
                              })}
                            </div>
                            {trade.exchange === 'binance' && trade.usdtKrwRate && (
                              <div className="text-xs text-slate-500">
                                ≈ ₩{Math.floor(parseFloat(trade.quantity) * parseFloat(trade.price) * trade.usdtKrwRate).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-slate-400 text-sm">
                          {parseFloat(trade.fee || 0).toFixed(6)}
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm">
                          {format(new Date(trade.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg mb-2">거래내역이 없습니다</p>
                <p className="text-slate-500 text-sm">
                  필터 조건을 변경하거나 새로고침을 시도해보세요
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
