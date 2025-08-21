import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Calendar from 'react-calendar';
import { format, startOfDay, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, FileText, TrendingUp, DollarSign, Clock } from "lucide-react";
import type { Trade } from "@/types/trading";
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
  
  // 거래 내역 조회
  const { data: trades = [], refetch: refetchTrades } = useQuery<Trade[]>({
    queryKey: ['/api/trades/1'],
  });

  // 선택된 날짜의 거래 내역
  const selectedDateTrades = trades.filter(trade => 
    isSameDay(new Date(trade.createdAt), selectedDate)
  );

  // 일일 통계 계산
  const dailyStats = selectedDateTrades.reduce(
    (acc, trade) => {
      acc.totalTrades++;
      acc.totalVolume += trade.amount;
      acc.totalProfit += trade.profit || 0;
      if (trade.profit && trade.profit > 0) acc.profitTrades++;
      return acc;
    },
    { totalTrades: 0, totalVolume: 0, totalProfit: 0, profitTrades: 0 }
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
                    일일 통계
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">총 거래</span>
                    <span className="text-white font-semibold">{dailyStats.totalTrades}건</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">거래량</span>
                    <span className="text-white font-semibold">
                      {dailyStats.totalVolume.toLocaleString()}원
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">수익</span>
                    <span className={`font-semibold ${
                      dailyStats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {dailyStats.totalProfit >= 0 ? '+' : ''}
                      {dailyStats.totalProfit.toLocaleString()}원
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
                  {selectedDateTrades.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDateTrades.map((trade) => (
                        <div 
                          key={trade.id} 
                          className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-600"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-3 h-3 rounded-full ${
                              trade.type === 'buy' ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                            <div>
                              <p className="text-white font-semibold">
                                {trade.symbol} {trade.type === 'buy' ? '매수' : '매도'}
                              </p>
                              <p className="text-sm text-slate-400">
                                {trade.quantity} × {trade.price.toLocaleString()}원
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${
                              (trade.profit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {(trade.profit || 0) >= 0 ? '+' : ''}
                              {(trade.profit || 0).toLocaleString()}원
                            </p>
                            <p className="text-sm text-slate-400 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {format(new Date(trade.createdAt), 'HH:mm:ss')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">선택한 날짜에 거래 내역이 없습니다.</p>
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
