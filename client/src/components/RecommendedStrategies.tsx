import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, Shield, Clock } from 'lucide-react';

interface AIInsight {
  id: number;
  insight_type: string;
  insight_text: string;
  created_at: string;
}

interface Strategy {
  id: number;
  name: string;
  entryRate: number;
  targetRate: number;
  leverage: number;
  stopLoss: number;
  maxHoldTime: number; // hours
  positionSize: number; // percentage
  score: number;
  isBest: boolean;
  reason: string;
}

export const RecommendedStrategies: React.FC = () => {
  const [latestInsight, setLatestInsight] = useState<AIInsight | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // AI 인사이트 조회
      const insightRes = await fetch('/api/ai-insights/latest', {
        credentials: 'include'
      });
      if (insightRes.ok) {
        const insight = await insightRes.json();
        setLatestInsight(insight);
      }

      // 추천 전략 조회
      const strategyRes = await fetch('/api/recommended-strategies', {
        credentials: 'include'
      });
      if (strategyRes.ok) {
        const data = await strategyRes.json();
        setStrategies(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        데이터 로딩 중...
      </div>
    );
  }

  const bestStrategies = strategies.filter(s => s.isBest);
  const otherStrategies = strategies.filter(s => !s.isBest);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
          <Sparkles className="text-yellow-400" />
          AI 추천 전략
        </h1>
        <p className="text-slate-400">클로드 AI가 수익 데이터를 분석하여 제안하는 최적의 트레이딩 전략</p>
      </div>

      {/* AI 인사이트 섹션 */}
      {latestInsight && (
        <Card className="mb-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-400 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              최신 AI 인사이트
              <Badge variant="outline" className="ml-auto text-xs">
                {new Date(latestInsight.created_at).toLocaleDateString('ko-KR')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
              {latestInsight.insight_text}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Best 3 전략 */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="text-green-400" />
          🏆 Best 3 추천 전략
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bestStrategies.map((strategy, index) => (
            <Card key={strategy.id} className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-500/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-green-400">
                    {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} {strategy.name}
                  </CardTitle>
                  <Badge variant="default" className="bg-green-600">
                    점수: {strategy.score}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-slate-400 text-xs">진입 김프율</p>
                    <p className="text-white font-bold">{strategy.entryRate}%</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-slate-400 text-xs">목표 수익률</p>
                    <p className="text-white font-bold">{strategy.targetRate}%</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-slate-400 text-xs">레버리지</p>
                    <p className="text-white font-bold">{strategy.leverage}배</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-slate-400 text-xs">손절률</p>
                    <p className="text-red-400 font-bold">{strategy.stopLoss}%</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-slate-400 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      최대 보유
                    </p>
                    <p className="text-white font-bold">{strategy.maxHoldTime}시간</p>
                  </div>
                  <div className="bg-slate-800/50 p-2 rounded">
                    <p className="text-slate-400 text-xs">포지션 크기</p>
                    <p className="text-white font-bold">{strategy.positionSize}%</p>
                  </div>
                </div>
                <div className="bg-blue-900/30 p-3 rounded border border-blue-500/30">
                  <p className="text-xs text-blue-300 font-medium mb-1 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    추천 이유
                  </p>
                  <p className="text-xs text-slate-300">{strategy.reason}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 기타 전략 */}
      {otherStrategies.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">기타 추천 전략</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherStrategies.map((strategy) => (
              <Card key={strategy.id} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base text-white">{strategy.name}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      점수: {strategy.score}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-slate-400">진입</p>
                      <p className="text-white font-bold">{strategy.entryRate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">목표</p>
                      <p className="text-white font-bold">{strategy.targetRate}%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-slate-400">레버리지</p>
                      <p className="text-white font-bold">{strategy.leverage}배</p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
                    {strategy.reason}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
