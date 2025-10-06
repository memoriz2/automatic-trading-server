import { useState, useEffect, useRef} from 'react';
import { LiveTrade, LivePosition, LiveBalance } from '@/types/trading';

interface UseLiveTradingProps {
  userId: string;
  liveBalances: any[];
}

export const useLiveTrading = ({
  userId,
  liveBalances
}: UseLiveTradingProps) => {
//   const { toast } = useToast();

  // State
  const [liveBalance, setLiveBalance] = useState<LiveBalance>({
    krw: 0,
    btc: 0,
    usdt: 0,
    binanceBtc: 0,
    binanceSpotBtc: 0,
    binanceUsdt: 0
  });

  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);
  const [livePositions, setLivePositions] = useState<LivePosition[]>([]);
  const [tradeCounter, setTradeCounter] = useState(0);

  // Refs for preventing duplicate entries
  const processingEntryRef = useRef<Set<string>>(new Set());
  const tradingLockRef = useRef(false);
  const lastActionAtRef = useRef<{[key: string]: number}>({});
  const prevPremiumRef = useRef<number | null>(null);

  // Rate limiting refs
  const lastPriceDataWarningRef = useRef<number>(0);
  const lastReentryToastAtRef = useRef<number>(0);

  // Initialize balance from props
  useEffect(() => {
    if (liveBalances && liveBalances.length > 0) {
      const upbitBalance = liveBalances.find(b => b.exchange === 'upbit');
      const binanceBalance = liveBalances.find(b => b.exchange === 'binance');

      setLiveBalance({
        krw: parseFloat(upbitBalance?.krw || '0'),
        btc: parseFloat(upbitBalance?.btc || '0'),
        usdt: parseFloat(binanceBalance?.usdt || '0'),
        binanceBtc: parseFloat(binanceBalance?.btc || '0'),
        binanceSpotBtc: 0,
        binanceUsdt: parseFloat(binanceBalance?.usdt || '0')
      });
    }
  }, [liveBalances]);

  // Load positions from DB
  useEffect(() => {
    if (userId) {
      const fetchDbPositions = async () => {
        try {
          const response = await fetch('/api/positions', {
            credentials: 'include'
          });

          if (response.ok) {
            const dbPositions = await response.json();
            const convertedPositions: LivePosition[] = dbPositions.map((pos: any) => ({
              id: `db-${pos.id}`,
              strategyId: pos.strategy_id,
              strategyName: pos.strategy_name || `전략 #${pos.strategy_id}`,
              symbol: pos.symbol,
              entryTime: new Date(pos.entry_time),
              entryPremiumRate: pos.entry_premium_rate || 0,
              upbitQuantity: pos.quantity || 0,
              upbitPrice: pos.entry_price || 0,
              entryUsdKrw: 1394,
              binanceSpotQuantity: 0,
              binanceQuantity: pos.quantity || 0,
              binancePrice: pos.binance_entry_price || pos.binance_price_usd || pos.entry_price || 0,
              binanceSpotPrice: 0,
              status: pos.status === 'closed' ? 'closed' : 'open',
              exitTime: pos.exit_time ? new Date(pos.exit_time) : undefined,
              exitPremiumRate: pos.exit_premium_rate || 0,
              realizedPnL: pos.realized_pnl || 0
            }));

            setLivePositions(convertedPositions);
          }
        } catch (error) {
          console.error('❌ DB 포지션 조회 실패:', error);
        }
      };

      fetchDbPositions();
    }
  }, [userId]);

  return {
    liveBalance,
    setLiveBalance,
    liveTrades,
    setLiveTrades,
    livePositions,
    setLivePositions,
    tradeCounter,
    setTradeCounter,
    processingEntryRef,
    tradingLockRef,
    lastActionAtRef,
    prevPremiumRef,
    lastPriceDataWarningRef,
    lastReentryToastAtRef
  };
};