// @ts-ignore
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL
});

interface PositionData {
  id: number;
  type: string;
  entry_premium_rate: number;
  exit_premium_rate: number;
  realized_pnl: number;
  entry_time: string;
  exit_time: string;
  quantity: number;
  entry_price: number;
  binance_entry_price: number;
  binance_leverage: number;
  [key: string]: any;
}

export async function analyzePositions(positions: PositionData[]): Promise<string> {
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

  if (!CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY가 .env 파일에 설정되지 않았습니다.');
  }

  const anthropic = new Anthropic({
    apiKey: CLAUDE_API_KEY,
  });

  const positionsJSON = JSON.stringify(positions, null, 2);

  const prompt = `당신은 암호화폐 김치 프리미엄 차익거래 전문가입니다.
다음은 실제 수익을 낸 포지션 데이터입니다. 이 데이터를 분석하여 향후 진입 전략에 대한 인사이트를 제공해주세요.

<포지션 데이터>
${positionsJSON}

<분석 요청 사항>
1. 수익난 포지션들의 공통 패턴 분석
   - 진입 김프율(entry_premium_rate) 범위
   - 청산 김프율(exit_premium_rate) 범위
   - 포지션 유지 시간
   - 레버리지 사용 패턴

2. 최적의 진입 전략 제안
   - 어떤 김프율에서 진입하는 것이 좋은가?
   - 목표 수익률은 얼마로 설정해야 하는가?
   - 레버리지는 몇 배가 적절한가?
   - 포지션 크기는 어떻게 설정해야 하는가?

3. 리스크 관리 전략
   - 손절 기준은 어떻게 설정해야 하는가?
   - 최대 보유 시간은 어떻게 설정해야 하는가?

4. 추가 제안 사항
   - 개선할 수 있는 부분이 있다면 구체적으로 제안해주세요.

한국어로 명확하고 구체적으로 답변해주세요. 숫자와 범위를 명시하여 실전에서 바로 적용할 수 있도록 해주세요.`;

  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
  });

  const textContent = message.content.find((block: any) => block.type === 'text') as any;
  return textContent?.text || '분석 결과를 가져올 수 없습니다.';
}

export async function saveInsightToDB(
  userId: number,
  insightType: string,
  analysisData: any,
  insightText: string,
  recommendations?: any
): Promise<number> {
  const result = await pool.query(
    `INSERT INTO ai_insights (user_id, insight_type, analysis_data, insight_text, recommendations)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [userId, insightType, JSON.stringify(analysisData), insightText, recommendations ? JSON.stringify(recommendations) : null]
  );

  return result.rows[0].id;
}

// 직접 실행 시
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  (async () => {
    console.log('📊 수익 포지션 데이터 분석 시작...\n');

    // CSV 파일에서 데이터 읽기
    const csvData = readFileSync('/tmp/profitable_positions.csv', 'utf-8');
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');

    const positions: PositionData[] = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',');
      const position: any = {};

      headers.forEach((header, index) => {
        const value = values[index];
        // 숫자로 변환 가능한 필드는 변환
        if (!isNaN(Number(value)) && value !== '') {
          position[header] = Number(value);
        } else {
          position[header] = value;
        }
      });

      positions.push(position);
    }

    console.log(`✅ ${positions.length}개 포지션 데이터 로드 완료\n`);

    try {
      const analysis = await analyzePositions(positions);
      console.log('🤖 클로드 AI 분석 결과:\n');
      console.log('='.repeat(80));
      console.log(analysis);
      console.log('='.repeat(80));

      // DB에 저장
      const userId = 5; // 실제로는 로그인한 사용자 ID 사용
      const insightId = await saveInsightToDB(
        userId,
        'profitable_analysis',
        positions,
        analysis
      );

      console.log(`\n✅ 인사이트가 DB에 저장되었습니다. ID: ${insightId}`);
    } catch (error: any) {
      console.error('❌ 분석 실패:', error.message);
    } finally {
      await pool.end();
    }
  })();
}
