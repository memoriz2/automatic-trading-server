import 'dotenv/config';
import express from "express";
import { registerRoutes } from "./routes.js";
import { createServer } from "http"; // ✅ 추가
import path from 'path';
import fs from 'fs';
// ✅ 환경변수 로깅 추가
console.log(`🚀 [${new Date().toISOString()}] 서버 시작 중...`);
console.log(`🌍 [${new Date().toISOString()}] NODE_ENV: ${process.env.NODE_ENV || "설정되지 않음"}`);
console.log(`🔧 [${new Date().toISOString()}] PORT: ${process.env.PORT || "5000 (기본값)"}`);
console.log(`📁 [${new Date().toISOString()}] 현재 작업 디렉토리: ${process.cwd()}`);
// ✅ DB 연결 문자열(호스트/DB만) 로깅
try {
    const rawUrl = process.env.DATABASE_URL || "";
    const maskedUrl = rawUrl.replace(/(:\/\/.*?:).*?@/, "$1****@");
    const hostDb = maskedUrl.split("@").pop();
    console.log(`🔧 [${new Date().toISOString()}] DATABASE_URL(host/db):`, hostDb);
}
catch { }
// ✅ 프로덕션 모드에서도 로그가 나오도록 설정
const isProduction = process.env.NODE_ENV === "production";
const logLevel = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");
console.log(`📊 [${new Date().toISOString()}] 로그 레벨: ${logLevel}`);
// ✅ 로그 함수 정의 - 강제 출력
const logInfo = (message, data) => {
    // 강제로 항상 출력
    console.log(`ℹ️ [${new Date().toISOString()}] ${message}`, data || "");
};
const logDebug = (message, data) => {
    // 강제로 항상 출력
    console.log(`🔍 [${new Date().toISOString()}] ${message}`, data || "");
};
const logError = (message, error) => {
    console.error(`❌ [${new Date().toISOString()}] ${message}`, error || "");
};
const app = express();
// 리버스 프록시(HTTPS) 뒤에서 secure 쿠키 신뢰
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// 쿠키 파싱 (JWT 쿠키 사용)
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { prisma } from './db.js';
app.use(cookieParser());
// 서버 세션(쿠키 기반) 설정
const PgSession = connectPgSimple(session);
app.use(session({
    store: new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'sessions',
        createTableIfMissing: false,
    }),
    secret: process.env.SESSION_SECRET || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
    },
}));
// 요청마다 마지막 활동 시각을 가볍게 갱신 (실패 무시)
app.use((req, _res, next) => {
    const user = req.session?.user;
    if (user && req.sessionID) {
        prisma.$executeRawUnsafe(`UPDATE sessions SET last_access_at=now(), user_id=COALESCE(user_id, $1) WHERE sid=$2`, user.id, req.sessionID).catch(() => { });
    }
    next();
});
// ✅ 정적 파일 접근 로그 미들웨어 추가
app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    // ✅ 강제 테스트 로그 - 모든 요청에 대해
    console.log(`🔍 [${new Date().toISOString()}] 모든 요청: ${req.method} ${path}`);
    // 정적 파일 접근 로그
    if (path.startsWith("/settings") ||
        path.startsWith("/dashboard") ||
        path.startsWith("/trading")) {
        logInfo(`📄 정적 페이지 접근: ${req.method} ${path} - IP: ${req.ip || req.connection.remoteAddress}`);
    }
    // API 요청 로그
    if (path.startsWith("/api")) {
        logInfo(`🔌 API 요청: ${req.method} ${path} - IP: ${req.ip || req.connection.remoteAddress}`);
    }
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (path.startsWith("/api")) {
            logInfo(`✅ API 응답: ${req.method} ${path} ${res.statusCode} - ${duration}ms`);
        }
        else if (path.startsWith("/settings") ||
            path.startsWith("/dashboard") ||
            path.startsWith("/trading")) {
            logInfo(`✅ 페이지 응답: ${req.method} ${path} ${res.statusCode} - ${duration}ms`);
        }
    });
    next();
});
// ✅ 가장 위에 헬스체크
app.get("/healthz", (_req, res) => {
    res.type("text/plain").send("ok");
});
// ❌ 테스트용 API 키 저장 라우트 제거: 실제 DB 저장 라우트(routes.ts)를 사용합니다.
// (기존 로깅 미들웨어 유지)
(async () => {
    console.log(`🔧 [${new Date().toISOString()}] HTTP 서버 생성 중...`);
    const server = createServer(app); // ✅ 1) app으로 http.Server 생성
    logInfo(`🛣️ 라우트 등록 중...`);
    console.log(`🔍 [${new Date().toISOString()}] 라우트 등록 시작 - registerRoutes 함수 호출`);
    try {
        await registerRoutes(app, server); // ✅ 2) 동일 server를 전달하여 WS 부착
        console.log(`🔍 [${new Date().toISOString()}] registerRoutes 함수 실행 완료`);
        // 등록된 라우트 확인
        const routes = app._router?.stack?.filter((layer) => layer.route) || [];
        console.log(`🔍 [${new Date().toISOString()}] 등록된 라우트 개수: ${routes.length}`);
        logInfo(`✅ 라우트 등록 완료`);
    }
    catch (error) {
        console.error(`💥 [${new Date().toISOString()}] 라우트 등록 실패:`, error);
        throw error;
    }
    // ✅ 서버 죽이지 않기 (throw 금지)
    app.use((err, _req, res, _next) => {
        logError(`에러 발생:`, err);
        const status = err.status ?? err.statusCode ?? 500;
        const message = err.message ?? "Internal Server Error";
        res.status(status).json({ message });
        console.error(err);
    });
    logInfo(`🌐 환경 설정 중... NODE_ENV: ${app.get("env")}`);
    if (app.get("env") === "development") {
        logInfo(`⚡ Vite 개발 서버 설정 중...`);
        const { setupVite } = await import('./vite');
        await setupVite(app, server);
        logInfo(`✅ Vite 개발 서버 설정 완료`);
    }
    else {
        logInfo(`📁 정적 파일 서빙 설정 중...`);
        const distPath = path.resolve(process.cwd(), 'dist', 'public');
        if (!fs.existsSync(distPath)) {
            console.warn(`정적 빌드 디렉토리가 없습니다: ${distPath}. 클라이언트 빌드를 먼저 수행하세요.`);
        }
        else {
            app.use(express.static(distPath));
            app.use("*", (req, res, next) => {
                if (req.originalUrl.startsWith('/api/') || req.originalUrl.startsWith('/ws') || req.originalUrl.startsWith('/healthz')) {
                    return next();
                }
                res.sendFile(path.resolve(distPath, 'index.html'));
            });
        }
        logInfo(`✅ 정적 파일 서빙 설정 완료`);
    }
    // 환경별 포트 설정
    const getPort = async () => {
        const isLocal = process.env.NODE_ENV === 'development' && (process.env.IS_LOCAL === 'true' || !process.env.IS_SERVER);
        const isServer = process.env.NODE_ENV === 'production' || process.env.IS_SERVER === 'true';
        if (isLocal) {
            // 로컬 개발 환경: 5001 포트 고정
            const port = parseInt(process.env.PORT || "5001", 10);
            logInfo(`💻 로컬 개발 환경 감지: 포트 ${port} 사용`);
            return port;
        }
        else if (isServer) {
            // 서버 환경: 반드시 5000 포트 고정
            logInfo(`🌐 서버 환경 감지: 포트 5000으로 고정`);
            return 5000;
        }
        else {
            // 기본값
            const defaultPort = parseInt(process.env.PORT || "5000", 10);
            logInfo(`⚙️ 기본 환경: 포트 ${defaultPort} 사용`);
            return defaultPort;
        }
    };
    const port = await getPort();
    logInfo(`🚀 서버 시작 중... 포트: ${port} (환경: ${process.env.NODE_ENV})`);
    // Windows 환경 호환성을 위해 host와 reusePort 옵션 제거
    server.listen(port, () => {
        console.log(`🎉 [${new Date().toISOString()}] 서버가 성공적으로 시작되었습니다!`);
        logInfo(`🌐 서버 주소: http://localhost:${port}`);
        logInfo(`🔗 API 엔드포인트: http://localhost:${port}/api`);
        logInfo(`serving on port ${port}`);
    });
    // ✅ 서버 에러 핸들링 추가
    server.on("error", (error) => {
        logError(`서버 에러 발생:`, error);
    });
})();
