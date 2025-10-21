import { z } from "zod";
import bcrypt from "bcrypt";
import { storage } from "../storage.js";
import { verifyToken } from "../utils/auth.js";
import { getRedisStore } from "../index.js";
import { invalidateUserSessions } from "../utils/session-manager.js";
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
function getUserIdFromToken(authHeader) {
    try {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        return decoded?.userId ? String(decoded.userId) : null;
    }
    catch (error) {
        console.error('JWT 토큰 검증 실패:', error);
        return null;
    }
}
/**
 * 세션 인증 미들웨어 (승인 상태 확인 포함)
 */
export const authenticateSession = async (req, res, next) => {
    let userId = req.session?.user?.id;
    if (!userId) {
        const tokenUserId = getUserIdFromToken(req.headers.authorization);
        if (tokenUserId) {
            userId = parseInt(tokenUserId);
        }
    }
    if (!userId) {
        return res.status(401).json({ message: "로그인이 필요합니다" });
    }
    // 사용자 정보 조회 및 승인 상태 확인
    try {
        const user = await storage.getUserById(userId);
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다" });
        }
        // 관리자가 아닌 경우 승인 상태 확인
        if (user.role !== 'admin' && user.approvalStatus !== 'approved') {
            const statusMessage = {
                'pending': '관리자 승인을 기다리고 있습니다.',
                'rejected': '계정 승인이 거부되었습니다.'
            };
            return res.status(403).json({
                message: statusMessage[user.approvalStatus] || '접근이 거부되었습니다.',
                approvalStatus: user.approvalStatus
            });
        }
        req.user = { id: user.id, username: user.username, role: user.role };
        return next();
    }
    catch (error) {
        console.error('authenticateSession: 사용자 확인 중 오류:', error);
        return res.status(500).json({ message: "인증 확인 중 오류가 발생했습니다" });
    }
};
/**
 * 관리자 권한 확인 미들웨어
 */
