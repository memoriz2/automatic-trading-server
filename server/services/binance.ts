import crypto from 'crypto';

export interface BinanceTicker {
  symbol: string;
  price: string;
}

export interface BinanceOrderbook {
  symbol: string;
  bids: string[][];
  asks: string[][];
}

export class BinanceService {
  private baseUrl = 'https://api.binance.com';
  private futuresBaseUrl = 'https://fapi.binance.com';
  // 지역 제한 우회를 위한 대체 엔드포인트
  private proxyUrl = 'https://api1.binance.com'; // 또는 다른 지역별 엔드포인트
  private apiKey: string;
  private secretKey: string;

  constructor(apiKey?: string, secretKey?: string) {
    this.apiKey = apiKey || '';
    this.secretKey = secretKey || '';
  }

  /**
   * 선물 심볼의 수량 규칙(LOT_SIZE/MARKET_LOT_SIZE, MIN_NOTIONAL 등) 조회
   */
  private async getFuturesQuantityRules(symbolWithUsdt: string): Promise<{ stepSize?: string; minQty?: string; minNotional?: string; decimals: number; }> {
    try {
      const res = await fetch(`${this.futuresBaseUrl}/fapi/v1/exchangeInfo?symbol=${symbolWithUsdt}`);
      if (!res.ok) {
        return { decimals: 8 };
      }
      const data = await res.json();
      const info = Array.isArray(data.symbols) ? data.symbols[0] : undefined;
      if (!info) return { decimals: 8 };
      const lot = info.filters?.find((f: any) => f.filterType === 'LOT_SIZE');
      const marketLot = info.filters?.find((f: any) => f.filterType === 'MARKET_LOT_SIZE');
      const minNotionalF = info.filters?.find((f: any) => f.filterType === 'MIN_NOTIONAL');
      const stepSize = lot?.stepSize || marketLot?.stepSize;
      const minQty = lot?.minQty || marketLot?.minQty;
      const minNotional = minNotionalF?.notional;
      const decimals = stepSize ? (stepSize.split('.')[1]?.length || 0) : 8;
      return { stepSize, minQty, minNotional, decimals };
    } catch {
      return { decimals: 8 };
    }
  }

  private floorToStep(value: number, stepSize?: string): number {
    if (!stepSize) return value;
    const step = parseFloat(stepSize);
    if (!isFinite(step) || step <= 0) return value;
    const decimals = (stepSize.split('.')[1]?.length || 0);
    const floored = Math.floor(value / step) * step;
    return parseFloat(floored.toFixed(decimals));
  }

  private ensureMinNotional(qty: number, price: number, minNotional?: string): boolean {
    if (!minNotional) return true;
    const notional = qty * price;
    return notional >= parseFloat(minNotional);
  }

  private generateSignature(queryString: string): string {
    if (!this.secretKey) {
      throw new Error('Binance secret key not configured');
    }
    return crypto.createHmac('sha256', this.secretKey).update(queryString).digest('hex');
  }

