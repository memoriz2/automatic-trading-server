import { useState, useCallback } from 'react';
import { useToast } from './use-toast';

export interface PositionEntryRequest {
  strategyId: number;
  symbol: string;
  side: 'buy' | 'sell' | 'short' | 'cover';
  exchange: 'upbit' | 'binance';
  deviceId?: string;
  deviceType?: string;
}

export interface ExistingPosition {
  id: number;
  symbol: string;
  side: string;
  entryTime: string;
  unrealizedPnl: number;
}

export interface PositionEntryResponse {
  allowed: boolean;
  message?: string;
  error?: string;
  existingPosition?: ExistingPosition;
  suggestedApi?: string;
  deviceInfo?: {
    deviceId: string;
    deviceType: string;
  };
}

export function usePositionEntry() {
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  // 디바이스 타입 감지
  const getDeviceType = useCallback((): 'mobile' | 'tablet' | 'desktop' => {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }, []);

  // 디바이스 ID 가져오기
  const getDeviceId = useCallback((): string => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }, []);

  // 포지션 진입 가능 여부 확인
  const checkEntryAllowed = useCallback(async (request: Omit<PositionEntryRequest, 'deviceId' | 'deviceType'>): Promise<PositionEntryResponse> => {
    setIsChecking(true);
    
    try {
      const deviceId = getDeviceId();
      const deviceType = getDeviceType();
      
      const fullRequest: PositionEntryRequest = {
        ...request,
        deviceId,
        deviceType
      };

      console.log('🔍 포지션 진입 가능 여부 확인:', fullRequest);

      const response = await fetch('/api/trading/enter-position', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Device-Id': deviceId
        },
        credentials: 'include',
        body: JSON.stringify(fullRequest)
      });

      const result: PositionEntryResponse = await response.json();

      if (!response.ok) {
        // 중복 포지션이 있는 경우
        if (result.existingPosition) {
          toast({
            title: "진입 불가",
            description: result.error || "이미 활성 포지션이 있습니다.",
            variant: "destructive",
            duration: 5000
          });
        } else {
          toast({
            title: "오류",
            description: result.error || "포지션 진입 확인 중 오류가 발생했습니다.",
            variant: "destructive"
          });
        }
        return { ...result, allowed: false };
      }

      // 진입 허용
      console.log('✅ 포지션 진입 허용:', result);
      return { ...result, allowed: true };

    } catch (error) {
      console.error('❌ 포지션 진입 확인 실패:', error);
      toast({
        title: "네트워크 오류",
        description: "포지션 진입 확인 중 네트워크 오류가 발생했습니다.",
        variant: "destructive"
      });
      return { 
        allowed: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류' 
      };
    } finally {
      setIsChecking(false);
    }
  }, [getDeviceId, getDeviceType, toast]);

  // 안전한 포지션 진입 (확인 후 실행)
  const safeEnterPosition = useCallback(async (
    request: Omit<PositionEntryRequest, 'deviceId' | 'deviceType'>,
    executeEntry: () => Promise<any>
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      // 1. 진입 가능 여부 확인
      const entryCheck = await checkEntryAllowed(request);
      
      if (!entryCheck.allowed) {
        return { 
          success: false, 
          error: entryCheck.error || '포지션 진입이 허용되지 않습니다.' 
        };
      }

      // 2. 진입 허용된 경우 실제 거래 실행
      console.log('🚀 포지션 진입 실행:', request);
      const result = await executeEntry();
      
      toast({
        title: "포지션 진입 성공",
        description: `${request.symbol} ${request.side} 포지션이 생성되었습니다.`,
        variant: "default"
      });

      return { success: true, data: result };

    } catch (error) {
      console.error('❌ 안전한 포지션 진입 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      
      toast({
        title: "포지션 진입 실패",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error: errorMessage };
    }
  }, [checkEntryAllowed, toast]);

  return {
    isChecking,
    checkEntryAllowed,
    safeEnterPosition,
    getDeviceId,
    getDeviceType
  };
}
