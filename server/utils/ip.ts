// 현재 서버의 외부 IP 주소를 확인하는 유틸리티
export async function getCurrentServerIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get server IP:', error);
    return '알 수 없음';
  }
}

// Replit 환경에서 실행 중인지 확인
export function isReplit(): boolean {
  return !!process.env.REPLIT_DOMAINS;
}