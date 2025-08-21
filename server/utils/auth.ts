import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'kimchi-premium-jwt-secret-2025';
const SALT_ROUNDS = 12;

/**
 * 비밀번호 해시화
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    console.error('비밀번호 해시화 실패:', error);
    throw new Error('비밀번호 처리에 실패했습니다');
  }
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error('비밀번호 검증 실패:', error);
    return false;
  }
}

/**
 * JWT 토큰 생성
 */
export function generateToken(userId: number, username: string): string {
  return jwt.sign(
    { userId, username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId, username: decoded.username };
  } catch (error) {
    console.error('토큰 검증 실패:', error);
    return null;
  }
}

/**
 * 인증 미들웨어
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: '로그인이 필요합니다' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: '유효하지 않은 토큰입니다' });
  }

  // 요청 객체에 사용자 정보 추가
  (req as any).user = decoded;
  next();
}

/**
 * 비밀번호 강도 검증
 */
export function validatePasswordStrength(password: string): { isValid: boolean; message: string } {
  if (password.length < 8) {
    return { isValid: false, message: '비밀번호는 최소 8자 이상이어야 합니다' };
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: '비밀번호에 소문자가 포함되어야 합니다' };
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: '비밀번호에 대문자가 포함되어야 합니다' };
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: '비밀번호에 숫자가 포함되어야 합니다' };
  }
  
  return { isValid: true, message: '유효한 비밀번호입니다' };
}

/**
 * 사용자명 검증
 */
export function validateUsername(username: string): { isValid: boolean; message: string } {
  if (username.length < 3) {
    return { isValid: false, message: '사용자명은 최소 3자 이상이어야 합니다' };
  }
  
  if (username.length > 20) {
    return { isValid: false, message: '사용자명은 20자를 초과할 수 없습니다' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { isValid: false, message: '사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다' };
  }
  
  return { isValid: true, message: '유효한 사용자명입니다' };
}