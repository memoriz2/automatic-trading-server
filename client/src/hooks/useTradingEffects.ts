import { useEffect, useCallback, useRef } from 'react';

export const useTradingEffects = (
  effectiveUserId: string,
  tickLight: () => Promise<void>,
  tickHeavy: () => Promise<void>
) => {
  const abortersRef = useRef<AbortController[]>([]);
  const tickLightIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tickHeavyIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cancelInflight = useCallback(() => {
    abortersRef.current.forEach(ctrl => {
      try { ctrl.abort(); } catch {}
    });
    abortersRef.current = [];
  }, []);

  // Main data polling effect
  useEffect(() => {
    if (!effectiveUserId) return;

    const startPolling = () => {
      // Light polling (every 1 second)
      tickLightIntervalRef.current = setInterval(async () => {
        try {
          await tickLight();
        } catch (error) {
          console.warn('라이트 틱 실패:', error);
        }
      }, 1000);

      // Heavy polling (every 3 seconds)
      tickHeavyIntervalRef.current = setInterval(async () => {
        try {
          await tickHeavy();
        } catch (error) {
          console.warn('헤비 틱 실패:', error);
        }
      }, 3000);
    };

    startPolling();

    return () => {
      if (tickLightIntervalRef.current) {
        clearInterval(tickLightIntervalRef.current);
        tickLightIntervalRef.current = null;
      }
      if (tickHeavyIntervalRef.current) {
        clearInterval(tickHeavyIntervalRef.current);
        tickHeavyIntervalRef.current = null;
      }
      cancelInflight();
    };
  }, [effectiveUserId, tickLight, tickHeavy, cancelInflight]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelInflight();
    };
  }, [cancelInflight]);

  return {
    cancelInflight,
    abortersRef
  };
};