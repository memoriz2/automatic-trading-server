import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, Edit, X } from "lucide-react";
import type { Position } from "@/types/trading";
import { queryClient } from "@/lib/queryClient";

interface PositionsTableProps {
  positions: Position[];
  onRefresh: () => void;
  onClosePosition: (positionId: number) => void;
}

export function PositionsTable({ positions, onRefresh, onClosePosition }: PositionsTableProps) {
  const getCoinIcon = (symbol: string) => {
    const colors: Record<string, string> = {
      BTC: 'bg-orange-500',
      ETH: 'bg-blue-500',
      XRP: 'bg-yellow-500',
      ADA: 'bg-purple-500',
      DOT: 'bg-pink-500'
    };
    
    return (
      <div className={`w-8 h-8 ${colors[symbol] || 'bg-gray-500'} rounded-full flex items-center justify-center mr-3`}>
        <span className="text-xs font-bold text-white">{symbol}</span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || 'closed';
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      active: { variant: "default", className: "bg-success/20 text-success hover:bg-success/30" },
      pending: { variant: "secondary", className: "bg-warning/20 text-warning hover:bg-warning/30" },
      closed: { variant: "outline", className: "bg-slate-700 text-slate-300" }
    };

    const config = variants[normalizedStatus] || variants.closed;
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {normalizedStatus === 'active' ? '활성' : normalizedStatus === 'pending' ? '대기' : '종료'}
      </Badge>
    );
  };

  return (
    <Card className="bg-slate-850 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">활성 포지션</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              onClick={() => {
                // 완전한 캐시 무효화
                queryClient.invalidateQueries({ queryKey: ['/api/positions', 1] });
                queryClient.refetchQueries({ queryKey: ['/api/positions', 1] });
                onRefresh();
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              새로고침
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
              title="포지션 내역을 CSV 파일로 다운로드"
            >
              <Download className="w-4 h-4 mr-1" />
              내보내기
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">코인</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">포지션</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">진입가</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">현재가</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">수량</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">수익률</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">김프율</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody className="bg-slate-850 divide-y divide-slate-700">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                    활성 포지션이 없습니다.
                  </td>
                </tr>
              ) : (
                positions.map((position) => (
                  <tr key={position.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getCoinIcon(position.symbol)}
                        <span className="text-sm font-medium text-white">{position.symbol}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">매수 + 숏</div>
                      <div className="text-xs text-slate-400">
                        진입시간: {new Date(position.entryTime).toLocaleTimeString('ko-KR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">₩{parseFloat(position.entryPrice.toString()).toLocaleString()}</div>
                      <div className="text-xs text-slate-400">포지션 진입 시점 가격</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">₩{position.currentPrice ? parseFloat(position.currentPrice.toString()).toLocaleString() : '-'}</div>
                      <div className="text-xs text-slate-400">실시간 업데이트 가격</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{parseFloat(position.quantity?.toString() || '0').toFixed(4)}</div>
                      <div className="text-xs text-slate-400">매매 수량 (코인)</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${
                        parseFloat(position.profitLossRate?.toString() || '0') >= 0 ? 'text-success' : 'text-danger'
                      }`}>
                        {parseFloat(position.profitLossRate?.toString() || '0') >= 0 ? '+' : ''}{parseFloat(position.profitLossRate?.toString() || '0').toFixed(2)}%
                      </span>
                      <div className="text-xs text-slate-400">
                        {parseFloat(position.profitLossAmount?.toString() || '0') >= 0 ? '+' : ''}₩{parseFloat(position.profitLossAmount?.toString() || '0').toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-300">
                        {parseFloat(position.entryPremiumRate?.toString() || '0').toFixed(2)}%
                      </div>
                      <div className="text-xs text-slate-400">진입 시점 김프율</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(position.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-warning hover:text-yellow-400 hover:bg-warning/10"
                          title="포지션 설정 편집"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:text-red-400 hover:bg-danger/10"
                          onClick={() => onClosePosition(position.id)}
                          title="포지션 청산 (즉시 종료)"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
