import { useCallback } from 'react';
import { Band } from '@/utils/trading/band-utils';

export const useLegacyTradingHandlers = (
  setBands: any,
  toast: any,
  bands: Band[],
  user: any,
  effectiveUserId: string,
  fetchJson: any,
  setRegisteringIndex: any,
  setUnregisteringIndex: any,
  setStarting: any,
  serverState: any
) => {
  const handleAddBand = useCallback(() => {
    setBands((prevBands: Band[]) => {
      const idx = prevBands.length + 1;
      return [...prevBands, {
        name: `B${idx}`,
        target_kimp: 0.0,
        exit_kimp: 0.0,
        tolerance: 0.05,
        leverage: 1,
        amount_btc: 0.000
      }];
    });
  }, [setBands]);

  const handleBandChange = useCallback((index: number, key: keyof Band, value: string | number) => {
    setBands((prevBands: Band[]) => {
      const newBands = [...prevBands];
      const bandToUpdate = { ...newBands[index] };
      (bandToUpdate[key] as any) = value;
      newBands[index] = bandToUpdate;
      return newBands;
    });
  }, [setBands]);

  const handleSaveBands = useCallback(() => {
    try {
      localStorage.setItem('kimp_cfg_bands_v2', JSON.stringify({ bands }));
      toast({ title: '설정 저장 완료', description: '브라우저 로컬에 저장되었습니다.' });
    } catch (e) {
      console.error(e);
      toast({ title: '저장 실패', description: String(e), variant: 'destructive' });
    }
  }, [bands, toast]);

  const handleLoadBands = useCallback(async () => {
    try {
      if (!user?.id && !effectiveUserId) {
        console.warn('⏸️ 세션 미확정: 서버 밴드 로드를 보류합니다.');
        return;
      }

      const targetUserId = user?.id ? String(user.id) : String(effectiveUserId);
      const primary = await fetchJson(`/api/trading-strategies/${targetUserId}`);

      if (Array.isArray(primary) && primary.length > 0) {
        setBands(primary);
        try {
          localStorage.setItem('kimp_cfg_bands_v2', JSON.stringify({ bands: primary }));
        } catch {}
        toast({ title: '불러오기 완료', description: '세션 사용자 전략을 적용했습니다.' });
        return;
      }

      const raw = localStorage.getItem('kimp_cfg_bands_v2');
      if (raw) {
        try {
          const j = JSON.parse(raw);
          const existing = j.bands || [];
          setBands(existing);
          toast({ title: '로컬 설정 로드', description: '브라우저 저장된 설정을 복원했습니다.' });
        } catch {
          setBands([]);
          toast({ title: '설정 없음', description: '저장된 설정이 없어 빈 목록으로 시작합니다.' });
        }
      } else {
        setBands([]);
        toast({ title: '설정 없음', description: '저장된 설정이 없어 빈 목록으로 시작합니다.' });
      }
    } catch (error) {
      console.error('전략 로드 실패:', error);
      toast({ title: '로드 실패', description: '전략을 불러오는 중 오류가 발생했습니다.', variant: 'destructive' });
    }
  }, [user?.id, effectiveUserId, fetchJson, setBands, toast]);

  const handleDeleteBand = useCallback((indexToDelete: number) => {
    setBands((prevBands: Band[]) => prevBands.filter((_, i) => i !== indexToDelete));
  }, [setBands]);

  const handleRegisterBand = useCallback(async (index: number) => {
    setRegisteringIndex(index);
    try {
      const band = bands[index];
      if (!band) {
        toast({ title: '밴드 등록 실패', description: '밴드 정보를 찾을 수 없습니다.', variant: 'destructive' });
        return;
      }

      const payload = {
        name: band.name || `B${index + 1}`,
        target_kimp: Number(band.target_kimp) || 0,
        exit_kimp: Number(band.exit_kimp) || 0,
        tolerance: Number(band.tolerance) || 0.05,
        leverage: Number(band.leverage) || 1,
        amount_btc: Number(band.amount_btc) || 0.001
      };

      const response = await fetchJson('/api/bands/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response?.success) {
        toast({ title: '밴드 등록 성공', description: `${payload.name} 밴드가 등록되었습니다.` });
      } else {
        throw new Error(response?.message || '등록 실패');
      }
    } catch (error) {
      console.error('밴드 등록 실패:', error);
      toast({
        title: '밴드 등록 실패',
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setRegisteringIndex(null);
    }
  }, [bands, fetchJson, toast, setRegisteringIndex]);

  const handleUnregisterBandAt = useCallback(async (index: number) => {
    setUnregisteringIndex(index);
    try {
      const band = bands[index];
      const bandName = band?.name || `B${index + 1}`;

      const response = await fetchJson(`/api/bands/unregister/${encodeURIComponent(bandName)}`, {
        method: 'DELETE'
      });

      if (response?.success) {
        toast({ title: '밴드 해제 성공', description: `${bandName} 밴드가 해제되었습니다.` });
      } else {
        throw new Error(response?.message || '해제 실패');
      }
    } catch (error) {
      console.error('밴드 해제 실패:', error);
      toast({
        title: '밴드 해제 실패',
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setUnregisteringIndex(null);
    }
  }, [bands, fetchJson, toast, setUnregisteringIndex]);

  const handleStart = useCallback(async () => {
    setStarting(true);
    try {
      const response = await fetchJson('/api/start-trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response?.success) {
        toast({
          title: '자동매매 시작',
          description: '자동매매가 시작되었습니다.',
          variant: 'default'
        });
      } else {
        throw new Error(response?.message || '시작 실패');
      }
    } catch (error) {
      console.error('자동매매 시작 실패:', error);
      toast({
        title: '시작 실패',
        description: String(error),
        variant: 'destructive'
      });
    } finally {
      setStarting(false);
    }
  }, [fetchJson, toast, setStarting]);

  const handleStop = useCallback(async () => {
    try {
      const response = await fetchJson('/api/stop-trading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response?.success) {
        toast({
          title: '자동매매 정지',
          description: '자동매매가 정지되었습니다.',
          variant: 'default'
        });
      } else {
        throw new Error(response?.message || '정지 실패');
      }
    } catch (error) {
      console.error('자동매매 정지 실패:', error);
      toast({
        title: '정지 실패',
        description: String(error),
        variant: 'destructive'
      });
    }
  }, [fetchJson, toast]);

  const handleCheckSession = useCallback(async () => {
    try {
      await fetchJson('/api/check-session');
      toast({ title: '세션 확인 완료', description: '세션이 유효합니다.' });
    } catch (error) {
      toast({ title: '세션 오류', description: '세션을 확인할 수 없습니다.', variant: 'destructive' });
    }
  }, [fetchJson, toast]);

  return {
    handleAddBand,
    handleBandChange,
    handleSaveBands,
    handleLoadBands,
    handleDeleteBand,
    handleRegisterBand,
    handleUnregisterBandAt,
    handleStart,
    handleStop,
    handleCheckSession
  };
};