import { useCallback, useRef, useEffect } from 'react';
import { apiFetchJson } from '@/lib/queryClient';
import { isNum } from '@/utils/trading/formatters';

export const useTradingPolling = (
  effectiveUserId: string,
  setKimp: any,
  setSparkData: any,
  setBalances: any,
  setMetrics: any,
  setServerState: any,
  setServerBands: any,
  setServerStatusBands: any,
  setNetMs: any,
  setNetOk: any,
  setErrCount: any,
  refreshTrigger: number
) => {
  const intervals = useRef<NodeJS.Timeout[]>([]);

  const tickLight = useCallback(async () => {
    const start = performance.now();

    try {
      const data = await apiFetchJson('/api/kimga/current');
      const end = performance.now();
      const ms = Math.round(end - start);

      setNetMs(ms);
      setNetOk(true);
      setErrCount(0);

      if (data && typeof data === 'object' && (data.upbit_price > 0 || data.binance_price > 0)) {
        setKimp({
          upbit_price: data.upbit_price || 0,
          binance_price: data.binance_price || 0,
          usdkrw: data.usdkrw || 0,
          kimp: data.kimp || 0,
          timestamp: data.timestamp || new Date().toISOString()
        });

        if (isNum(data.kimp)) {
          setSparkData((prev: any[]) => {
            const next = { t: Date.now(), v: Number(data.kimp) };
            const newData = [...prev, next];

            const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
            const filtered = newData.filter(point => point.t > oneDayAgo).slice(-5000);

            if (filtered.length % 100 === 0) {
              try {
                localStorage.setItem(`kimchi-chart-data-${effectiveUserId}`, JSON.stringify(filtered));
              } catch (error) {
                console.error('차트 데이터 저장 실패:', error);
              }
            }

            return filtered;
          });
        }
      }
    } catch (error) {
      const end = performance.now();
      const ms = Math.round(end - start);

      setNetMs(ms);
      setNetOk(false);
      setErrCount((prev: number) => prev + 1);

      console.warn('김치 데이터 가져오기 실패:', error);
    }
  }, [effectiveUserId, setKimp, setSparkData, setNetMs, setNetOk, setErrCount]);

  const tickHeavy = useCallback(async () => {
    try {
      const [balancesData, metricsData, serverStateData, serverBandsData] = await Promise.all([
        apiFetchJson('/api/balances').catch(() => ({ real: {}, connected: {} })),
        apiFetchJson('/api/metrics').catch(() => ({})),
        apiFetchJson('/api/server-state').catch(() => ({})),
        apiFetchJson('/api/server-bands').catch(() => ({ bands: [], statusBands: [] }))
      ]);

      setBalances(balancesData);
      setMetrics(metricsData);

      if (serverBandsData) {
        setServerBands(serverBandsData.bands || []);
        setServerStatusBands(serverBandsData.statusBands || []);
      }

      // serverState 안전한 업데이트
      if (serverStateData && typeof serverStateData === 'object') {
        setServerState({
          running: serverStateData.running || false,
          status: serverStateData.status || 'stopped',
          ...serverStateData
        });
      }
    } catch (error) {
      console.warn('Heavy tick 실패:', error);
    }
  }, [setBalances, setMetrics, setServerState, setServerBands, setServerStatusBands]);

  const startPolling = useCallback(() => {
    intervals.current.forEach(clearInterval);
    intervals.current = [];

    intervals.current.push(setInterval(tickLight, 3000));
    intervals.current.push(setInterval(tickHeavy, 10000));

    tickLight();
    tickHeavy();
  }, [tickLight, tickHeavy]);

  const stopPolling = useCallback(() => {
    intervals.current.forEach(clearInterval);
    intervals.current = [];
  }, []);

  const refreshServerBands = useCallback(async () => {
    try {
      const data = await apiFetchJson('/api/server-bands');
      if (data) {
        setServerBands(data.bands || []);
        setServerStatusBands(data.statusBands || []);
      }
    } catch (error) {
      console.warn('서버 밴드 새로고침 실패:', error);
    }
  }, [setServerBands, setServerStatusBands]);

  useEffect(() => {
    startPolling();
    return stopPolling;
  }, [startPolling, stopPolling, refreshTrigger]);

  return {
    tickLight,
    tickHeavy,
    startPolling,
    stopPolling,
    refreshServerBands
  };
};