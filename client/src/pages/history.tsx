import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Calendar from 'react-calendar';
import { format, startOfDay, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, FileText, TrendingUp, DollarSign, Clock } from "lucide-react";
import type { Trade } from "@/types/trading";
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
  
  // 사용자 ID 결정
  const __userId = user?.id ? String(user.id) : "1";
  
  // 거래 내역 조회
  const { data: trades = [], refetch: refetchTrades, isLoading: tradesLoading } = useQuery<Trade[]>({
    queryKey: [`/api/trades`],
    queryFn: async () => {
      console.log(`🔍 거래 내역 조회: 세션 기반`);
      const response = await fetch('/api/trades', {
        credentials: 'include', // 세션 쿠키 포함
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }
      const data = await response.json();
      console.log(`📊 거래 내역 응답:`, data);
      // 서버 데이터를 클라이언트 타입에 맞게 변환
      return data.map((trade: any) => ({
        ...trade,
        quantity: parseFloat(trade.quantity), // Decimal을 숫자로 변환
        price: parseFloat(trade.price), // Decimal을 숫자로 변환
        fee: parseFloat(trade.fee || 0), // Decimal을 숫자로 변환
        amount: parseFloat(trade.quantity) * parseFloat(trade.price),
        type: trade.side, // 호환성을 위해 type 필드 추가
        profit: 0 // 기본값, 실제로는 계산 필요
      }));
    },
    refetchInterval: 30000, // 30초마다 새로고침
    enabled: !!user, // 사용자가 로그인되어 있을 때만 실행
  });

  // 선택된 날짜의 거래 내역
  const selectedDateTrades = trades.filter(trade => 
    isSameDay(new Date(trade.createdAt), selectedDate)
  );

  // 일일 통계 계산
  const dailyStats = selectedDateTrades.reduce(
    (acc, trade) => {
      acc.totalTrades++;
      acc.totalVolume += trade.amount || 0;
      acc.totalProfit += trade.profit || 0;
      if (trade.profit && trade.profit > 0) acc.profitTrades++;
      
      // 거래소별 통계
      if (trade.exchange === 'upbit') {
        acc.upbitTrades++;
        acc.upbitVolume += trade.amount || 0;
      } else if (trade.exchange === 'binance') {
        acc.binanceTrades++;
        acc.binanceVolume += trade.amount || 0;
      }
      
      // 거래 유형별 통계
      if (trade.side === 'buy') {
        acc.buyTrades++;
      } else if (trade.side === 'sell') {
        acc.sellTrades++;
      } else if (trade.side === 'short') {
        acc.shortTrades++;
      } else if (trade.side === 'cover') {
        acc.coverTrades++;
      }
      
      return acc;
    },
    { 
      totalTrades: 0, 
      totalVolume: 0, 
      totalProfit: 0, 
      profitTrades: 0,
      upbitTrades: 0,
      upbitVolume: 0,
      binanceTrades: 0,
      binanceVolume: 0,
      buyTrades: 0,
      sellTrades: 0,
      shortTrades: 0,
      coverTrades: 0
    }
  );

  // 전체 통계 계산 (모든 거래)
  const overallStats = trades.reduce(
    (acc, trade) => {
      acc.totalTrades++;
      acc.totalVolume += trade.amount || 0;
      acc.totalProfit += trade.profit || 0;
      if (trade.profit && trade.profit > 0) acc.profitTrades++;
      
      if (trade.exchange === 'upbit') {
        acc.upbitTrades++;
        acc.upbitVolume += trade.amount || 0;
      } else if (trade.exchange === 'binance') {
        acc.binanceTrades++;
        acc.binanceVolume += trade.amount || 0;
      }
      
      return acc;
    },
    { 
      totalTrades: 0, 
      totalVolume: 0, 
      totalProfit: 0, 
      profitTrades: 0,
      upbitTrades: 0,
      upbitVolume: 0,
      binanceTrades: 0,
      binanceVolume: 0
    }
  );

  // 거래가 있는 날짜들
  const tradingDates = trades.map(trade => 
    startOfDay(new Date(trade.createdAt)).getTime()
  );

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
                  
                  <div className="pt-4 border-t border-slate-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">거래량</span>
                        <span className="text-white font-semibold">
                          {dailyStats.totalVolume.toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">승률</span>
                        <span className="text-white font-semibold">
                          {dailyStats.totalTrades > 0 
                            ? `${((dailyStats.profitTrades / dailyStats.totalTrades) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
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
                  
                  <div className="pt-4 border-t border-slate-600">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">총 거래량</span>
                        <span className="text-white font-semibold">
                          {overallStats.totalVolume.toLocaleString()}원
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">전체 승률</span>
                        <span className="text-white font-semibold">
                          {overallStats.totalTrades > 0 
                            ? `${((overallStats.profitTrades / overallStats.totalTrades) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </span>
                      </div>
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
                      {selectedDateTrades.map((trade) => (
                        <div 
                          key={trade.id} 
                          className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-600"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              trade.side === 'buy' ? 'bg-green-400' : 
                              trade.side === 'sell' ? 'bg-yellow-400' :
                              trade.side === 'short' ? 'bg-red-400' : 'bg-blue-400'
                            }`}></div>
                            <div>
                              <p className="text-white font-semibold">
                                {trade.symbol} {
                                  trade.side === 'buy' ? '매수' : 
                                  trade.side === 'sell' ? '매도' :
                                  trade.side === 'short' ? '숏' : '커버'
                                }
                              </p>
                              <p className="text-sm text-slate-400">
                                {trade.quantity.toFixed(6)} × {trade.price.toLocaleString()}원
                              </p>
                              <p className="text-xs text-slate-500">
                                {trade.exchange.toUpperCase()} | {trade.orderType || 'MARKET'}
                              </p>
                              {/* 전략 정보 표시 */}
                              {trade.strategyName && (
                                <p className="text-xs text-blue-400">
                                  📋 {trade.strategyName} (ID: {trade.strategyId})
                                </p>
                              )}
                              {trade.positionId && (
                                <p className="text-xs text-purple-400">
                                  🎯 포지션 #{trade.positionId}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold">
                              {(trade.amount || 0).toLocaleString()}원
                            </p>
                            {trade.fee && (
                              <p className="text-xs text-slate-400">
                                수수료: {trade.fee.toFixed(4)}
                              </p>
                            )}
                            <p className="text-sm text-slate-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(new Date(trade.executedAt), 'HH:mm:ss')}
                            </p>
                          </div>
                        </div>
                      ))}
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
