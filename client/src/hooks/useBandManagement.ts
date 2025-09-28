import { useState, useCallback } from 'react';

export interface Band {
  name?: string;
  target_kimp?: number | string;
  exit_kimp?: number | string;
  tolerance?: number | string;
  leverage?: number | string;
  amount_btc?: number | string;
  serverId?: string | number;
}

export function useBandManagement() {
  const [bands, setBands] = useState<Band[]>([]);
  const [serverBands, setServerBands] = useState<any[]>([]);
  const [serverStatusBands, setServerStatusBands] = useState<any[]>([]);
  const [registeringIndex, setRegisteringIndex] = useState<number | null>(null);
  const [unregisteringIndex, setUnregisteringIndex] = useState<number | null>(null);

  const addBand = useCallback(() => {
    setBands(prev => [...prev, {
      name: `Band ${prev.length + 1}`,
      target_kimp: '',
      exit_kimp: '',
      tolerance: '0.1',
      leverage: '1',
      amount_btc: ''
    }]);
  }, []);

  const updateBand = useCallback((index: number, field: keyof Band, value: string | number) => {
    setBands(prev => prev.map((band, i) =>
      i === index ? { ...band, [field]: value } : band
    ));
  }, []);

  const removeBand = useCallback((index: number) => {
    setBands(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    bands,
    setBands,
    serverBands,
    setServerBands,
    serverStatusBands,
    setServerStatusBands,
    registeringIndex,
    setRegisteringIndex,
    unregisteringIndex,
    setUnregisteringIndex,
    addBand,
    updateBand,
    removeBand
  };
}