import 'dotenv/config';
import { UpbitAdapter } from '../adapters/UpbitAdapter.js';
import { BinanceAdapter } from '../adapters/BinanceAdapter.js';
import { ApiKeysRepository } from '../repositories/ApiKeysRepository.js';
/**
 * 업비트와 바이낸스 거래내역을 조회하고 콘솔에 출력하는 스크립트
 */
async function fetchTrades() {
    console.log('='.repeat(80));
    console.log('거래내역 조회 시작');
    console.log('='.repeat(80));
    console.log('');
    // API 키 조회
    const apiKeysRepo = new ApiKeysRepository();
    // 사용자 ID를 환경변수 또는 기본값으로 설정
    const userId = parseInt(process.env.USER_ID || '5');
    console.log(`👤 사용자 ID: ${userId}\n`);
    const apiKeys = await apiKeysRepo.findActiveByUserId(userId);
    if (apiKeys.length === 0) {
        console.log('⚠️  등록된 API 키가 없습니다.');
        return;
    }
    console.log(`✅ ${apiKeys.length}개의 활성화된 API 키를 찾았습니다.\n`);
    // ===== 업비트 거래내역 조회 =====
    const upbitKey = apiKeys.find(key => key.exchange === 'upbit');
    if (upbitKey) {
        try {
            console.log('📊 [업비트] 거래내역 조회 중...');
            console.log('-'.repeat(80));
            const upbitAdapter = new UpbitAdapter();
            upbitAdapter.setCredentials(upbitKey.apiKey, upbitKey.secretKey);
            // 업비트는 symbol 없이도 전체 거래내역 조회 가능
            const upbitTrades = await upbitAdapter.getTrades(undefined, 20);
            console.log(`\n✅ 업비트 거래내역: ${upbitTrades.length}건\n`);
            if (upbitTrades.length > 0) {
                console.log('│ ID                                   │ 심볼      │ 타입 │ 수량        │ 가격          │ 수수료      │ 시간');
                console.log('├──────────────────────────────────────┼───────────┼──────┼─────────────┼───────────────┼─────────────┼─────────────────────┤');
                upbitTrades.forEach(trade => {
                    const id = trade.id.substring(0, 36).padEnd(36);
                    const symbol = trade.symbol.padEnd(9);
                    const side = (trade.side === 'buy' ? '매수' : '매도').padEnd(4);
                    const quantity = trade.quantity.toFixed(8).padStart(11);
                    const price = trade.price.toLocaleString('ko-KR').padStart(13);
                    const fee = trade.fee.toFixed(2).padStart(11);
                    const timestamp = new Date(trade.timestamp).toLocaleString('ko-KR');
                    console.log(`│ ${id} │ ${symbol} │ ${side} │ ${quantity} │ ${price} │ ${fee} │ ${timestamp} │`);
                });
                console.log('└──────────────────────────────────────┴───────────┴──────┴─────────────┴───────────────┴─────────────┴─────────────────────┘');
            }
            else {
                console.log('⚠️  거래내역이 없습니다.');
            }
            console.log('');
        }
        catch (error) {
            console.error('❌ [업비트] 거래내역 조회 실패:', error.message);
            console.log('');
        }
    }
    else {
        console.log('⚠️  업비트 API 키가 없습니다.\n');
    }
    // ===== 바이낸스 거래내역 조회 =====
    const binanceKey = apiKeys.find(key => key.exchange === 'binance');
    if (binanceKey) {
        try {
            console.log('📊 [바이낸스] 거래내역 조회 중...');
            console.log('-'.repeat(80));
            const binanceAdapter = new BinanceAdapter();
            binanceAdapter.setCredentials(binanceKey.apiKey, binanceKey.secretKey);
            // 바이낸스는 심볼별로 조회해야 함
            const symbols = ['BTC', 'ETH', 'BNB']; // 조회할 심볼 목록
            const allBinanceTrades = [];
            for (const symbol of symbols) {
                try {
                    console.log(`  - ${symbol} 거래내역 조회 중...`);
                    const trades = await binanceAdapter.getTrades(symbol, 20);
                    allBinanceTrades.push(...trades);
                }
                catch (error) {
                    console.log(`  ⚠️  ${symbol}: ${error.message}`);
                }
            }
            // 선물 거래내역도 조회
            console.log(`  - 선물 거래내역 조회 중...`);
            for (const symbol of symbols) {
                try {
                    const futuresTrades = await binanceAdapter.getFuturesTrades(symbol, 20);
                    allBinanceTrades.push(...futuresTrades.map(t => ({ ...t, type: 'futures' })));
                }
                catch (error) {
                    console.log(`  ⚠️  선물 ${symbol}: ${error.message}`);
                }
            }
            // 시간순 정렬
            allBinanceTrades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            console.log(`\n✅ 바이낸스 거래내역: ${allBinanceTrades.length}건\n`);
            if (allBinanceTrades.length > 0) {
                console.log('│ ID          │ 타입   │ 심볼      │ 사이드 │ 수량        │ 가격         │ 수수료      │ 시간');
                console.log('├─────────────┼────────┼───────────┼────────┼─────────────┼──────────────┼─────────────┼─────────────────────┤');
                allBinanceTrades.slice(0, 20).forEach(trade => {
                    const id = trade.id.substring(0, 11).padEnd(11);
                    const type = (trade.type === 'futures' ? '선물' : '현물').padEnd(6);
                    const symbol = trade.symbol.padEnd(9);
                    const side = (trade.side === 'buy' ? '매수' : '매도').padEnd(6);
                    const quantity = trade.quantity.toFixed(8).padStart(11);
                    const price = trade.price.toLocaleString('ko-KR').padStart(12);
                    const fee = trade.fee.toFixed(6).padStart(11);
                    const timestamp = new Date(trade.timestamp).toLocaleString('ko-KR');
                    console.log(`│ ${id} │ ${type} │ ${symbol} │ ${side} │ ${quantity} │ ${price} │ ${fee} │ ${timestamp} │`);
                });
                console.log('└─────────────┴────────┴───────────┴────────┴─────────────┴──────────────┴─────────────┴─────────────────────┘');
            }
            else {
                console.log('⚠️  거래내역이 없습니다.');
            }
            console.log('');
        }
        catch (error) {
            console.error('❌ [바이낸스] 거래내역 조회 실패:', error.message);
            console.log('');
        }
    }
    else {
        console.log('⚠️  바이낸스 API 키가 없습니다.\n');
    }
    console.log('='.repeat(80));
    console.log('거래내역 조회 완료');
    console.log('='.repeat(80));
}
// 스크립트 실행
fetchTrades()
    .then(() => {
    console.log('\n✅ 모든 작업이 완료되었습니다.');
    process.exit(0);
})
    .catch(error => {
    console.error('\n❌ 오류 발생:', error);
    process.exit(1);
});