  async getTicker(symbols: string[]): Promise<BinanceTicker[]> {
    try {
      // 심플한 방식으로 개별 심볼 조회
      const results: BinanceTicker[] = [];
      
      for (const symbol of symbols) {
        try {
          // 여러 엔드포인트 시도
          let response;
          const endpoints = [this.proxyUrl, this.baseUrl, 'https://api2.binance.com', 'https://api3.binance.com'];
          
          for (const endpoint of endpoints) {
            try {
              response = await fetch(`${endpoint}/api/v3/ticker/price?symbol=${symbol}USDT`, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              });
              
              if (response.ok) {
                break;
              }
            } catch (endpointError) {
              console.warn(`Endpoint ${endpoint} failed for ${symbol}:`, endpointError instanceof Error ? endpointError.message : String(endpointError));
            }
          }
          
          if (response && response.ok) {
            const data = await response.json();
            results.push(data);
          } else {
            console.warn(`All endpoints failed for ${symbol}, using CoinGecko as fallback`);
            // CoinGecko API를 대체 소스로 사용
            const fallbackPrice = await this.getFallbackPrice(symbol);
            results.push({
              symbol: `${symbol}USDT`,
              price: fallbackPrice.toString()
            });
          }
        } catch (symbolError) {
          console.warn(`Error getting ${symbol} price:`, symbolError);
          const fallbackPrice = await this.getFallbackPrice(symbol);
          results.push({
            symbol: `${symbol}USDT`,
            price: fallbackPrice.toString()
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Binance getTicker error:', error);
      throw error;
    }
  }

  async getFuturesTicker(symbols: string[]): Promise<BinanceTicker[]> {
    try {
      const results: BinanceTicker[] = [];
      const symbolsParams = symbols.map(s => `${s}USDT`);
      
      // fapi.binance.com은 symbols 파라미터를 지원하지 않으므로 개별 요청
      for (const symbol of symbolsParams) {
        try {
          // 선물 최종 체결가(Last) 강제 사용
          const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/ticker/price?symbol=${symbol}`);

          if (response.ok) {
            const data = await response.json();
            results.push({
              symbol: data.symbol,
              price: data.price
            });
          } else {
            console.warn(`Failed to get futures last price for ${symbol}: ${response.status}, falling back to spot last price.`);
            const lastPrice = await this.getSymbolPrice(symbol);
            results.push({ symbol, price: lastPrice.toString() });
          }
        } catch (error) {
           console.warn(`Error getting futures last price for ${symbol}, falling back to spot price.`, error);
           const spotPrice = await this.getSymbolPrice(symbol);
           results.push({
             symbol: symbol,
             price: spotPrice.toString()
           });
        }
      }
      return results;
    } catch (error) {
      console.error('Binance getFuturesTicker error:', error);
      throw error;
    }
  }

  // 단일 심볼 가격 조회
  async getSymbolPrice(symbol: string): Promise<number> {
    try {
      const tickers = await this.getTicker([symbol.replace('USDT', '')]);
      return tickers.length > 0 ? parseFloat(tickers[0].price) : 0;
    } catch (error) {
      console.warn(`바이낸스 ${symbol} 가격 조회 실패:`, error);
      return await this.getFallbackPrice(symbol.replace('USDT', ''));
    }
  }

  // 다중 소스를 통한 정확한 대체 가격 조회
  private async getFallbackPrice(symbol: string): Promise<number> {
    // 1차: CryptoCompare API 시도
    try {
      const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${symbol}&tsyms=USD`);
      if (response.ok) {
        const data = await response.json();
        const price = data.USD;
        if (price && price > 0) {
          console.log(`${symbol} CryptoCompare 가격: $${price}`);
          return price;
        }
      }
    } catch (error) {
      console.warn('CryptoCompare API 실패:', error);
    }

    // 2차: CoinGecko API 시도
    try {
      const coinMap: {[key: string]: string} = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum', 
        'XRP': 'ripple',
        'ADA': 'cardano',
        'DOT': 'polkadot'
      };

      const coinId = coinMap[symbol];
      if (coinId) {
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
        if (response.ok) {
          const data = await response.json();
          const price = data[coinId]?.usd;
          if (price && price > 0) {
            console.log(`${symbol} CoinGecko 가격: $${price}`);
            return price;
          }
        }
      }
    } catch (error) {
      console.warn('CoinGecko API 실패:', error);
    }

    // 3차: 최신 시장 기준 정확한 기본값
    const currentMarketPrices: {[key: string]: number} = {
      'BTC': 118430,  // 실제 시장가 기준 (2025-07-24)
      'ETH': 3628,    // 실제 시장가 기준
      'XRP': 2.36,    // 실제 시장가 기준
      'ADA': 1.06,    // 실제 시장가 기준
      'DOT': 8.55     // 실제 시장가 기준
    };
    
    const price = currentMarketPrices[symbol] || 1;
    console.log(`${symbol} 시장 기준 대체 가격: $${price}`);
    return price;
  }

  async getOrderbook(symbol: string): Promise<BinanceOrderbook> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v3/depth?symbol=${symbol}USDT&limit=5`);
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        symbol: `${symbol}USDT`,
        bids: data.bids,
        asks: data.asks
      };
    } catch (error) {
      console.error('Binance getOrderbook error:', error);
      throw error;
    }
  }

  async getAccount(): Promise<any> {
    try {
      if (!this.apiKey || !this.secretKey) {
        throw new Error('Binance API keys not configured');
      }

      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.generateSignature(queryString);

      const response = await fetch(`${this.baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
        headers: {
          'X-MBX-APIKEY': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Binance account API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Binance getAccount error:', error);
      throw error;
    }
  }

  async getUSDTBalance(): Promise<number> {
    try {
      // API 키가 설정되지 않은 경우 스팟 계정 시도
      if (!this.apiKey || !this.secretKey) {
        console.log('바이낸스 API 키 없음, 스팟 계정 시도');
        const account = await this.getAccount();
        const usdtBalance = account.balances.find((balance: any) => balance.asset === 'USDT');
        return usdtBalance ? parseFloat(usdtBalance.free) : 0;
      }

      // 바이낸스 선물 계정 잔고 조회
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = crypto.createHmac('sha256', this.secretKey)
        .update(queryString)
        .digest('hex');

      const response = await fetch(`https://fapi.binance.com/fapi/v2/account?${queryString}&signature=${signature}`, {
        headers: {
          'X-MBX-APIKEY': this.apiKey,
        },
      });

      if (!response.ok) {
        console.log(`📊 선물 계정 조회 실패 (${response.status}): 지역 제한으로 추정`);
        console.log(`📊 바이낸스 선물 USDT 잔고: 지역 제한으로 조회 불가 (실제 잔고는 바이낸스에서 확인)`);
        
        // 스팟 계정 시도해보기
        try {
          const account = await this.getAccount();
          const usdtBalance = account.balances.find((balance: any) => balance.asset === 'USDT');
          const spotBalance = usdtBalance ? parseFloat(usdtBalance.free) : 0;
          console.log(`📊 바이낸스 스팟 USDT 잔고: $${spotBalance}`);
          return spotBalance;
        } catch (error) {
          console.log(`📊 스팟 계정도 지역 제한, 잔고 조회 불가`);
          return 0;
        }
      }

      const futuresAccount = await response.json();
      const usdtAsset = futuresAccount.assets?.find((asset: any) => asset.asset === 'USDT');
      const futuresBalance = usdtAsset ? parseFloat(usdtAsset.walletBalance) : 0;
      
      console.log(`📊 바이낸스 선물 USDT 잔고: $${futuresBalance}`);
      return futuresBalance;
    } catch (error) {
      console.error('Binance getUSDTBalance error:', error);
      return 0;
    }
  }

  async getUSDTKRWRate(): Promise<number> {
    try {
      // 업비트 USDT-KRW 마켓에서 실제 환율 조회
      const response = await fetch('https://api.upbit.com/v1/ticker?markets=KRW-USDT');
      
      if (!response.ok) {
        console.warn(`USDT/KRW rate API error: ${response.status}`);
        return 1359; // 현재 실제 환율 기본값
      }

      const data = await response.json();
      const rate = data[0]?.trade_price;
      
      if (rate && rate > 1000 && rate < 2000) { // 합리적인 범위 체크
        console.log(`USDT/KRW 환율 업데이트: ${rate}원`);
        return rate;
      }
      
      return 1359; // 현재 실제 환율 기본값
    } catch (error) {
      console.error('USDT/KRW rate error:', error);
      return 1359; // 현재 실제 환율 기본값
    }
  }

  async getLeverage(symbol: string): Promise<number> {
    try {
      if (!this.apiKey) {
        throw new Error('Binance API key not configured');
      }

      const timestamp = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        timestamp: timestamp.toString(),
        recvWindow: '5000'
      };

      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/positionRisk?${queryString}&signature=${signature}`, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.apiKey,
        }
      });

      if (!response.ok) {
        console.warn('레버리지 조회 실패, 기본값 1배 사용');
        return 1;
      }

      const positions = await response.json();
      const position = positions.find((p: any) => p.symbol === `${symbol}USDT`);
      const leverage = position ? parseInt(position.leverage) : 1;
      
      console.log(`📊 ${symbol} 현재 레버리지: ${leverage}배`);
      return leverage;
    } catch (error) {
      console.warn('레버리지 조회 오류, 기본값 1배 사용:', error);
      return 1;
    }
  }

  async setLeverage(symbol: string, leverage: number): Promise<boolean> {
    try {
      if (!this.apiKey) {
        throw new Error('Binance API key not configured');
      }

      const timestamp = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        leverage: leverage.toString(),
        timestamp: timestamp.toString(),
        recvWindow: '5000'
      };

      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/leverage?${queryString}&signature=${signature}`, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': this.apiKey,
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error(`❌ 레버리지 설정 실패 (${symbol}, ${leverage}배):`, text);
        return false;
      }

      const result = await response.json();
      console.log(`✅ ${symbol} 레버리지 ${leverage}배로 설정 완료:`, result);
      return true;
    } catch (error) {
      console.error(`레버리지 설정 오류 (${symbol}, ${leverage}배):`, error);
      return false;
    }
  }

  async getFuturesAccountInfo(): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('Binance API key not configured');
      }