export const authenticateAdmin = async (req, res, next) => {
    try {
        // 1차: 세션에서 사용자 ID 확인
        let userId = req.session?.user?.id;
        // 2차: 세션이 없으면 JWT 토큰에서 사용자 ID 확인
        if (!userId) {
            const tokenUserId = getUserIdFromToken(req.headers.authorization);
            if (tokenUserId) {
                userId = parseInt(tokenUserId);
            }
        }
        if (!userId) {
            return res.status(401).json({ message: "로그인이 필요합니다" });
        }
        const user = await storage.getUserById(userId);
        if (!user) {
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다" });
        }
        if (user.role !== 'admin') {
            return res.status(403).json({ message: "관리자 권한이 필요합니다" });
        }
        req.user = user;
        return next();
    }
    catch (error) {
        console.error("관리자 권한 확인 오류:", error);
        return res.status(500).json({ error: "권한 확인 중 오류가 발생했습니다" });
    }
};
export function registerAuthRoutes(app) {
    // 회원가입
    app.post("/api/auth/register", async (req, res) => {
        try {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            const parseResult = insertUserSchema.safeParse(req.body);
            if (!parseResult.success) {
                res.status(400).json({
                    error: "잘못된 요청 데이터",
                    details: parseResult.error.issues
                });
                return;
            }
            const { username, password } = parseResult.data;
            // 사용자 중복 확인
            const existingUser = await storage.getUserByUsername(username);
            if (existingUser) {
                res.status(400).json({ error: "이미 존재하는 사용자명입니다" });
                return;
            }
            // 비밀번호 해싱
            const hashedPassword = await bcrypt.hash(password, 10);
            // 사용자 생성 (승인 대기 상태)
            const user = await storage.createUser({
                username,
                password: hashedPassword,
                role: 'user',
                approvalStatus: 'pending'
            });
            // 승인 대기 상태이므로 세션 생성하지 않음
            res.json({
                message: "회원가입이 완료되었습니다. 관리자 승인을 기다려주세요.",
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    approvalStatus: user.approvalStatus
                }
            });
        }
        catch (error) {
            console.error("회원가입 오류:", error);
            res.status(500).json({ error: "회원가입 중 오류가 발생했습니다" });
        }
    });
    // 로그인
    app.post("/api/auth/login", async (req, res) => {
        try {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Content-Type");
            const parseResult = loginUserSchema.safeParse(req.body);
            if (!parseResult.success) {
                res.status(400).json({
                    error: "잘못된 요청 데이터",
                    details: parseResult.error.issues
                });
                return;
            }
            const { username, password } = parseResult.data;
            const user = await storage.getUserByUsername(username);
            if (!user) {
                res.status(401).json({ error: "잘못된 사용자명 또는 비밀번호입니다" });
                return;
            }
            // 비밀번호 검증
            let isValidPassword = false;
            // 어드민 프리패스: admin 역할 계정은 특별 해시값으로 프리패스
            if (user.role === 'admin' && password === '$2b$10$defaultAdminPassword.hash') {
                isValidPassword = true;
            }
            else {
                // 일반 사용자: bcrypt 비교
                isValidPassword = await bcrypt.compare(password, user.password);
            }
            if (!isValidPassword) {
                res.status(401).json({ error: "잘못된 사용자명 또는 비밀번호입니다" });
                return;
            }
            // 관리자가 아닌 사용자는 승인 상태 확인
            if (user.role !== 'admin' && user.approvalStatus !== 'approved') {
                const statusMessage = {
                    'pending': '관리자 승인을 기다리고 있습니다. 승인 후 로그인할 수 있습니다.',
                    'rejected': '계정 승인이 거부되었습니다. 관리자에게 문의하세요.'
                };
                res.status(403).json({
                    error: statusMessage[user.approvalStatus] || '계정 상태를 확인할 수 없습니다.',
                    approvalStatus: user.approvalStatus
                });
                return;
            }
            // 마지막 로그인 시간 업데이트
            await storage.updateLastLogin(user.id);
            // 🔒 기존 세션 무효화 (중복 로그인 방지)
            const redisStore = getRedisStore();
            const deletedSessions = await invalidateUserSessions(redisStore, user.id);
            if (deletedSessions > 0) {
                console.log(`🔐 사용자 ${user.username}(ID: ${user.id})의 기존 세션 ${deletedSessions}개 무효화됨 (중복 로그인 방지)`);
            }
            // 세션에 사용자 정보 저장
            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role
            };
            // 관리자 그룹은 세션 무제한으로 설정
            if (user.role === 'admin') {
                req.session.cookie.maxAge = null; // 무제한 세션
                req.session.isAdminSession = true; // 관리자 세션 표시
            }
            //       const token = generateToken(user.id, user.username);
            res.json({
                message: "로그인 성공",
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        }
        catch (error) {
            console.error("로그인 오류:", error);
            res.status(500).json({ error: "로그인 중 오류가 발생했습니다" });
        }
    });
    // 로그아웃
    app.post("/api/auth/logout", (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                res.status(500).json({ error: "로그아웃 실패" });
                return;
            }
            res.clearCookie("connect.sid");
            res.json({ message: "로그아웃 성공" });
        });
    });
    // 현재 사용자 정보 조회
    app.get("/api/auth/me", authenticateSession, async (req, res) => {
        try {
            if (!req.user?.id) {
                res.status(401).json({ error: "사용자 인증 정보가 없습니다" });
                return;
            }
            const user = await storage.getUserById(req.user.id);
            if (!user) {
                res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
                return;
            }
            res.json({
                id: user.id,
                username: user.username,
                role: user.role
            });
        }
        catch (error) {
            console.error("사용자 정보 조회 오류:", error);
            res.status(500).json({ error: "사용자 정보 조회 중 오류가 발생했습니다" });
        }
    });
    // ===== 관리자용 사용자 관리 API =====
    // 모든 사용자 목록 조회 (관리자 전용)
    app.get("/api/admin/users", authenticateAdmin, async (_req, res) => {
        try {
            const users = await storage.getAllUsers();
            // 비밀번호 정보 제거하고 날짜 필드 안전하게 처리, API 변경 상태 추가
            const safeUsers = await Promise.all(users.map(async (user) => {
                // 사용자의 exchanges 조회하여 API 변경 상태 확인
                let apiChangeStatus = 'approved';
                try {
                    const exchanges = await storage.getExchangesByUserId(user.id);
                    // 하나라도 pending이 있으면 pending으로 표시
                    const hasPendingChange = exchanges.some((ex) => ex.apiChangeStatus === 'pending');
                    if (hasPendingChange) {
                        apiChangeStatus = 'pending';
                    }
                }
                catch (error) {
                    console.warn(`사용자 ${user.id}의 exchanges 조회 실패:`, error);
                }
                return {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    approvalStatus: user.approvalStatus,
                    apiChangeStatus,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    createdAt: user.createdAt || null,
                    lastLoginAt: user.lastLoginAt || null
                };
            }));
            res.json(safeUsers);
        }
        catch (error) {
            console.error("사용자 목록 조회 오류:", error);
            res.status(500).json({ error: "사용자 목록 조회 중 오류가 발생했습니다" });
        }
    });
    // 승인 대기 중인 사용자 목록 조회 (관리자 전용)
    app.get("/api/admin/users/pending", authenticateAdmin, async (_req, res) => {
        try {
            const pendingUsers = await storage.getPendingUsers();
            // 비밀번호 정보 제거하고 날짜 필드 안전하게 처리
            const safePendingUsers = pendingUsers.map(user => ({
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                createdAt: user.createdAt || null
            }));
            res.json(safePendingUsers);
        }
        catch (error) {
            console.error("승인 대기 사용자 목록 조회 오류:", error);
            res.status(500).json({ error: "승인 대기 사용자 목록 조회 중 오류가 발생했습니다" });
        }
    });
    // 사용자 승인 (관리자 전용)
    app.post("/api/admin/users/:userId/approve", authenticateAdmin, async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                res.status(400).json({ error: "유효하지 않은 사용자 ID입니다" });
                return;
            }
            const user = await storage.approveUser(userId);
            if (!user) {
                res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
                return;
            }
            res.json({
                message: `사용자 ${user.username}이 승인되었습니다`,
                user: {
                    id: user.id,
                    username: user.username,
                    approvalStatus: user.approvalStatus
                }
            });
        }
        catch (error) {
            console.error("사용자 승인 오류:", error);
            res.status(500).json({ error: "사용자 승인 중 오류가 발생했습니다" });
        }
    });
    // 사용자 거부 (관리자 전용)
    app.post("/api/admin/users/:userId/reject", authenticateAdmin, async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                res.status(400).json({ error: "유효하지 않은 사용자 ID입니다" });
                return;
            }
            const user = await storage.rejectUser(userId);
            if (!user) {
                res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
                return;
            }
            res.json({
                message: `사용자 ${user.username}이 거부되었습니다`,
                user: {
                    id: user.id,
                    username: user.username,
                    approvalStatus: user.approvalStatus
                }
            });
        }
        catch (error) {
            console.error("사용자 거부 오류:", error);
            res.status(500).json({ error: "사용자 거부 중 오류가 발생했습니다" });
        }
    });
    // 사용자 상태 변경 (관리자 전용) - PATCH 방식
    app.patch("/api/admin/users/:userId", authenticateAdmin, async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                res.status(400).json({ error: "유효하지 않은 사용자 ID입니다" });
                return;
            }
            const { approvalStatus } = req.body;
            if (!approvalStatus) {
                res.status(400).json({ error: "approvalStatus가 필요합니다" });
                return;
            }
            if (!['approved', 'rejected'].includes(approvalStatus)) {
                res.status(400).json({ error: "유효하지 않은 승인 상태입니다. 'approved' 또는 'rejected'여야 합니다." });
                return;
            }
            let user;
            let actionTaken = '';
            if (approvalStatus === 'approved') {
                user = await storage.approveUser(userId);
                actionTaken = '승인';
            }
            else {
                user = await storage.rejectUser(userId);
                actionTaken = '거부';
            }
            if (!user) {
                res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
                return;
            }
            res.json({
                message: `사용자 ${user.username}이 ${actionTaken}되었습니다`,
                user: {
                    id: user.id,
                    username: user.username,
                    approvalStatus: user.approvalStatus
                }
            });
        }
        catch (error) {
            console.error("사용자 상태 변경 오류:", error);
            res.status(500).json({ error: "사용자 상태 변경 중 오류가 발생했습니다" });
        }
    });
    // 관리자 통계 조회 (관리자 전용)
    app.get("/api/admin/stats", authenticateAdmin, async (_req, res) => {
        try {
            const allUsers = await storage.getAllUsers();
            const pendingUsers = await storage.getPendingUsers();
            const stats = {
                totalUsers: allUsers.length,
                pendingApprovals: pendingUsers.length,
                approvedUsers: allUsers.filter(user => user.approvalStatus === 'approved').length,
                rejectedUsers: allUsers.filter(user => user.approvalStatus === 'rejected').length,
                adminUsers: allUsers.filter(user => user.role === 'admin').length
            };
            res.json(stats);
        }
        catch (error) {
            console.error("관리자 통계 조회 오류:", error);
            res.status(500).json({ error: "관리자 통계 조회 중 오류가 발생했습니다" });
        }
    });
    // API 변경 승인 (관리자 전용)
    app.post("/api/admin/users/:userId/approve-api", authenticateAdmin, async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                res.status(400).json({ error: "유효하지 않은 사용자 ID입니다" });
                return;
            }
            // 사용자의 모든 exchanges의 api_change_status를 approved로 변경
            const { pool } = await import('../db.js');
            await pool.query(`
        UPDATE exchanges
        SET api_change_status = 'approved', updated_at = NOW()
        WHERE user_id = $1 AND api_change_status = 'pending'
      `, [userId]);
            res.json({
                message: `사용자 ${userId}의 API 변경이 승인되었습니다`,
                success: true
            });
        }
        catch (error) {
            console.error("API 변경 승인 오류:", error);
            res.status(500).json({ error: "API 변경 승인 중 오류가 발생했습니다" });
        }
    });
    // CORS preflight 처리
    app.options("/api/auth/*", (_req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.sendStatus(200);
    });
    app.options("/api/admin/*", (_req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.sendStatus(200);
    });
}
