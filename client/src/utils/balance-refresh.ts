/**
 * 거래 후 잔고 즉시 갱신 유틸리티
 */

import { QueryClient } from '@tanstack/react-query';

export interface TradeDetails {
  exchange?: string;
  symbol?: string;
  side?: 'buy' | 'sell';
  amount?: number;
}

/**
 * 거래 후 실제 API에서 잔고 즉시 갱신 (캐시 우회)
 */
export async function refreshBalanceAfterTrade(
  queryClient: QueryClient,
  userId: number,
  tradeDetails?: TradeDetails
): Promise<void> {
  try {
    console.log(`🔥 거래 후 실제 API 잔고 갱신 시작 (사용자: ${userId})`);
    
    if (tradeDetails) {
      console.log(`📊 거래 정보:`, tradeDetails);
    }

    // 서버에 거래 후 실제 API 잔고 갱신 요청 (캐시 우회)
    const response = await fetch('/api/v2/balance/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ 
        tradeDetails,
        forceRefresh: true // 캐시 우회 플래그
      })
    });

    if (!response.ok) {
      throw new Error(`실제 API 잔고 갱신 실패: ${response.status}`);
    }

    const result = await response.json();
    console.log(`🎯 거래 후 실제 API 잔고 갱신 완료:`, result.refreshType, '- 실제 거래소에서 최신 데이터 수신');

    // React Query 캐시 무효화 - 관련된 모든 잔고 쿼리 갱신
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [`/api/balances/${userId}`] }),
      queryClient.invalidateQueries({ queryKey: ['/api/v2/balance'] }),
      queryClient.invalidateQueries({ queryKey: [`/api/balances`] }),
    ]);

    console.log(`🚀 클라이언트 캐시 갱신 완료`);

  } catch (error) {
    console.error('❌ 거래 후 잔고 갱신 실패:', error);
    
    // 에러가 발생해도 캐시는 갱신해서 다음 정기 조회 때 업데이트되도록 함
    try {
      await queryClient.invalidateQueries({ queryKey: [`/api/balances/${userId}`] });
    } catch (cacheError) {
      console.error('❌ 캐시 갱신도 실패:', cacheError);
    }
  }
}

/**
 * 자동매매 시작/중지 시 잔고 갱신
 */
export async function refreshBalanceAfterTradingAction(
  queryClient: QueryClient,
  userId: number,
  action: 'start' | 'stop' | 'emergency-stop'
): Promise<void> {
  const tradeDetails: TradeDetails = {
    exchange: action === 'emergency-stop' ? 'emergency' : 'auto-trading',
    side: action === 'start' ? 'buy' : 'sell',
    symbol: action
  };

  await refreshBalanceAfterTrade(queryClient, userId, tradeDetails);
}

/**
 * 수동 주문 후 잔고 갱신
 */
export async function refreshBalanceAfterOrder(
  queryClient: QueryClient,
  userId: number,
  orderDetails: {
    exchange: string;
    symbol: string;
    side: 'buy' | 'sell';
    amount: number;
  }
): Promise<void> {
  await refreshBalanceAfterTrade(queryClient, userId, orderDetails);
}

/**
 * 포지션 청산 후 잔고 갱신
 */
export async function refreshBalanceAfterClose(
  queryClient: QueryClient,
  userId: number,
  closeDetails: {
    exchange: string;
    symbol: string;
    amount: number;
  }
): Promise<void> {
  await refreshBalanceAfterTrade(queryClient, userId, {
    ...closeDetails,
    side: 'sell' // 청산은 항상 매도
  });
}