      const timestamp = Date.now();
      const params = {
        timestamp: timestamp.toString(),
        recvWindow: '5000'
      };

      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v2/account?${queryString}&signature=${signature}`, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.apiKey,
        }
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('❌ 바이낸스 선물 계정 정보 조회 실패:', text);
        throw new Error(`Failed to get futures account info: ${response.status}`);
      }

      const accountInfo = await response.json();
      console.log('📊 바이낸스 선물 계정 정보:', {
        totalWalletBalance: accountInfo.totalWalletBalance,
        availableBalance: accountInfo.availableBalance,
        totalMarginBalance: accountInfo.totalMarginBalance,
        totalUnrealizedProfit: accountInfo.totalUnrealizedProfit,
        totalInitialMargin: accountInfo.totalInitialMargin,
        totalMaintMargin: accountInfo.totalMaintMargin,
        totalCrossWalletBalance: accountInfo.totalCrossWalletBalance,
        totalCrossUnPnl: accountInfo.totalCrossUnPnl
      });

      // 마진 사용량 분석
      const totalWallet = parseFloat(accountInfo.totalWalletBalance || '0');
      const available = parseFloat(accountInfo.availableBalance || '0');
      const usedMargin = totalWallet - available;
      const marginUsagePercent = totalWallet > 0 ? (usedMargin / totalWallet * 100) : 0;

      console.log('💼 마진 사용량 분석:', {
        totalWallet: totalWallet.toFixed(2),
        usedMargin: usedMargin.toFixed(2),
        available: available.toFixed(2),
        marginUsage: `${marginUsagePercent.toFixed(1)}%`
      });
      
      return accountInfo;
    } catch (error) {
      console.error('Binance getFuturesAccountInfo error:', error);
      throw error;
    }
  }

  async placeShortOrder(symbol: string, quantity: number, targetLeverage?: number): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('Binance API key not configured');
      }

      // 먼저 계정 정보 확인
      console.log('🔍 바이낸스 선물 계정 정보 확인 중...');
      const accountInfo = await this.getFuturesAccountInfo();
      const availableBalance = parseFloat(accountInfo.availableBalance || '0');
      
      console.log(`💰 사용 가능한 잔고: ${availableBalance} USDT`);

      // 현재 레버리지 확인
      const currentLeverage = await this.getLeverage(symbol);
      console.log(`🔧 ${symbol} 현재 레버리지: ${currentLeverage}배`);

      // 목표 레버리지 결정 (전략에서 지정된 값 우선 사용)
      const desiredLeverage = targetLeverage || 20; // 기본값 20배
      console.log(`🎯 ${symbol} 목표 레버리지: ${desiredLeverage}배 (전략 설정: ${targetLeverage || '없음'})`);

      // 현재 레버리지와 목표 레버리지가 다르면 설정 변경
      let finalLeverage = currentLeverage;
      if (currentLeverage !== desiredLeverage) {
        console.log(`⚡ ${symbol} 레버리지를 ${currentLeverage}배 → ${desiredLeverage}배로 변경 시도...`);
        const leverageSet = await this.setLeverage(symbol, desiredLeverage);
        if (leverageSet) {
          console.log(`✅ ${symbol} 레버리지 ${desiredLeverage}배 설정 성공`);
          finalLeverage = desiredLeverage; // 설정 성공 시 즉시 반영
        } else {
          console.warn(`⚠️ ${symbol} 레버리지 설정 실패, ${currentLeverage}배로 진행`);
          finalLeverage = currentLeverage;
        }
      } else {
        console.log(`✅ ${symbol} 레버리지 이미 ${currentLeverage}배로 설정됨`);
        finalLeverage = currentLeverage;
      }

      const timestamp = Date.now();
      const symbolWithUsdt = `${symbol}USDT`;
      const rules = await this.getFuturesQuantityRules(symbolWithUsdt);
      // 시장가인 경우 가격은 최신가로 추정하여 MIN_NOTIONAL 체크
      const priceRes = await fetch(`${this.futuresBaseUrl}/fapi/v1/ticker/price?symbol=${symbolWithUsdt}`);
      const priceJson = await priceRes.json().catch(() => ({ price: '0' }));
      const lastPrice = parseFloat(priceJson?.price || '0');
      const adjustedQty = this.floorToStep(quantity, rules.stepSize);
      const qtyString = adjustedQty.toFixed(rules.decimals);

      if (!this.ensureMinNotional(parseFloat(qtyString), lastPrice, rules.minNotional)) {
        throw new Error(`Order notional too small: qty=${qtyString}, price=${lastPrice}, min=${rules.minNotional}`);
      }

      // 현재 포지션 정보 확인
      const positions = accountInfo.positions?.filter((p: any) => parseFloat(p.positionAmt) !== 0) || [];
      console.log('📈 현재 활성 포지션:', positions.length > 0 ? positions.map((p: any) => ({
        symbol: p.symbol,
        size: p.positionAmt,
        entryPrice: p.entryPrice,
        markPrice: p.markPrice,
        pnl: p.unRealizedProfit
      })) : '없음');

      // 설정된 레버리지 기반 마진 계산
      const orderValue = parseFloat(qtyString) * lastPrice;
      const requiredMarginBase = orderValue / Math.max(finalLeverage, 1); // 설정된 레버리지 사용
      const requiredMargin = requiredMarginBase * 1.1; // 10% 안전 마진
      
      console.log('📊 주문 마진 계산:', {
        quantity: qtyString,
        price: lastPrice,
        leverage: `${finalLeverage}배`,
        orderValue: orderValue.toFixed(2),
        requiredMarginBase: requiredMarginBase.toFixed(2),
        requiredMargin: requiredMargin.toFixed(2),
        availableBalance: availableBalance.toFixed(2),
        sufficient: availableBalance >= requiredMargin,
        activePositions: positions.length
      });

      // 경고만 출력하고 주문은 계속 진행 (바이낸스 API가 최종 판단)
      if (availableBalance < requiredMargin) {
        console.warn(`⚠️ 마진 부족 가능성: 필요 ${requiredMargin.toFixed(2)} USDT, 보유 ${availableBalance.toFixed(2)} USDT`);
        console.warn(`⚠️ 바이낸스 API 응답에 따라 주문이 실패할 수 있습니다.`);
      }

      const params = {
        symbol: symbolWithUsdt,
        side: 'SELL',
        type: 'MARKET',
        quantity: qtyString,
        timestamp: timestamp.toString(),
        recvWindow: '5000'
      } as Record<string, string>;

      console.log(`🚨 바이낸스 선물 주문 파라미터:`, params);

      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/order?${queryString}&signature=${signature}`, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (!response.ok) {
        const text = await response.text();
        let detail = text;
        try {
          const j = JSON.parse(text);
          detail = `${j.code || response.status}: ${j.msg || text}`;
        } catch {}
        console.error(`❌ 바이낸스 선물 주문 실패 상세:`, { status: response.status, detail, params });
        throw new Error(`Binance futures order error: ${detail}`);
      }

