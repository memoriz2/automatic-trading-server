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
    console.log('authenticateSession: 세션 확인 중...', {
        hasSession: !!req.session,
        hasUser: !!req.session?.user,
        userId: req.session?.user?.id,
        authHeader: req.headers.authorization ? 'present' : 'missing'
    });
    let userId = req.session?.user?.id;
    if (!userId) {
        const tokenUserId = getUserIdFromToken(req.headers.authorization);
        console.log('authenticateSession: JWT 토큰에서 추출된 사용자 ID:', tokenUserId);
        if (tokenUserId) {
            userId = parseInt(tokenUserId);
        }
    }
    if (!userId) {
        console.log('authenticateSession: 인증 실패 - 세션과 토큰 모두 유효하지 않음');
        return res.status(401).json({ message: "로그인이 필요합니다" });
    }
    // 사용자 정보 조회 및 승인 상태 확인
    try {
        const user = await storage.getUserById(userId);
        if (!user) {
            console.log('authenticateSession: 사용자를 찾을 수 없음, ID:', userId);
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다" });
        }
        // 관리자가 아닌 경우 승인 상태 확인
        if (user.role !== 'admin' && user.approvalStatus !== 'approved') {
            console.log('authenticateSession: 승인되지 않은 사용자:', user.username, user.approvalStatus);
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
        console.log('authenticateSession: 사용자 인증 및 승인 확인 완료:', user.username);
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
        console.log('authenticateAdmin: 관리자 권한 확인 시작', {
            hasSession: !!req.session,
            sessionUserId: req.session?.user?.id,
            authHeader: req.headers.authorization ? 'present' : 'missing'
        });
        // 1차: 세션에서 사용자 ID 확인
        let userId = req.session?.user?.id;
        // 2차: 세션이 없으면 JWT 토큰에서 사용자 ID 확인
        if (!userId) {
            const tokenUserId = getUserIdFromToken(req.headers.authorization);
            if (tokenUserId) {
                userId = parseInt(tokenUserId);
                console.log('authenticateAdmin: JWT 토큰에서 사용자 ID 추출됨:', userId);
            }
        }
        else {
            console.log('authenticateAdmin: 세션에서 사용자 ID 확인됨:', userId);
        }
        if (!userId) {
            console.log('authenticateAdmin: 사용자 ID를 찾을 수 없음');
            return res.status(401).json({ message: "로그인이 필요합니다" });
        }
        console.log('authenticateAdmin: getUserById 호출 전, userId:', userId, typeof userId);
        const user = await storage.getUserById(userId);
        if (!user) {
            console.log('authenticateAdmin: 사용자를 찾을 수 없음, ID:', userId);
            return res.status(401).json({ message: "사용자를 찾을 수 없습니다" });
        }
        if (user.role !== 'admin') {
            console.log('authenticateAdmin: 관리자 권한 없음:', user.username, user.role);
            return res.status(403).json({ message: "관리자 권한이 필요합니다" });
        }
        console.log('authenticateAdmin: 관리자 권한 확인 완료:', user.username);
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
            console.log('🔍 로그인 승인 상태 확인:', {
                username: user.username,
                role: user.role,
                approvalStatus: user.approvalStatus,
                approvalStatusType: typeof user.approvalStatus
            });
            // 관리자가 아닌 사용자는 승인 상태 확인
            if (user.role !== 'admin' && user.approvalStatus !== 'approved') {
                const statusMessage = {
                    'pending': '관리자 승인을 기다리고 있습니다. 승인 후 로그인할 수 있습니다.',
                    'rejected': '계정 승인이 거부되었습니다. 관리자에게 문의하세요.'
                };
                return res.status(403).json({
                    error: statusMessage[user.approvalStatus] || '계정 상태를 확인할 수 없습니다.',
                    approvalStatus: user.approvalStatus
                });
            }
            // 마지막 로그인 시간 업데이트
            await storage.updateLastLogin(user.id);
            // 세션에 사용자 정보 저장
            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role
            };
            // 관리자 그룹은 세션 무제한으로 설정
            if (user.role === 'admin') {
                console.log(`🔓 관리자 ${user.username}의 세션을 무제한으로 설정`);
                req.session.cookie.maxAge = null; // 무제한 세션
                req.session.isAdminSession = true; // 관리자 세션 표시
            }
            const token = generateToken(user.id, user.username);
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
                return res.status(500).json({ error: "로그아웃 실패" });
            }
            res.clearCookie("connect.sid");
            res.json({ message: "로그아웃 성공" });
        });
    });
    // 현재 사용자 정보 조회
    app.get("/api/auth/me", authenticateSession, async (req, res) => {
        try {
            console.log('/api/auth/me: 요청된 사용자 정보:', {
                reqUser: req.user,
                userId: req.user?.id,
                userType: typeof req.user?.id
            });
            if (!req.user?.id) {
                console.error('/api/auth/me: req.user.id가 undefined입니다');
                return res.status(401).json({ error: "사용자 인증 정보가 없습니다" });
            }
            const user = await storage.getUserById(req.user.id);
            if (!user) {
                return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
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
    app.get("/api/admin/users", authenticateAdmin, async (req, res) => {
        try {
            const users = await storage.getAllUsers();
            // 비밀번호 정보 제거하고 날짜 필드 안전하게 처리
            const safeUsers = users.map(user => {
                console.log('User data fields:', {
                    id: user.id,
                    username: user.username,
                    approvalStatus: user.approvalStatus,
                    approvalStatusType: typeof user.approvalStatus,
                    createdAt: user.createdAt,
                    createdAtType: typeof user.createdAt,
                    lastLoginAt: user.lastLoginAt,
                    lastLoginAtType: typeof user.lastLoginAt
                });
                return {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    approvalStatus: user.approvalStatus,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    createdAt: user.createdAt || null,
                    lastLoginAt: user.lastLoginAt || null
                };
            });
            console.log('Final safeUsers:', JSON.stringify(safeUsers, null, 2));
            res.json(safeUsers);
        }
        catch (error) {
            console.error("사용자 목록 조회 오류:", error);
            res.status(500).json({ error: "사용자 목록 조회 중 오류가 발생했습니다" });
        }
    });
    // 승인 대기 중인 사용자 목록 조회 (관리자 전용)
    app.get("/api/admin/users/pending", authenticateAdmin, async (req, res) => {
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
                return res.status(400).json({ error: "유효하지 않은 사용자 ID입니다" });
            }
            const user = await storage.approveUser(userId);
            if (!user) {
                return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
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
                return res.status(400).json({ error: "유효하지 않은 사용자 ID입니다" });
            }
            const user = await storage.rejectUser(userId);
            if (!user) {
                return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
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
            console.log('PATCH /api/admin/users/:userId - 요청 데이터:', {
                params: req.params,
                body: req.body,
                userId: req.params.userId
            });
            const userId = parseInt(req.params.userId);
            if (isNaN(userId)) {
                console.error('Invalid userId:', req.params.userId);
                return res.status(400).json({ error: "유효하지 않은 사용자 ID입니다" });
            }
            const { approvalStatus } = req.body;
            console.log('Extracted approvalStatus:', approvalStatus);
            if (!approvalStatus) {
                return res.status(400).json({ error: "approvalStatus가 필요합니다" });
            }
            if (!['approved', 'rejected'].includes(approvalStatus)) {
                console.error('Invalid approvalStatus:', approvalStatus);
                return res.status(400).json({ error: "유효하지 않은 승인 상태입니다. 'approved' 또는 'rejected'여야 합니다." });
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
                return res.status(404).json({ error: "사용자를 찾을 수 없습니다" });
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
    app.get("/api/admin/stats", authenticateAdmin, async (req, res) => {
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
