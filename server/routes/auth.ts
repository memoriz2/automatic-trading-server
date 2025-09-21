import type { Express } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import { storage } from "../storage.js";
import { generateToken, verifyToken } from "../utils/auth.js";

const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const loginUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

/**
 * JWT 토큰에서 사용자 ID 추출
 */
function getUserIdFromToken(authHeader?: string): string | null {
  try {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    return decoded?.userId ? String(decoded.userId) : null;
  } catch (error) {
    console.error('JWT 토큰 검증 실패:', error);
    return null;
  }
}

/**
 * 세션 인증 미들웨어
 */
export const authenticateSession = (req: any, res: any, next: any) => {
  if (req.session?.user?.id) {
    req.user = req.session.user;
    return next();
  }
  
  const userId = getUserIdFromToken(req.headers.authorization);
  if (userId) {
    req.user = { id: parseInt(userId) };
    return next();
  }
  
  return res.status(401).json({ message: "로그인이 필요합니다" });
};

export function registerAuthRoutes(app: Express): void {
  // 회원가입
  app.post("/api/auth/register", async (req, res) => {
    try {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");

      const parseResult = insertUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "잘못된 요청 데이터", 
          details: parseResult.error.issues 
        });
      }

      const { username, password } = parseResult.data;

      // 사용자 중복 확인
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "이미 존재하는 사용자명입니다" });
      }

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 10);

      // 사용자 생성
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role: 'user'
      });

      // 세션에 사용자 정보 저장
      (req as any).session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      res.json({
        message: "회원가입 성공",
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error("회원가입 오류:", error);
      res.status(500).json({ error: "회원가입 중 오류가 발생했습니다" });
    }
  });

  // 로그인
  app.post("/api/auth/login", async (req: any, res) => {
    try {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");

      const parseResult = loginUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "잘못된 요청 데이터", 
          details: parseResult.error.issues 
        });
      }

      const { username, password } = parseResult.data;

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "잘못된 사용자명 또는 비밀번호입니다" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "잘못된 사용자명 또는 비밀번호입니다" });
      }

      // 세션에 사용자 정보 저장
      (req as any).session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };

      const token = generateToken(user.id, user.username);

      res.json({
        message: "로그인 성공",
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error("로그인 오류:", error);
      res.status(500).json({ error: "로그인 중 오류가 발생했습니다" });
    }
  });

  // 로그아웃
  app.post("/api/auth/logout", (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ error: "로그아웃 실패" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "로그아웃 성공" });
    });
  });

  // 현재 사용자 정보 조회
  app.get("/api/auth/me", authenticateSession, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      console.error("사용자 정보 조회 오류:", error);
      res.status(500).json({ error: "사용자 정보 조회 중 오류가 발생했습니다" });
    }
  });

  // CORS preflight 처리
  app.options("/api/auth/*", (_req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.sendStatus(200);
  });
}
