// @ts-ignore
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();
async function testClaudeAPI() {
    console.log('🤖 클로드 API 연동 테스트 시작...\n');
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    if (!CLAUDE_API_KEY) {
        console.error('❌ CLAUDE_API_KEY가 .env 파일에 설정되지 않았습니다.');
        return false;
    }
    try {
        const anthropic = new Anthropic({
            apiKey: CLAUDE_API_KEY,
        });
        const message = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            messages: [
                {
                    role: 'user',
                    content: '안녕하세요! 간단한 연동 테스트입니다. "테스트 성공"이라고만 답변해주세요.'
                }
            ],
        });
        console.log('✅ API 연동 성공!\n');
        console.log('📝 응답 내용:');
        console.log(message.content);
        console.log('\n📊 사용 토큰:');
        console.log(`- Input: ${message.usage.input_tokens}`);
        console.log(`- Output: ${message.usage.output_tokens}`);
        return true;
    }
    catch (error) {
        console.error('❌ API 연동 실패:');
        console.error(error.message);
        return false;
    }
}
testClaudeAPI();
