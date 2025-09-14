// 잔고 계산 검증 스크립트
function verifyBalance() {
  const userId = "17";
  
  console.log("=== 잔고 계산 검증 시작 ===");
  
  // 1. 현재 잔고 확인
  const currentBalance = JSON.parse(localStorage.getItem(`mock-balance-${userId}`) || '{}');
  console.log("현재 잔고:", currentBalance);
  
  // 2. 거래 기록 분석
  const trades = JSON.parse(localStorage.getItem(`mock-trades-${userId}`) || '[]');
  console.log("총 거래 수:", trades.length);
  
  // 3. 포지션 분석
  const positions = JSON.parse(localStorage.getItem(`mock-positions-${userId}`) || '[]');
  console.log("활성 포지션:", positions.length);
  
  // 4. 초기 잔고 (가정)
  const initialBalance = {
    krw: 100000000, // 1억원
    btc: 0,
    usdt: 100000, // 10만 USDT
    binanceBtc: 0,
    binanceUsdt: 100000
  };
  
  console.log("초기 잔고 (가정):", initialBalance);
  
  // 5. 거래별 잔고 변화 계산
  let calculatedBalance = { ...initialBalance };
  
  trades.forEach((trade, index) => {
    console.log(`\n--- 거래 ${index + 1}: ${trade.exchange} ${trade.type} ---`);
    console.log(`수량: ${trade.quantity} BTC, 가격: ${trade.price.toLocaleString()}, 수수료: ${trade.fee}`);
    
    if (trade.exchange === 'upbit') {
      if (trade.type === 'buy') {
        // 업비트 매수: KRW 차감, BTC 증가
        const totalCost = (trade.quantity * trade.price) + trade.fee;
        calculatedBalance.krw -= totalCost;
        calculatedBalance.btc += trade.quantity;
        console.log(`업비트 매수: KRW -${totalCost.toLocaleString()}, BTC +${trade.quantity}`);
      } else if (trade.type === 'sell') {
        // 업비트 매도: BTC 차감, KRW 증가
        const totalRevenue = (trade.quantity * trade.price) - trade.fee;
        calculatedBalance.krw += totalRevenue;
        calculatedBalance.btc -= trade.quantity;
        console.log(`업비트 매도: BTC -${trade.quantity}, KRW +${totalRevenue.toLocaleString()}`);
      }
    } else if (trade.exchange === 'binance') {
      if (trade.type === 'short') {
        // 바이낸스 숏: 증거금 차감 (BTC는 변경 없음)
        const margin = (trade.quantity * trade.price) / parseInt(trade.leverage || '5');
        calculatedBalance.usdt -= (margin + trade.fee);
        calculatedBalance.binanceUsdt -= (margin + trade.fee);
        console.log(`바이낸스 숏: USDT -${(margin + trade.fee).toFixed(2)} (증거금)`);
      } else if (trade.type === 'cover') {
        // 바이낸스 커버: 증거금 반환
        const margin = (trade.quantity * trade.price) / parseInt(trade.leverage || '5');
        calculatedBalance.usdt += (margin - trade.fee);
        calculatedBalance.binanceUsdt += (margin - trade.fee);
        console.log(`바이낸스 커버: USDT +${(margin - trade.fee).toFixed(2)} (증거금 반환)`);
      }
    }
    
    console.log("잔고 변화:", {
      krw: calculatedBalance.krw.toLocaleString(),
      btc: calculatedBalance.btc.toFixed(6),
      usdt: calculatedBalance.usdt.toFixed(2)
    });
  });
  
  console.log("\n=== 최종 비교 ===");
  console.log("계산된 잔고:", {
    krw: calculatedBalance.krw.toLocaleString(),
    btc: calculatedBalance.btc.toFixed(6),
    usdt: calculatedBalance.usdt.toFixed(2),
    binanceUsdt: calculatedBalance.binanceUsdt.toFixed(2)
  });
  
  console.log("현재 표시 잔고:", {
    krw: currentBalance.krw?.toLocaleString(),
    btc: currentBalance.btc?.toFixed(6),
    usdt: currentBalance.usdt?.toFixed(2),
    binanceUsdt: currentBalance.binanceUsdt?.toFixed(2)
  });
  
  // 6. 차이 계산
  const diff = {
    krw: (currentBalance.krw || 0) - calculatedBalance.krw,
    btc: (currentBalance.btc || 0) - calculatedBalance.btc,
    usdt: (currentBalance.usdt || 0) - calculatedBalance.usdt
  };
  
  console.log("잔고 차이:", {
    krw: diff.krw.toLocaleString(),
    btc: diff.btc.toFixed(6),
    usdt: diff.usdt.toFixed(2)
  });
  
  // 7. 활성 포지션 검증
  console.log("\n=== 활성 포지션 검증 ===");
  positions.forEach((pos, index) => {
    console.log(`포지션 ${index + 1}: ${pos.strategyName}`);
    console.log(`  - 업비트: ${pos.upbitQuantity} BTC @ ${pos.upbitPrice.toLocaleString()}`);
    console.log(`  - 바이낸스: ${pos.binanceQuantity} BTC @ ${pos.binancePrice.toLocaleString()}`);
    console.log(`  - 레버리지: ${pos.leverage}x`);
    console.log(`  - 진입 시간: ${new Date(pos.entryTime).toLocaleString()}`);
  });
  
  return {
    calculated: calculatedBalance,
    current: currentBalance,
    difference: diff,
    positions: positions.length,
    trades: trades.length
  };
}

// 실행
verifyBalance();