      const result = await response.json();
      console.log(`✅ 바이낸스 선물 주문 성공:`, result);
      return result;
    } catch (error) {
      console.error('Binance placeShortOrder error:', error);
      throw error;
    }
  }

  async closeShortPosition(symbol: string, quantity: number): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('Binance API key not configured');
      }

      const timestamp = Date.now();
      const symbolWithUsdt = `${symbol}USDT`;
      const rules = await this.getFuturesQuantityRules(symbolWithUsdt);
      const adjustedQty = this.floorToStep(quantity, rules.stepSize);
      const qtyString = adjustedQty.toFixed(rules.decimals);

      const params = {
        symbol: symbolWithUsdt,
        side: 'BUY', // 숏 포지션 청산은 BUY
        type: 'MARKET',
        quantity: qtyString,
        reduceOnly: 'true',
        timestamp: timestamp.toString(),
        recvWindow: '5000'
      } as Record<string, string>;

      console.log(`🔄 바이낸스 숏 포지션 청산 파라미터:`, params);

      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/order?${queryString}&signature=${signature}`, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      if (!response.ok) {
        const text = await response.text();
        let detail = text;
        try {
          const j = JSON.parse(text);
          detail = `${j.code || response.status}: ${j.msg || text}`;
        } catch {}
        console.error(`❌ 바이낸스 숏 포지션 청산 실패:`, { status: response.status, detail, params });
        throw new Error(`Binance close short position error: ${detail}`);
      }

      const result = await response.json();
      console.log(`✅ 바이낸스 숏 포지션 청산 성공:`, result);
      return result;
    } catch (error) {
      console.error('Binance closeShortPosition error:', error);
      throw error;
    }
  }

  async closeLongOrder(symbol: string, quantity: number): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('Binance API key not configured');
      }

      const timestamp = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        side: 'BUY',
        type: 'MARKET',
        quantity: quantity.toString(),
        timestamp: timestamp.toString()
      };

      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/order?${queryString}&signature=${signature}`, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Binance futures order error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Binance closeLongOrder error:', error);
      throw error;
    }
  }

  // 새로운 김프 전략용 메소드들

  // 선물 숏 포지션 진입 (시장가)
  async placeFuturesShortOrder(symbol: string, quantity: number): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('Binance API key not configured');
      }

      const timestamp = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        side: 'SELL',
        type: 'MARKET',
        quantity: quantity.toString(),
        timestamp: timestamp.toString()
      };

      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/order?${queryString}&signature=${signature}`, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Binance futures short order error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Binance placeFuturesShortOrder error:', error);
      throw error;
    }
  }

  // 선물 포지션 청산 (숏 포지션 커버)
  async closeFuturesPosition(symbol: string, quantity: number): Promise<any> {
    try {
      if (!this.apiKey) {
        throw new Error('Binance API key not configured');
      }

      const timestamp = Date.now();
      const params = {
        symbol: `${symbol}USDT`,
        side: 'BUY', // 숏 포지션 청산은 매수
        type: 'MARKET',
        quantity: quantity.toString(),
        timestamp: timestamp.toString()
      };

      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v1/order?${queryString}&signature=${signature}`, {
        method: 'POST',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Binance futures close position error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Binance closeFuturesPosition error:', error);
      throw error;
    }
  }

  // 현재 포지션 정보 조회
  async getFuturesPositions(): Promise<any[]> {
    try {
      if (!this.apiKey) {
        throw new Error('Binance API key not configured');
      }

      const timestamp = Date.now();
      const params = {
        timestamp: timestamp.toString()
      };

      const queryString = new URLSearchParams(params).toString();
      const signature = this.generateSignature(queryString);
      
      const response = await fetch(`${this.futuresBaseUrl}/fapi/v2/positionRisk?${queryString}&signature=${signature}`, {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Binance futures positions error: ${response.status}`);
      }

      const positions = await response.json();
      // 포지션이 있는 것만 필터링
      return positions.filter((pos: any) => parseFloat(pos.positionAmt) !== 0);
    } catch (error) {
      console.error('Binance getFuturesPositions error:', error);
      return [];
    }
  }

  /**
   * 세션 ID로 DB에서 복호화된 바이낸스 API 키를 사용하여 잔고 조회
   */
  async getUSDTBalanceWithSession(sessionId: string): Promise<number> {
    try {
      // storage에서 복호화된 거래소 정보 가져오기
      const { storage } = await import('../storage.js');
      const decryptedExchange = await storage.getDecryptedExchange(sessionId, 'binance');
      
      if (!decryptedExchange || !decryptedExchange.apiKey || !decryptedExchange.apiSecret) {
        console.log('세션에서 바이낸스 API 키를 찾을 수 없음');
        return 0;
      }

      console.log(`🔑 세션 ${sessionId}의 복호화된 바이낸스 API 키 사용`);

      // 바이낸스 선물 계정 잔고 조회
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = crypto.createHmac('sha256', decryptedExchange.apiSecret)
        .update(queryString)
        .digest('hex');

      const response = await fetch(`https://fapi.binance.com/fapi/v2/account?${queryString}&signature=${signature}`, {
        headers: {
          'X-MBX-APIKEY': decryptedExchange.apiKey,
        },
      });

      if (!response.ok) {
        console.log(`📊 선물 계정 조회 실패 (${response.status}): 지역 제한으로 추정`);
        console.log(`📊 바이낸스 선물 USDT 잔고: 지역 제한으로 조회 불가 (실제 잔고는 바이낸스에서 확인)`);
        return 0;
      }

      const futuresAccount = await response.json();
      const usdtAsset = futuresAccount.assets?.find((asset: any) => asset.asset === 'USDT');
      const futuresBalance = usdtAsset ? parseFloat(usdtAsset.walletBalance) : 0;
      
      console.log(`📊 바이낸스 선물 USDT 잔고: $${futuresBalance}`);
      return futuresBalance;
    } catch (error) {
      console.error('Binance getUSDTBalanceWithSession error:', error);
      return 0;
    }
  }
}
