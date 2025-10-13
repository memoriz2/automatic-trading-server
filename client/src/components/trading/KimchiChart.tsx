import React, { useState, useCallback, useRef, useEffect } from 'react';

interface SparkPoint {
  t: number;
  v: number;
}

interface KimchiChartProps {
  sparkData: SparkPoint[];
}

export const KimchiChart: React.FC<KimchiChartProps> = ({ sparkData }) => {
  const [chartTimeframe] = useState('1D'); // 1D로 고정
  const sparkCanvasRef = useRef<HTMLCanvasElement>(null);

  // 시간대별 데이터 필터링(타임스탬프 윈도우 + 리샘플)
  const getChartData = useCallback(() => {
    if (sparkData.length === 0) return [] as SparkPoint[];

    // 한국 시간 오전 9시 기준으로 필터링 (1D 고정)
    const koreaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    const today9AM = new Date(koreaTime);
    today9AM.setHours(9, 0, 0, 0);

    // 현재 한국 시간이 오전 9시 이전이면 어제 9시, 아니면 오늘 9시
    const startTime9AM = koreaTime.getTime() < today9AM.getTime()
      ? new Date(today9AM.getTime() - 24 * 60 * 60 * 1000)
      : today9AM;

    const t0 = startTime9AM.getTime(); // 오전 9시
    const inWindow = sparkData.filter(p => p.t >= t0);

    // 리샘플 버킷(ms): 1H=1m, 4H=5m, 1D=15m
    const bucketMs = chartTimeframe === '1H' ? 60 * 1000 : chartTimeframe === '4H' ? 5 * 60 * 1000 : 15 * 60 * 1000;
    const buckets = new Map<number, number[]>();
    for (const p of inWindow) {
      const b = Math.floor(p.t / bucketMs) * bucketMs;
      const arr = buckets.get(b) || [];
      arr.push(p.v);
      buckets.set(b, arr);
    }
    const entriesArray: Array<[number, number[]]> = Array.from(buckets.entries());
    const resampled: SparkPoint[] = entriesArray
      .sort((a, b) => a[0] - b[0])
      .map(([t, arr]) => ({ t, v: arr.reduce((sum: number, val: number) => sum + val, 0) / arr.length }));
    const limited = resampled.slice(-120);
    return limited;
  }, [sparkData, chartTimeframe]);

  // 차트 그리기 로직
  const drawSpark = useCallback(() => {
    const c = sparkCanvasRef.current;
    const data = getChartData();
    if (!c || data.length === 0) return;

    const ctx = c.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth || 300;
    const h = c.clientHeight || 60;

    // Canvas 크기 설정
    if (c.width !== w * dpr) c.width = w * dpr;
    if (c.height !== h * dpr) c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 배경 클리어
    ctx.clearRect(0, 0, w, h);

    if (data.length === 0) return;

    // 최소/최대값 계산 (값 기준)
    const min = Math.min(...data.map(d => d.v));
    const max = Math.max(...data.map(d => d.v));
    const span = Math.max(1e-9, max - min);

    // 최소/최대값 표시 업데이트
    const sparkMinEl = document.querySelector('#spark-min');
    const sparkMaxEl = document.querySelector('#spark-max');
    if (sparkMinEl) sparkMinEl.textContent = min.toFixed(2);
    if (sparkMaxEl) sparkMaxEl.textContent = max.toFixed(2);

    // 차트 그리기
    const pad = 6;
    ctx.beginPath();
    
    const firstT = data[0].t;
    const lastT = data[data.length - 1].t;
    const tSpan = Math.max(1, lastT - firstT);
    data.forEach((point, index) => {
      const x = pad + (w - 2 * pad) * ((point.t - firstT) / tSpan);
      const y = h - pad - (h - 2 * pad) * ((point.v - min) / span);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7aa2ff';
    ctx.stroke();
  }, [getChartData]);

  useEffect(() => {
    drawSpark();
    window.addEventListener('resize', drawSpark);
    return () => window.removeEventListener('resize', drawSpark);
  }, [drawSpark]);

  const detailedCanvasRef = useRef<HTMLCanvasElement>(null);

  // 상세 차트 그리기 함수
  const drawDetailedChart = useCallback(() => {
    const canvas = detailedCanvasRef.current;
    if (!canvas) {
      console.log('🎨 차트 canvas 없음');
      return;
    }

    const ctx = canvas.getContext('2d');
    const chartData = getChartData();

    console.log('🎨 차트 렌더링:', {
      hasCanvas: !!canvas,
      hasCtx: !!ctx,
      dataLength: chartData.length,
      rawDataLength: sparkData.length,
      canvasWidth: canvas.clientWidth,
      canvasHeight: canvas.clientHeight
    });

    if (!ctx) {
      console.log('🎨 차트 ctx 없음');
      return;
    }

    if (chartData.length === 0) {
      console.log('🎨 차트 데이터 없음');
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 300;
    const h = canvas.clientHeight || 200;
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    // 배경 클리어
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);
    
    if (chartData.length > 1) {
      const min = Math.min(...chartData.map(p => p.v));
      const max = Math.max(...chartData.map(p => p.v));
      const span = Math.max(0.01, max - min);

      // 여백 설정 (좌측 y축 라벨, 하단 x축 라벨 공간 확보)
      const leftPad = 44;
      const rightPad = 8;
      const topPad = 8;
      const bottomPad = 24; // x축 레이블 공간 확보
      const plotW = Math.max(1, w - leftPad - rightPad);
      const plotH = Math.max(1, h - topPad - bottomPad);

      // 그리드 + y축 라벨
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.fillStyle = '#9fb0c9';
      ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const gridCount = 5;
      for (let i = 0; i <= gridCount; i++) {
        const ratio = i / gridCount; // 0(bottom) → 1(top)
        const y = topPad + plotH * (1 - ratio);
        // 라인
        ctx.beginPath();
        ctx.moveTo(leftPad, y);
        ctx.lineTo(w - rightPad, y);
        ctx.stroke();
        // 라벨 값 (min → max 선형)
        const labelVal = min + span * ratio;
        ctx.fillText(`${labelVal.toFixed(2)}%`, leftPad - 6, y);
      }

      // 데이터 라인 그리기 (한국 시간 9시 기준 24시간)
      ctx.beginPath();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;

      // 한국 시간 오전 9시 계산 (데이터 필터링 로직과 동일)
      const koreaTime = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
      const today9AM = new Date(koreaTime);
      today9AM.setHours(9, 0, 0, 0);

      // 현재 한국 시간이 오전 9시 이전이면 어제 9시, 아니면 오늘 9시
      const startTime9AM = koreaTime.getTime() < today9AM.getTime()
        ? new Date(today9AM.getTime() - 24 * 60 * 60 * 1000)
        : today9AM;

      const t0 = startTime9AM.getTime(); // 오전 9시
      const oneDayMs = 24 * 60 * 60 * 1000;
//       const t1 = t0 + oneDayMs; // 다음날 오전 9시
      const tSpan = oneDayMs;

      chartData.forEach((point, index) => {
        const x = leftPad + (plotW * (point.t - t0)) / tSpan;
        const y = topPad + plotH * (1 - ((point.v - min) / span));
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // 현재 값 포인트
      const lastPoint = chartData[chartData.length - 1];
      const lastX = leftPad + (plotW * (lastPoint.t - t0)) / tSpan;
      const lastY = topPad + plotH * (1 - ((lastPoint.v - min) / span));
      ctx.beginPath();
      ctx.fillStyle = '#10b981';
      ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // x축 시간 레이블 (9시부터 다음날 9시까지 3시간 간격)
      ctx.fillStyle = '#9fb0c9';
      ctx.font = '11px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const labelCount = 8; // 24시간 / 3시간 = 8개
      const timeLabels = ['9', '12', '15', '18', '21', '0', '3', '6', '9'];

      for (let i = 0; i <= labelCount; i++) {
        const ratio = i / labelCount;
        const x = leftPad + plotW * ratio;
        const y = topPad + plotH + 4;

        ctx.fillText(timeLabels[i], x, y);
      }
    }
  }, [getChartData]);

  // 상세 차트 자동 업데이트
  useEffect(() => {
    drawDetailedChart();
    window.addEventListener('resize', drawDetailedChart);
    return () => window.removeEventListener('resize', drawDetailedChart);
  }, [drawDetailedChart]);

  return (
    <section className="card col-6">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 border-border" data-testid="card-premium-chart">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">김치프리미엄 차트 (24시간)</h2>
        </div>
        <div className="h-64 bg-muted rounded-lg p-4">
          <canvas
            ref={detailedCanvasRef}
            className="w-full h-full rounded"
            style={{backgroundColor: '#1e293b'}}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">평균 프리미엄</p>
            <p className="font-semibold text-primary" data-testid="text-avg-premium">
              {(() => {
                const data = getChartData();
                return data.length > 0 ? (data.reduce((sum, p) => sum + p.v, 0) / data.length).toFixed(2) : '0.00';
              })()}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">최고 프리미엄</p>
            <p className="font-semibold text-green-500" data-testid="text-max-premium">
              {(() => {
                const data = getChartData();
                return data.length > 0 ? Math.max(...data.map(p => p.v)).toFixed(2) : '0.00';
              })()}%
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">최저 프리미엄</p>
            <p className="font-semibold text-red-500" data-testid="text-min-premium">
              {(() => {
                const data = getChartData();
                return data.length > 0 ? Math.min(...data.map(p => p.v)).toFixed(2) : '0.00';
              })()}%
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
