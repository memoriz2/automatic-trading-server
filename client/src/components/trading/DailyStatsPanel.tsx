import React, { useState, useEffect } from 'react';
import { useRealTimeStats } from '@/hooks/useRealTimeStats';

// 최적화된 실시간 수수료 애니메이션 컴포넌트
const AnimatedFeeNumber: React.FC<{ value: number }> = ({ value }) => {
  const [previousValue, setPreviousValue] = useState<number>(value);
  const [animationClass, setAnimationClass] = useState<string>('text-yellow-400');
  const animationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 의미있는 변화만 애니메이션 (₩1 이상 차이)
    const significantChange = Math.abs(value - previousValue) >= 1;
    
    if (significantChange && previousValue > 0) {
      // 기존 타이머 정리
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      if (value > previousValue) {
        // 수수료 증가: 빨간색 깜빡임
        setAnimationClass('text-red-400 transition-colors duration-300');
      } else if (value < previousValue) {
        // 수수료 감소: 파란색 깜빡임
        setAnimationClass('text-blue-400 transition-colors duration-300');
      }
      
      // 디바운싱: 300ms 후 원래 색상으로 복구
      animationTimeoutRef.current = setTimeout(() => {
        setAnimationClass('text-yellow-400 transition-colors duration-300');
      }, 300);
      
      setPreviousValue(value);
    }
  }, [value, previousValue]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  return (
    <span className={animationClass}>
      ₩{Math.floor(value).toLocaleString('ko-KR')}
    </span>
  );
};

interface DailyStatsPanelProps {
  userId?: number;
  title?: string;
  className?: string;
}

/**
 * 실시간 DB 기반 일일 통계 패널 컴포넌트
 * 재사용 가능하고 자동 업데이트되는 통계 표시
 */
export const DailyStatsPanel: React.FC<DailyStatsPanelProps> = ({
  userId,
  title = "오늘의 실거래 통계",
  className = ""
}) => {
  const { stats, isLoading, error } = useRealTimeStats(userId);

  if (error) {
    return (
      <div className={`mt-4 pt-4 border-t border-slate-600 ${className}`}>
        <h4 className="text-slate-400 text-sm mb-3">{title}</h4>
        <div className="text-center text-red-400 text-sm">
          통계를 불러올 수 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-4 pt-4 border-t border-slate-600 ${className}`}>
      <h4 className="text-slate-400 text-sm mb-3">
        {title} {isLoading && <span className="text-xs">(업데이트 중...)</span>}
      </h4>
      
      {/* 첫 번째 줄: 거래 활동 지표 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center">
          <p className="text-xl font-bold text-green-400">{stats.totalTrades}</p>
          <p className="text-xs text-slate-400">총 거래</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-blue-400">{stats.entries}</p>
          <p className="text-xs text-slate-400">진입</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-orange-400">{stats.exits}</p>
          <p className="text-xs text-slate-400">청산</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-purple-400">{stats.loops}</p>
          <p className="text-xs text-slate-400">루프 수</p>
        </div>
      </div>
      
      {/* 두 번째 줄: 수익성 지표 */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="text-center">
          <p className="text-xl font-bold">
            <AnimatedFeeNumber value={stats.totalFees} />
          </p>
          <p className="text-xs text-slate-400">총 수수료 (실시간)</p>
        </div>
        <div className="text-center">
          <p className={`text-xl font-bold ${stats.totalProfitKrw >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.totalProfitKrw >= 0 ? '+' : ''}₩{Math.floor(Math.abs(stats.totalProfitKrw)).toLocaleString()}
          </p>
          <p className="text-xs text-slate-400">총 수익금</p>
        </div>
      </div>
      
    </div>
  );
};
