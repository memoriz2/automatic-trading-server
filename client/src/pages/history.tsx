import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Calendar from 'react-calendar';
import { format, startOfDay, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, FileText, TrendingUp, DollarSign, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import 'react-calendar/dist/Calendar.css';

// Custom calendar styles
const calendarStyles = `
.react-calendar {
  background: rgb(15 23 42) !important;
  border: 1px solid rgb(51 65 85) !important;
  border-radius: 0.5rem !important;
  color: white !important;
}

.react-calendar__tile {
  background: rgb(30 41 59) !important;
  color: rgb(226 232 240) !important;
  border: 1px solid rgb(51 65 85) !important;
}

.react-calendar__tile:hover {
  background: rgb(51 65 85) !important;
}

.react-calendar__tile--active {
  background: rgb(59 130 246) !important;
}

.react-calendar__tile--hasTrading {
  background: rgb(34 197 94) !important;
}

.react-calendar__navigation button {
  color: white !important;
  background: rgb(30 41 59) !important;
  border: 1px solid rgb(51 65 85) !important;
}

.react-calendar__navigation button:hover {
  background: rgb(51 65 85) !important;
}
`;

export default function History() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tradingNote, setTradingNote] = useState("");
  const { user } = useAuth();

  // IP 체크 (49.50.135.114인 경우 일부 통계 숨김)
  const isRestrictedIP = window.location.hostname === '49.50.135.114';

  // 실시간 가격 정보 조회
  const { data: priceData } = useQuery({
    queryKey: ['/api/prices/live'],
    queryFn: async () => {
      const response = await fetch('/api/prices/live', {
        credentials: 'include',
      });
      if (!response.ok) return { btcKrwPrice: 0, btcUsdPrice: 0, usdtKrwRate: 0 };
      return response.json();
    },
    refetchInterval: 5000,
    enabled: !!user,
  });

  const btcKrwPrice = priceData?.btcKrwPrice || 0;
  const btcUsdPrice = priceData?.btcUsdPrice || 0;
  const usdtKrwRate = priceData?.usdtKrwRate || 0;

  // 거래 내역 조회
  const { data: trades = [], isLoading: tradesLoading } = useQuery<any[]>({
    queryKey: [`/api/trades`],
    queryFn: async () => {
      const response = await fetch('/api/trades', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }
      const data = await response.json();
      return data.map((trade: any) => ({
        ...trade,
        quantity: parseFloat(trade.quantity),
        price: parseFloat(trade.price),
        fee: parseFloat(trade.fee || 0),
        amount: parseFloat(trade.quantity) * parseFloat(trade.price),
        type: trade.side,
        profit: 0
      }));
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  // 포지션 내역 조회 (실제 손익 계산용)
  const { data: positions = [] } = useQuery<any[]>({
    queryKey: [`/api/positions`],
    queryFn: async () => {
      const response = await fetch('/api/positions', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        return [];
      }
      const data = await response.json();
      // closed 상태만 필터링
      return data.filter((pos: any) => pos.status === 'closed');
    },
    refetchInterval: 30000,
    enabled: !!user,
  });

  // 선택된 날짜의 거래 내역
  const selectedDateTrades = trades.filter(trade => {
    try {
      // executed_at 또는 created_at 사용 (API 응답에 따라)
      const tradeDate = trade.executed_at || trade.executedAt || trade.created_at || trade.createdAt;
      if (!tradeDate) return false;
      const date = new Date(tradeDate);
      if (isNaN(date.getTime())) return false;
      return isSameDay(date, selectedDate);
    } catch (e) {
      return false;
    }
  });

  // 일일 통계 계산
  const dailyClosedPositions = positions.filter(pos => {
    try {
      if (pos.status !== 'closed') return false;
      const exitTime = pos.exit_time || pos.exitTime;
      if (!exitTime) return false;
      const exitDate = new Date(exitTime);
      if (isNaN(exitDate.getTime())) return false;
      return isSameDay(exitDate, selectedDate);
    } catch (e) {
      return false;
    }
  });

  const dailyStats = {
    totalTrades: selectedDateTrades.length,
    upbitTrades: selectedDateTrades.filter(t => t.exchange === 'upbit').length,
    binanceTrades: selectedDateTrades.filter(t => t.exchange === 'binance').length,
    totalProfit: dailyClosedPositions.reduce((sum, pos) => sum + (parseFloat(pos.realized_pnl) || 0), 0),
    totalVolume: selectedDateTrades.reduce((sum, t) => sum + (t.amount || 0), 0),
    totalPositions: dailyClosedPositions.length,
    profitPositions: dailyClosedPositions.filter(pos => parseFloat(pos.realized_pnl || 0) > 0).length,
    lossPositions: dailyClosedPositions.filter(pos => parseFloat(pos.realized_pnl || 0) < 0).length,
    upbitVolume: selectedDateTrades.filter(t => t.exchange === 'upbit').reduce((sum, t) => sum + (t.amount || 0), 0),
    binanceVolume: selectedDateTrades.filter(t => t.exchange === 'binance').reduce((sum, t) => sum + (t.amount || 0), 0),
    buyTrades: selectedDateTrades.filter(t => t.side === 'buy').length,
    sellTrades: selectedDateTrades.filter(t => t.side === 'sell').length,
    shortTrades: selectedDateTrades.filter(t => t.side === 'short').length,
    coverTrades: selectedDateTrades.filter(t => t.side === 'cover').length,
    avgProfit: dailyClosedPositions.length > 0
      ? dailyClosedPositions.reduce((sum, pos) => sum + (parseFloat(pos.realized_pnl) || 0), 0) / dailyClosedPositions.length
      : 0,
    winRate: dailyClosedPositions.length > 0
      ? (dailyClosedPositions.filter(pos => parseFloat(pos.realized_pnl || 0) > 0).length / dailyClosedPositions.length) * 100
      : 0,
  };

  // 전체 통계 계산
  const closedPositions = positions.filter(pos => pos.status === 'closed');
  const overallStats = {
    totalTrades: trades.length,
    upbitTrades: trades.filter(t => t.exchange === 'upbit').length,
    binanceTrades: trades.filter(t => t.exchange === 'binance').length,
    totalProfit: closedPositions.reduce((sum, pos) => sum + (parseFloat(pos.realized_pnl) || 0), 0),
    totalVolume: trades.reduce((sum, t) => sum + (t.amount || 0), 0),
    totalPositions: closedPositions.length,
    profitPositions: closedPositions.filter(pos => parseFloat(pos.realized_pnl || 0) > 0).length,
    lossPositions: closedPositions.filter(pos => parseFloat(pos.realized_pnl || 0) < 0).length,
    upbitVolume: trades.filter(t => t.exchange === 'upbit').reduce((sum, t) => sum + (t.amount || 0), 0),
    binanceVolume: trades.filter(t => t.exchange === 'binance').reduce((sum, t) => sum + (t.amount || 0), 0),
    buyTrades: trades.filter(t => t.side === 'buy').length,
    sellTrades: trades.filter(t => t.side === 'sell').length,
    shortTrades: trades.filter(t => t.side === 'short').length,
    coverTrades: trades.filter(t => t.side === 'cover').length,
    avgProfit: closedPositions.length > 0
      ? closedPositions.reduce((sum, pos) => sum + (parseFloat(pos.realized_pnl) || 0), 0) / closedPositions.length
      : 0,
    winRate: closedPositions.length > 0
      ? (closedPositions.filter(pos => parseFloat(pos.realized_pnl || 0) > 0).length / closedPositions.length) * 100
      : 0,
  };

  // 거래가 있는 날짜들
  const tradingDates = trades
    .filter(trade => {
      const tradeDate = trade.executed_at || trade.executedAt || trade.created_at || trade.createdAt;
      if (!tradeDate) return false;
      try {
        const date = new Date(tradeDate);
        return !isNaN(date.getTime());
      } catch (e) {
        return false;
      }
    })
    .map(trade => {
      const tradeDate = trade.executed_at || trade.executedAt || trade.created_at || trade.createdAt;
      return startOfDay(new Date(tradeDate)).getTime();
    });

  // 캘린더 타일 클래스 설정
  const tileClassName = ({ date }: { date: Date }) => {
    const dateTime = startOfDay(date).getTime();
    if (tradingDates.includes(dateTime)) {
      return 'react-calendar__tile--hasTrading';
    }
    return '';
  };

  return (
    <>
      <style>{calendarStyles}</style>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-slate-900 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">거래 내역</h2>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-slate-400" />
              <span className="text-slate-300">
                {format(selectedDate, 'yyyy년 MM월 dd일')}
              </span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 캘린더 */}
            <div className="lg:col-span-1">
              <Card className="bg-slate-850 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    매매 캘린더
                  </CardTitle>
                  <p className="text-sm text-slate-400">
                    초록-거래있음, 파랑-선택날짜
                  </p>
                </CardHeader>
                <CardContent>
                  <Calendar
                    onChange={(value) => setSelectedDate(value as Date)}
                    value={selectedDate}
                    tileClassName={tileClassName}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* 일일 통계 */}
              <Card className="bg-slate-850 border-slate-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    {format(selectedDate, 'MM월 dd일')} 통계
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{dailyStats.totalTrades}</p>
                      <p className="text-xs text-slate-400">총 거래</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{dailyStats.upbitTrades}</p>
                      <p className="text-xs text-slate-400">업비트 거래</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-400">{dailyStats.binanceTrades}</p>
                      <p className="text-xs text-slate-400">바이낸스 거래</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${dailyStats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {dailyStats.totalProfit >= 0 ? '+' : ''}{dailyStats.totalProfit.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">수익 (원)</p>
                    </div>
                  </div>
                  
                  {!isRestrictedIP && (
                    <div className="pt-4 border-t border-slate-600 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">거래량</span>
                          <span className="text-white font-semibold">
                            {dailyStats.totalVolume.toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">포지션</span>
                          <span className="text-white font-semibold">
                            {dailyStats.totalPositions}개
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">승률</span>
                          <span className={`font-semibold ${dailyStats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                            {dailyStats.winRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">평균 수익</span>
                          <span className={`font-semibold ${dailyStats.avgProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {dailyStats.avgProfit >= 0 ? '+' : ''}{dailyStats.avgProfit.toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">수익 포지션</span>
                          <span className="text-green-400 font-semibold">
                            {dailyStats.profitPositions}개
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">손실 포지션</span>
                          <span className="text-red-400 font-semibold">
                            {dailyStats.lossPositions}개
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 거래 유형별 통계 */}
              <Card className="bg-slate-850 border-slate-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    거래 유형별 통계
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-400">{dailyStats.buyTrades}</p>
                      <p className="text-xs text-slate-400">매수 (BUY)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-yellow-400">{dailyStats.sellTrades}</p>
                      <p className="text-xs text-slate-400">매도 (SELL)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-red-400">{dailyStats.shortTrades}</p>
                      <p className="text-xs text-slate-400">숏 (SHORT)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-400">{dailyStats.coverTrades}</p>
                      <p className="text-xs text-slate-400">커버 (COVER)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 전체 통계 */}
              <Card className="bg-slate-850 border-slate-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    전체 통계
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{overallStats.totalTrades}</p>
                      <p className="text-xs text-slate-400">총 거래</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{overallStats.upbitTrades}</p>
                      <p className="text-xs text-slate-400">업비트 거래</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-400">{overallStats.binanceTrades}</p>
                      <p className="text-xs text-slate-400">바이낸스 거래</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${overallStats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {overallStats.totalProfit >= 0 ? '+' : ''}{overallStats.totalProfit.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400">총 수익 (원)</p>
                    </div>
                  </div>

                  {!isRestrictedIP && (
                    <div className="pt-4 border-t border-slate-600 space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">총 거래량</span>
                          <span className="text-white font-semibold">
                            {overallStats.totalVolume.toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">총 포지션</span>
                          <span className="text-white font-semibold">
                            {overallStats.totalPositions}개
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">승률</span>
                          <span className={`font-semibold ${overallStats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                            {overallStats.winRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">평균 수익</span>
                          <span className={`font-semibold ${overallStats.avgProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {overallStats.avgProfit >= 0 ? '+' : ''}{overallStats.avgProfit.toLocaleString()}원
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">수익 포지션</span>
                          <span className="text-green-400 font-semibold">
                            {overallStats.profitPositions}개
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">손실 포지션</span>
                          <span className="text-red-400 font-semibold">
                            {overallStats.lossPositions}개
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 전체 거래 유형별 통계 */}
              <Card className="bg-slate-850 border-slate-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    전체 거래 유형별 통계
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-400">{overallStats.buyTrades}</p>
                      <p className="text-xs text-slate-400">매수 (BUY)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-yellow-400">{overallStats.sellTrades}</p>
                      <p className="text-xs text-slate-400">매도 (SELL)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-red-400">{overallStats.shortTrades}</p>
                      <p className="text-xs text-slate-400">숏 (SHORT)</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-400">{overallStats.coverTrades}</p>
                      <p className="text-xs text-slate-400">커버 (COVER)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 거래 내역 및 메모 */}
            <div className="lg:col-span-2 space-y-6">
              {/* 거래 내역 */}
              <Card className="bg-slate-850 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    {format(selectedDate, 'MM월 dd일')} 거래 내역
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tradesLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-slate-400">거래 내역을 불러오는 중...</p>
                    </div>
                  ) : selectedDateTrades.length > 0 ? (
                    <div className="space-y-3">
                      {/* 시간순으로 2개씩 묶어서 표시 */}
                      {(() => {
                        const buyTrades = selectedDateTrades.filter(t => t.side === 'buy' || t.side === 'short');
                        const sellTrades = selectedDateTrades.filter(t => t.side === 'sell' || t.side === 'cover');
                        const buyTotal = buyTrades.reduce((sum, t) => sum + (t.amount || 0), 0);
                        const sellTotal = sellTrades.reduce((sum, t) => sum + (t.amount || 0), 0);
                        const totalProfit = sellTotal - buyTotal;

                        return (
                          <>
                            {Array.from({ length: Math.ceil(selectedDateTrades.length / 2) }).map((_, pairIndex) => {
                              const trade1 = selectedDateTrades[pairIndex * 2];
                              const trade2 = selectedDateTrades[pairIndex * 2 + 1];

                              const getTradeColor = (side: string) => {
                                if (side === 'buy' || side === 'short') return 'blue';
                                return 'red';
                              };

                              const getTradeLabel = (side: string) => {
                                if (side === 'buy') return '매수';
                                if (side === 'short') return '숏';
                                if (side === 'sell') return '매도';
                                return '커버';
                              };

                              return (
                                <div
                                  key={`pair-${pairIndex}`}
                                  className="p-3 bg-slate-800 rounded-lg border border-slate-600"
                                >
                                  {/* 첫 번째 거래 */}
                                  <div className="flex items-center justify-between pb-2">
                                    <div className="flex items-center space-x-3">
                                      <div className={`w-3 h-3 rounded-full ${
                                        getTradeColor(trade1.side) === 'blue' ? 'bg-blue-400' : 'bg-red-400'
                                      }`}></div>
                                      <div>
                                        <p className="text-white font-medium text-sm">
                                          {trade1.symbol} {getTradeLabel(trade1.side)}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                          {trade1.quantity.toFixed(6)} × {
                                            trade1.exchange === 'binance'
                                              ? `${trade1.price.toLocaleString()}$ (${(trade1.price * usdtKrwRate).toLocaleString()}원)`
                                              : `${trade1.price.toLocaleString()}원`
                                          }
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {trade1.exchange.toUpperCase()}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-white font-medium text-sm">
                                        {(trade1.amount || 0).toLocaleString()}원
                                      </p>
                                      <p className="text-xs text-slate-400 flex items-center justify-end">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {(() => {
                                          try {
                                            const tradeDate = trade1.executed_at || trade1.executedAt || trade1.created_at || trade1.createdAt;
                                            if (!tradeDate) return '-';
                                            const date = new Date(tradeDate);
                                            if (isNaN(date.getTime())) return '-';
                                            return format(date, 'HH:mm:ss');
                                          } catch (e) {
                                            return '-';
                                          }
                                        })()}
                                      </p>
                                    </div>
                                  </div>

                                  {/* 두 번째 거래 (있으면) */}
                                  {trade2 && (
                                    <>
                                      <div className="border-t border-slate-600 my-2"></div>
                                      <div className="flex items-center justify-between pt-2">
                                        <div className="flex items-center space-x-3">
                                          <div className={`w-3 h-3 rounded-full ${
                                            getTradeColor(trade2.side) === 'blue' ? 'bg-blue-400' : 'bg-red-400'
                                          }`}></div>
                                          <div>
                                            <p className="text-white font-medium text-sm">
                                              {trade2.symbol} {getTradeLabel(trade2.side)}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                              {trade2.quantity.toFixed(6)} × {
                                                trade2.exchange === 'binance'
                                                  ? `${trade2.price.toLocaleString()}$ (${(trade2.price * usdtKrwRate).toLocaleString()}원)`
                                                  : `${trade2.price.toLocaleString()}원`
                                              }
                                            </p>
                                            <p className="text-xs text-slate-500">
                                              {trade2.exchange.toUpperCase()}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-white font-medium text-sm">
                                            {(trade2.amount || 0).toLocaleString()}원
                                          </p>
                                          <p className="text-xs text-slate-400 flex items-center justify-end">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {(() => {
                                              try {
                                                const tradeDate = trade2.executed_at || trade2.executedAt || trade2.created_at || trade2.createdAt;
                                                if (!tradeDate) return '-';
                                                const date = new Date(tradeDate);
                                                if (isNaN(date.getTime())) return '-';
                                                return format(date, 'HH:mm:ss');
                                              } catch (e) {
                                                return '-';
                                              }
                                            })()}
                                          </p>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}

                            {/* 총 수익금 */}
                            {buyTrades.length > 0 && sellTrades.length > 0 && (
                              <div className={`p-4 rounded-lg border-2 ${
                                totalProfit >= 0
                                  ? 'bg-green-500/10 border-green-500/50'
                                  : 'bg-red-500/10 border-red-500/50'
                              }`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-semibold text-white">총 수익금</span>
                                  <span className={`text-xl font-bold ${
                                    totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()}원
                                  </span>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">선택한 날짜에 거래 내역이 없습니다.</p>
                      <p className="text-xs text-slate-500 mt-2">
                        총 {trades.length}건의 거래 내역이 있습니다.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 매매 일지 */}
              <Card className="bg-slate-850 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    매매 일지
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder={`${format(selectedDate, 'MM월 dd일')} 매매 분석 및 메모를 작성하세요...`}
                    value={tradingNote}
                    onChange={(e) => setTradingNote(e.target.value)}
                    className="bg-slate-800 border-slate-600 text-white min-h-[120px]"
                  />
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      // TODO: 메모 저장 API 호출
                      console.log('매매 일지 저장:', {
                        date: selectedDate,
                        note: tradingNote
                      });
                    }}
                  >
                    메모 저장
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
