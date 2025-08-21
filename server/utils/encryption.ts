import crypto from 'crypto';
import CryptoJS from 'crypto-js';

// 환경변수에서 마스터 키 가져오기 (없으면 기본값 생성)
const MASTER_KEY = process.env.ENCRYPTION_KEY || 'kimchi-premium-master-key-2025';

/**
 * API 키/시크릿 키 암호화
 */
export function encryptApiKey(plaintext: string): string {
  if (!plaintext) return '';
  try {
    return CryptoJS.AES.encrypt(plaintext, MASTER_KEY).toString();
  } catch (error) {
    console.error('암호화 실패:', error);
    throw new Error('API 키 암호화에 실패했습니다');
  }
}

/**
 * API 키/시크릿 키 복호화
 */
export function decryptApiKey(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, MASTER_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      throw new Error('복호화 결과가 비어있습니다');
    }
    return decrypted;
  } catch (error) {
    console.error('복호화 실패:', error);
    throw new Error('API 키 복호화에 실패했습니다');
  }
}

/**
 * API 키 일부만 표시 (로깅용)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '***';
  return apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4);
}

/**
 * 안전한 랜덤 문자열 생성
 */
export function generateSecureRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * 환경변수 검증
 */
export function validateEncryptionEnvironment(): boolean {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn('⚠️ ENCRYPTION_KEY 환경변수가 설정되지 않았습니다. 기본값을 사용합니다.');
    return false;
  }
  return true;
}