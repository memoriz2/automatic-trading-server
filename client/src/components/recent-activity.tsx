import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { Trade, SystemAlert } from "@/types/trading";

interface RecentActivityProps {
  recentTrades: Trade[];
  alerts: SystemAlert[];
}

export function RecentActivity({ recentTrades, alerts }: RecentActivityProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getAlertIcon = (type: string) => {
    const colors: Record<string, string> = {
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-danger',
      info: 'bg-primary'
    };
    
    return `w-2 h-2 ${colors[type] || 'bg-slate-500'} rounded-full mt-2 mr-3 flex-shrink-0`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Trading Activity */}
      <Card className="bg-slate-850 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">최근 거래 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTrades.length === 0 ? (
              <p className="text-slate-400 text-center py-4">최근 거래 내역이 없습니다.</p>
            ) : (
              recentTrades.slice(0, 5).map((trade, index) => (
                <div key={trade.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-b-0">
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 ${
                      trade.side === 'buy' ? 'bg-success/20' : 'bg-danger/20'
                    }`}>
                      {trade.side === 'buy' ? (
                        <ArrowUp className="text-success" />
                      ) : (
                        <ArrowDown className="text-danger" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {trade.symbol} {trade.side === 'buy' ? '김프 진입' : '포지션 청산'}
                      </p>
                      <p className="text-xs text-slate-400">{formatTime(trade.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      trade.side === 'buy' ? 'text-success' : 'text-danger'
                    }`}>
                      {trade.side === 'buy' ? '+' : '-'}₩{trade.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400">
                      {((Math.random() - 0.5) * 2).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card className="bg-slate-850 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">시스템 알림</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <p className="text-slate-400 text-center py-4">새로운 알림이 없습니다.</p>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start py-3 border-b border-slate-700 last:border-b-0">
                  <div className={getAlertIcon(alert.type)}></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">{alert.title}</p>
                    <p className="text-xs text-slate-400 mt-1">{alert.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{formatTime(alert.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
