import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import './legacy-auto-trading.css';

interface Band {
  name?: string;
  target_kimp?: number | string;
  exit_kimp?: number | string;
  tolerance?: number | string;
  leverage?: number | string;
  amount_btc?: number | string;
}

// ===== Helpers (컴포넌트 외부 또는 내부에 정의) =====
const isNum = (v: any): v is number => typeof v === 'number' && isFinite(v);
const fx = (v: number | undefined | null, n = 2) => (isNum(v) ? Number(v).toFixed(n) : '-');
const loc = (v: number | undefined | null) => (isNum(v) ? Number(v).toLocaleString() : '-');
const floorQty = (q: number | string | undefined | null) => Math.floor((Number(q) || 0) / 0.001) * 0.001;

const LegacyAutoTradingPage = () => {
  // 인증 정보
  const { user } = useAuth();
  const userId = user?.id || "1"; // 세션에서 사용자 ID 가져오기 (기본값: "1")
  
  // 상태 관리 (useState)
  const [bands, setBands] = useState<Band[]>([]);
  const [sparkData, setSparkData] = useState<number[]>([]);
  const [logs, setLogs] = useState('Loading...');
  const [kimp, setKimp] = useState<any>({});
  const [balances, setBalances] = useState<any>({ real: {}, connected: {} });
  const [metrics, setMetrics] = useState<any>({});
  const [serverState, setServerState] = useState<any>({});
  const [serverBands, setServerBands] = useState<any[]>([]);
  const [registeringIndex, setRegisteringIndex] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);

  // DOM 요소 참조 (useRef)
  const bandTbodyRef = useRef<HTMLTableSectionElement>(null);
  const sparkCanvasRef = useRef<HTMLCanvasElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // --- REFS ---
  const bandRefs = useRef<Array<HTMLTableRowElement | null>>([]);

  // useEffect를 사용하여 초기화 및 폴링 로직을 설정합니다.
  useEffect(() => {
    // 초기 밴드 데이터 로드
    const raw = localStorage.getItem('kimp_cfg_bands_v2');
    if (raw) {
      try {
        const j = JSON.parse(raw);
        setBands(j.bands || []);
      } catch {
        setBands([]);
      }
    } else {
      setBands([]);
    }

    // 폴링 시작 (나중에 구현)
    // startPolling();

    // 컴포넌트 언마운트 시 폴링 중지
    // return () => stopPolling();
  }, []); // 빈 배열은 컴포넌트 마운트 시 한 번만 실행됨을 의미

  // ===== API Helper =====
  const fetchJson = useCallback(async (url: string, opt = {}) => {
    // API 경로를 동적으로 변경
    const apiBase = (url.startsWith('/api/trading-strategies') || url.startsWith('/api/trading/status') || url.startsWith('/api/trading/start') || url.startsWith('/api/trading/stop') || url.startsWith('/api/trading/emergency-stop')) ? '' : '/api/kimpga';
    
    // 세션 기반 인증을 위해 헤더에 사용자 정보 추가
    const headers = {
      'Content-Type': 'application/json',
      'X-User-ID': String(userId), // 사용자 ID를 문자열로 헤더에 추가
      ...(opt as any)?.headers
    };
    // 캐시 방지: balance/metrics 요청엔 no-store와 nocache 쿼리 부여
    const isKimpga = apiBase === '/api/kimpga';
    const isNoCacheTarget = isKimpga && (url === '/balance' || url === '/metrics');
    const ts = Date.now();
    const finalUrl = isNoCacheTarget ? `${apiBase}${url}?_=${ts}` : `${apiBase}${url}`;
    const r = await fetch(finalUrl, { ...opt, headers, cache: isNoCacheTarget ? 'no-store' : (opt as any)?.cache });
    if (!r.ok) {
      const errorBody = await r.text();
      console.error('API Error:', errorBody);
      throw new Error(`${finalUrl} ${r.status} ${errorBody}`);
    }
    return r.json();
  }, [userId]);

  // ===== 미리보기 원형 차트 =====
  const createCircleHTML = useCallback((label: string, valueText: string, sizePx: number) => {
    return `
      <div class="circle" style="width:${sizePx}px;height:${sizePx}px;display:grid;place-items:center;border-radius:999px;border:1px solid var(--border);background:#0a1220;box-shadow:var(--shadow)">
        <div style="text-align:center">
          <small style="display:block;font-size:10px;color:#9db0d0">${label}</small>
          <strong style="font-size:12px">${valueText}</strong>
        </div>
      </div>
    `;
  }, []);

  const updatePreviewForRow = useCallback((tr: HTMLTableRowElement) => {
    const amtInput = tr.querySelector('input[data-k="amount_btc"]') as HTMLInputElement;
    const levInput = tr.querySelector('input[data-k="leverage"]') as HTMLInputElement;
    const holder = tr.querySelector('[data-size]') as HTMLElement;
    
    if (!amtInput || !levInput || !holder) return;

    const qty = floorQty(parseFloat(amtInput.value) || 0);
    const lev = Math.max(1, parseInt(levInput.value || '3', 10));
    
    // 실시간 가격 데이터 사용
    const currentUpbitPrice = kimp.upbit_price || 0;
    const currentBinancePrice = kimp.binance_price || 0;
    
    // 디버깅: 가격 데이터 확인
    console.log('🔍 미리보기 가격 데이터:', {
      kimp_full: kimp,
      currentUpbitPrice,
      currentBinancePrice,
      qty,
      lev
    });
    
    // 현재 가격 정보가 없으면 기본 표시
    if (!isNum(currentUpbitPrice) || !isNum(currentBinancePrice) || qty <= 0) {
      holder.innerHTML = '<span class="badge">-</span>';
      return;
    }

    const UPBIT_TAKER_FEE = 0.0005;
    const krwGross = Math.ceil((qty * currentUpbitPrice) / (1 - UPBIT_TAKER_FEE));
    const usdtMargin = (qty * currentBinancePrice) / lev;

    // 원형 차트 크기 계산 (상대적 크기)
    const kN = krwGross / 1_000_000; // 백만원 단위
    const uN = usdtMargin / 100; // 100달러 단위
    const maxN = Math.max(kN, uN, 0.0001);
    const base = 22, span = 44;
    const kSize = Math.round(base + span * (kN / maxN));
    const uSize = Math.round(base + span * (uN / maxN));

    holder.innerHTML = `
      <div class="circle-wrap" style="display:flex;gap:12px;align-items:center" title="가격과 레버리지에 따라 미리보기가 변합니다.">
        ${createCircleHTML('Upbit KRW', `${krwGross.toLocaleString()}₩`, kSize)}
        ${createCircleHTML('Binance USDT', `${usdtMargin.toFixed(2)}$`, uSize)}
      </div>
    `;
  }, [kimp.upbit_price, kimp.binance_price, createCircleHTML]);

  // ===== Data Fetching & Polling Functions =====
  const tickLight = useCallback(async () => {
    try {
      const k = await fetchJson('/current');
      setKimp(k);
      if (isNum(k.kimp)) {
        setSparkData(prev => {
          const newData = [...prev, k.kimp];
          // 최대 180개 포인트 유지 (약 60초 분량)
          return newData.slice(-180);
        });
      }
      
      // 가격 업데이트 시 모든 밴드 행의 미리보기 업데이트
      setTimeout(() => {
        const bandRows = document.querySelectorAll('#band-tbody tr');
        bandRows.forEach((row) => {
          if (row instanceof HTMLTableRowElement) {
            updatePreviewForRow(row);
          }
        });
      }, 0);
    } catch (e) { 
      console.error('tickLight 오류:', e); 
    }
  }, [fetchJson, updatePreviewForRow]);

  // ===== 진입 증거금 계산 =====
  const updateUsedMarginFromStatus = useCallback((status: any) => {
    try {
      const usedUsdtEl = document.querySelector('#used-usdt');
      if (!usedUsdtEl) return;

      const bands = Array.isArray(status?.bands) ? status.bands : [];
      if (!bands.length) {
        usedUsdtEl.textContent = '-';
        return;
      }

      // 최신 바이낸스 선물가격 사용
      const binancePrice = isNum(kimp.binance_price) ? kimp.binance_price : NaN;
      if (!isNum(binancePrice) || binancePrice <= 0) {
        usedUsdtEl.textContent = '-';
        return;
      }

      let totalUsedMargin = 0;
      for (const band of bands) {
        const state = band?.state;
        const qty = Number(band?.filled_qty || 0);
        const leverage = Math.max(1, parseInt(band?.leverage ?? 3, 10));
        
        if ((state === 'entered' || state === 'hedging') && qty > 0 && isFinite(leverage)) {
          // 증거금 = 명목가치 / 레버리지
          totalUsedMargin += (qty * binancePrice) / leverage;
        }
      }

      usedUsdtEl.textContent = totalUsedMargin > 0 ? totalUsedMargin.toFixed(2) : '-';
    } catch (error) {
      const usedUsdtEl = document.querySelector('#used-usdt');
      if (usedUsdtEl) usedUsdtEl.textContent = '-';
    }
  }, [kimp.binance_price]);

  const tickHeavy = useCallback(async () => {
    try {
      const [bal, met, stat] = await Promise.all([
        fetchJson('/balance'), // kimpga의 잔고 조회 유지 (UI 호환성)
        fetchJson('/metrics'), // kimpga의 메트릭 유지 (UI 호환성)
        fetchJson(`/api/trading/status/${userId}`), // 최신 API로 상태 조회 변경
      ]);
      setBalances(bal);
      setMetrics(met);
      // 최신 API 응답 형식({ isRunning: boolean })에 맞게 상태 업데이트
      setServerState({ running: stat.isRunning, ...stat });
      
      // 진입 증거금 업데이트
      updateUsedMarginFromStatus(stat);
    } catch (e) { console.error(e); }
  }, [fetchJson, updateUsedMarginFromStatus, userId]);

  const refreshServerBands = useCallback(async () => {
    try {
      const serverData = await fetchJson(`/api/trading-strategies/${userId}`);
      setServerBands(serverData || []);
    } catch (e) {
      console.error('Failed to fetch server bands', e);
    }
  }, [fetchJson, userId]);

  // ===== Toast 알림 시스템 =====
  const showToast = useCallback((title: string, message: string = '', isSuccess: boolean = true) => {
    const toastContainer = document.querySelector('#toasts');
    if (!toastContainer) return;

    const toastEl = document.createElement('div');
    toastEl.className = `toast ${isSuccess ? 'ok' : 'err'}`;
    toastEl.style.cssText = `
      position: fixed; right: 16px; bottom: 16px; 
      background: #0b1320; border: 1px solid #1e2a42; 
      padding: 10px 12px; border-radius: 12px; 
      box-shadow: 0 10px 30px rgba(0,0,0,.35); 
      max-width: 360px; z-index: 60; color: #e2e8f0;
      opacity: 1; transition: opacity 0.3s ease;
    `;
    
    toastEl.innerHTML = `
      <div style="font-weight: 800; margin-bottom: 4px">${title}</div>
      <div style="font-size: 12px; color: #9fb0c9">${message}</div>
    `;

    toastContainer.appendChild(toastEl);

    // 3.2초 후 자동 제거
    setTimeout(() => {
      toastEl.style.opacity = '0';
      setTimeout(() => {
        if (toastContainer.contains(toastEl)) {
          toastContainer.removeChild(toastEl);
        }
      }, 300);
    }, 3200);
  }, []);

  // ===== Component Event Handlers =====
  const handleAddBand = useCallback(() => {
    setBands(prevBands => {
      const idx = prevBands.length + 1;
      return [...prevBands, { name: `B${idx}`, target_kimp: 0, exit_kimp: 0.2, tolerance: 0.1, leverage: 3, amount_btc: 0.001 }];
    });
  }, []);

  const handleBandChange = useCallback((index: number, key: keyof Band, value: string | number) => {
    setBands(prevBands => {
      const newBands = [...prevBands];
      const bandToUpdate = { ...newBands[index] };
      (bandToUpdate[key] as any) = value;
      newBands[index] = bandToUpdate;
      return newBands;
    });
  }, []);

  const handleSaveBands = useCallback(() => {
    try {
      localStorage.setItem('kimp_cfg_bands_v2', JSON.stringify({ bands: bands }));
      showToast('설정 저장 완료', '브라우저 로컬에 저장되었습니다.');
    } catch (e) {
      console.error(e);
      showToast('저장 실패', String(e), false);
    }
  }, [bands, showToast]);

  const handleLoadBands = useCallback(() => {
    const raw = localStorage.getItem('kimp_cfg_bands_v2');
    if (raw) {
      try {
        const j = JSON.parse(raw);
        setBands(j.bands || []);
      } catch (e) {
        console.error("저장된 밴드 데이터를 불러오는 데 실패했습니다.", e);
      }
    }
  }, []);

  const handleDeleteBand = useCallback((indexToDelete: number) => {
    setBands(prevBands => prevBands.filter((_, index) => index !== indexToDelete));
  }, []);

  const handleRegisterBand = useCallback(async (index: number) => {
    const band = bands[index];
    try {
      setRegisteringIndex(index);
      const payload = {
        // 서버 스키마에 맞춘 필드명 매핑
        name: band.name || '김치 프리미엄 전략',
        strategyType: 'positive_kimchi',
        entryRate: String(band.target_kimp ?? 0),
        exitRate: String(band.exit_kimp ?? 0),
        toleranceRate: String(band.tolerance ?? 0.1),
        leverage: Number(band.leverage ?? 3),
        investmentAmount: String(band.amount_btc ?? 0),
        isActive: true,
        symbol: 'BTC',
      } as const;
      console.log('🔍 서버 등록 요청:', payload);
      const result = await fetchJson(`/api/trading-strategies/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log('✅ 서버 등록 성공:', result);
      showToast('서버 등록 완료', `${band.name} 전략이 서버에 저장되었습니다.`);
      refreshServerBands();
    } catch (e) {
      console.error('❌ 서버 등록 실패:', e);
      showToast('서버 등록 실패', String(e), false);
    } finally {
      setRegisteringIndex(null);
    }
  }, [bands, fetchJson, refreshServerBands, showToast, userId]);

  const handleUnregisterBand = useCallback(async (bandName: string) => {
    const serverBand = serverBands.find(sb => sb.name === bandName);
    if (!serverBand) {
      showToast('등록 취소 실패', '서버에 등록되지 않은 밴드입니다.', false);
      return;
    }
    try {
      await fetchJson(`/api/trading-strategies/${serverBand.id}`, { method: 'DELETE' });
      showToast('등록 취소 완료', `${bandName} 전략이 서버에서 삭제되었습니다.`);
      refreshServerBands();
    } catch (e) {
      console.error(e);
      showToast('서버 등록 취소 실패', String(e), false);
    }
  }, [serverBands, fetchJson, refreshServerBands, showToast]);
  
  const handleStart = useCallback(async () => {
    if (serverState.running || starting) {
      showToast('이미 실행 중', '자동매매가 실행 상태입니다.');
      return;
    }
    setStarting(true);
    try {
      await fetchJson(`/api/trading/start/${userId}`, { method: 'POST', headers: { 'X-Trace-Id': `cli-${Date.now()}` } });
      showToast('전략 시작', '자동매매가 시작되었습니다.');
    } catch (e) {
      console.error(e);
      try {
        const stat = await fetchJson(`/api/trading/status/${userId}`);
        if (stat?.isRunning) {
          showToast('이미 실행 중', '자동매매가 이미 실행 중입니다.');
        } else {
          showToast('시작 실패', String(e), false);
        }
      } catch {
        showToast('시작 실패', String(e), false);
      }
    } finally {
      tickHeavy();
      setStarting(false);
    }
  }, [fetchJson, tickHeavy, showToast, userId, serverState.running, starting]);

  const handleStop = useCallback(async () => {
    try {
      await fetchJson(`/api/trading/stop/${userId}`, { method: 'POST' });
      showToast('전략 중지', '자동매매가 중지되었습니다.');
      tickHeavy();
    } catch (e) {
      console.error(e);
      showToast('중지 실패', String(e), false);
    }
  }, [fetchJson, tickHeavy, showToast, userId]);

  // ===== Render Functions =====
  const renderBands = (): JSX.Element | JSX.Element[] => {
    if (!bands || bands.length === 0) {
      return <tr><td colSpan={10} className="muted">밴드를 추가하세요</td></tr>;
    }
    return bands.map((b, index) => {
      const serverBand = serverBands.find(sb => sb.name === b.name);
      const isRegistered = !!serverBand;
      const isActive = isRegistered && serverBand.isActive;
      return (
        <tr key={index} ref={el => {
          bandRefs.current[index] = el;
          // 행이 렌더링된 후 미리보기 업데이트
          if (el) {
            setTimeout(() => updatePreviewForRow(el), 0);
          }
        }}>
          <td><input className="ctrl" data-k="name" value={b.name || ''} onChange={(e) => handleBandChange(index, 'name', e.target.value)} /></td>
          <td><input className="ctrl" data-k="target_kimp" type="number" step="0.01" value={b.target_kimp || ''} onChange={(e) => handleBandChange(index, 'target_kimp', e.target.value)} /></td>
          <td><input className="ctrl" data-k="exit_kimp" type="number" step="0.01" value={b.exit_kimp || ''} onChange={(e) => handleBandChange(index, 'exit_kimp', e.target.value)} /></td>
          <td><input className="ctrl" data-k="tolerance" type="number" step="0.01" value={b.tolerance ?? 0.1} onChange={(e) => handleBandChange(index, 'tolerance', e.target.value)} /></td>
          <td><input className="ctrl" data-k="leverage" type="number" step="1" value={b.leverage ?? 3} onChange={(e) => {
            handleBandChange(index, 'leverage', e.target.value);
            const tr = bandRefs.current[index];
            if (tr) setTimeout(() => updatePreviewForRow(tr), 0);
          }} /></td>
          <td><input className="ctrl" data-k="amount_btc" type="number" step="0.001" value={b.amount_btc ?? 0.001} onChange={(e) => {
            handleBandChange(index, 'amount_btc', e.target.value);
            const tr = bandRefs.current[index];
            if (tr) setTimeout(() => updatePreviewForRow(tr), 0);
          }} /></td>
          <td data-size>-</td>
          <td><span className="badge" data-state>-</span></td>
          <td className="pos-actions">
            <div className="row" style={{ flexDirection: 'column', gap: '6px' }}>
              <button className="btn" onClick={() => handleRegisterBand(index)} disabled={registeringIndex === index}>{registeringIndex === index ? '등록 중…' : '서버 등록'}</button>
              <button className="btn secondary" onClick={() => handleUnregisterBand(b.name || '')} disabled={!isRegistered}>등록 취소</button>
            </div>
          </td>
          <td><button className="btn secondary" onClick={() => handleDeleteBand(index)}>삭제</button></td>
        </tr>
      );
    });
  };

  // ===== Lifecycle Hooks =====
  useEffect(() => {
    refreshServerBands();
  }, [refreshServerBands]);

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    const startPolling = () => {
      stopPolling();
      intervals.push(setInterval(tickLight, 350));
      intervals.push(setInterval(tickHeavy, 900));
      tickLight();
      tickHeavy();
    };
    const stopPolling = () => {
      intervals.forEach(clearInterval);
    };
    startPolling();
    return stopPolling;
  }, [tickLight, tickHeavy]);


  // ===== 차트 그리기 로직 =====
  const drawSpark = useCallback(() => {
    const c = sparkCanvasRef.current;
    if (!c || sparkData.length === 0) return;

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

    if (sparkData.length === 0) return;

    // 최소/최대값 계산
    const min = Math.min(...sparkData);
    const max = Math.max(...sparkData);
    const span = Math.max(1e-9, max - min);

    // 최소/최대값 표시 업데이트
    const sparkMinEl = document.querySelector('#spark-min');
    const sparkMaxEl = document.querySelector('#spark-max');
    if (sparkMinEl) sparkMinEl.textContent = min.toFixed(2);
    if (sparkMaxEl) sparkMaxEl.textContent = max.toFixed(2);

    // 차트 그리기
    const pad = 6;
    ctx.beginPath();
    
    sparkData.forEach((value, index) => {
      const x = pad + (w - 2 * pad) * (index / (sparkData.length - 1));
      const y = h - pad - (h - 2 * pad) * ((value - min) / span);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7aa2ff';
    ctx.stroke();
  }, [sparkData]);

  useEffect(() => {
    drawSpark(); // sparkData가 변경될 때마다 차트를 다시 그립니다.
    window.addEventListener('resize', drawSpark);
    return () => window.removeEventListener('resize', drawSpark);
  }, [drawSpark]);

  
  return (
    <>
      <header>
        <div className="nav">
          <div className="brand">
            <div className="logo" aria-hidden="true">₿</div>
            <div>
              김치프리미엄 자동매매<br/>
              <span className="sub">Pro Dashboard+ · Multi-Band + Queue (강제진입 없음)</span>
            </div>
          </div>

          <span id="run-badge" className={`chip ${serverState.running ? 'ok' : ''}`} title="전략 실행 상태">
            <i className={`dot ${serverState.running ? 'ok' : ''}`}></i>
            <span>{serverState.running ? '실행중' : '중지됨'}</span>
          </span>
          <span id="arm-badge" className="chip" title="진입 정책"><i className="dot ok"></i><span>조건 충족 시 자동 대기→진입</span></span>
          <span className="chip" title="수수료 기준"><i className="dot ok"></i>추정 비용 ≈ 0.18%p</span>
          <span id="net-badge" className="chip" title="네트워크 상태"><i className="dot"></i><span>NET …</span></span>

          <div className="grow"></div>
          <span id="kimp-brief" className="kimp-brief mono" aria-live="polite">
            {`김프 ${fx(kimp.kimp, 2)}% · 업비트 ${loc(kimp.upbit_price)} KRW · 바이낸스 ${fx(kimp.binance_price, 2)} USDT · 환율 ${fx(kimp.usdkrw, 2)}`}
          </span>
        </div>
      </header>
      <div className="wrap">
        <div className="grid">
          {/* 전략 설정: 멀티 밴드 */}
          <section className="card col-12">
            <h3>전략 설정 (멀티 밴드)</h3>
            <div className="row" style={{gap: '6px', marginBottom: '8px'}}>
              <button className="btn ghost" id="btn-add-band" onClick={() => handleAddBand()}>밴드 추가</button>
              <button className="btn ghost" id="btn-save" onClick={handleSaveBands}>설정 저장(로컬)</button>
              <button className="btn ghost" id="btn-load" onClick={handleLoadBands}>불러오기</button>
            </div>

            <div style={{marginTop: '12px', overflow: 'auto'}}>
              <table>
                <thead>
                  <tr>
                    <th style={{minWidth: '90px'}}>이름</th>
                    <th style={{minWidth: '120px'}}>진입 김프율(%)</th>
                    <th style={{minWidth: '120px'}}>청산 김프율(%)</th>
                    <th style={{minWidth: '120px'}}>허용오차(%)</th>
                    <th style={{minWidth: '120px'}}>레버리지</th>
                    <th style={{minWidth: '150px'}}>투자수량(BTC)</th>
                    <th style={{minWidth: '220px'}}>미리보기 (Upbit KRW / Binance USDT) 수수료 포함</th>
                    <th style={{minWidth: '130px'}}>상태</th>
                    <th style={{minWidth: '220px'}}>서버</th>
                    <th style={{minWidth: '80px'}}>삭제</th>
                  </tr>
                </thead>
                <tbody id="band-tbody" ref={bandTbodyRef}>
                  {renderBands()}
                </tbody>
              </table>
            </div>

            <div className="row" style={{marginTop: '12px'}}>
              <button className="btn" id="btn-start" onClick={handleStart} disabled={serverState.running}>▶ 전략 시작</button>
              <button className="btn secondary" id="btn-stop" onClick={handleStop} disabled={!serverState.running}>■ 전략 중지</button>
            </div>
            <p className="hint">※ 이 UI는 <b>강제 진입이 없습니다.</b> 각 밴드는 <b>entry_kimp±tolerance</b> 범위에 <b>도달하면 자동 진입</b>, 이후 <b>exit_kimp</b> 등 조건 충족 시 자동 청산됩니다.</p>
          </section>

          {/* 시장 스냅샷 */}
          <section className="card col-6">
            <h3>시장 스냅샷</h3>
            <div className="grid" style={{gap: '12px', gridTemplateColumns: 'repeat(12, 1fr)'}}>
              <div className="col-6">
                <div className="kv">
                  <b>김프</b><span><span id="kimp" className="mono" style={{fontWeight: 800}}>{fx(kimp.kimp, 2)}%</span> <span id="kimp-sign" className={`badge ${kimp.kimp < 0 ? 'bad' : 'good'}`}>{kimp.kimp < 0 ? '역프' : '정프'}</span></span>
                  <b>업비트</b><span className="mono" id="upbit_price">{loc(kimp.upbit_price)}</span>
                  <b>바이낸스</b><span className="mono" id="binance_price">{loc(kimp.binance_price)}</span>
                  <b>환율</b><span className="mono" id="usdkrw">{loc(kimp.usdkrw)}</span>
                  <b>Upbit KRW</b><span className="mono" id="bal-krw">{loc(balances.real.krw)}</span>
                  <b>Upbit BTC</b><span className="mono" id="bal-btc">{fx(balances.real.btc_upbit, 6)}</span>
                  <b>Binance USDT</b><span className="mono" id="bal-usdt">{loc(balances.real.usdt)}</span>
                  <b>진입 증거금(USDT)</b><span className="mono" id="used-usdt">{loc(serverState.used_balance_usdt)}</span>
                </div>
              </div>
              <div className="col-6">
                <div className="spark-wrap">
                  <canvas ref={sparkCanvasRef} id="spark" className="spark"></canvas>
                  <div className="spark-val mono">
                    <small>최근 60초 범위</small>
                    <div><span id="spark-min">-</span> ~ <span id="spark-max">-</span></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 성과 요약 */}
          <section className="card col-6">
            <h3>성과 요약</h3>
            <div className="grid" style={{gap: '12px', gridTemplateColumns: 'repeat(12, 1fr)'}}>
              <div className="col-6">
                <div className="kv">
                  <b>루프</b><span id="metric-loops" className="mono">{loc(metrics.loops)}</span>
                  <b>바이낸스 주문</b><span id="metric-bn" className="mono">{loc(metrics.binance_orders)}</span>
                  <b>업비트 주문</b><span id="metric-up" className="mono">{loc(metrics.upbit_orders)}</span>
                  <b>API 오류</b><span id="metric-errors" className="badge bad">{loc(metrics.errors)}</span>
                </div>
              </div>
              <div className="col-6">
                <div className="kv">
                  <b>실현 손익(누적)</b><span><span id="pnl-krw-sum" className="mono hl">0</span> KRW</span>
                  <b>Upbit 수수료(누적)</b><span id="fee-upbit-krw" className="mono">-</span>
                  <b>Binance 수수료(USDT)</b><span id="fee-binance-usdt" className="mono">-</span>
                  <b>Binance 수수료(KRW)</b><span id="fee-binance-krw" className="mono">-</span>
                </div>
              </div>
            </div>
          </section>

          {/* 밴드 보드 */}
          <section className="card col-12">
            <div className="row" style={{justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{margin: 0}}>밴드 보드</h3>
              <div className="row">
                <button className="btn ghost" id="btn-refresh-bands">서버 동기화</button>
              </div>
            </div>

            <div style={{marginTop: '10px', overflow: 'auto', maxHeight: '420px'}}>
              <table id="pos-table">
                <thead>
                  <tr>
                    <th>id</th>
                    <th>상태</th>
                    <th>엔트리 김프</th>
                    <th>허용오차</th>
                    <th>Exit 김프</th>
                    <th>Upbit 수량(BTC)</th>
                    <th>PnL(KRW)</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody id="pos-tbody">
                  <tr><td colSpan={8} className="muted">밴드 없음</td></tr>
                </tbody>
              </table>
            </div>

            <h4 style={{margin: '14px 0 8px 0', color: '#cbd5e1'}}>최근 로그 (상위 300)</h4>
            <div id="log" className="log" aria-live="polite">Loading...</div>
          </section>
        </div>
      </div>

      <div className="toast-wrap" id="toasts"></div>
    </>
  );
};

export default LegacyAutoTradingPage;
