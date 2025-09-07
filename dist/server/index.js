var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import express from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { createServer } from "http"; // ✅ 추가
// ✅ 환경변수 로깅 추가
console.log("\uD83D\uDE80 [".concat(new Date().toISOString(), "] \uC11C\uBC84 \uC2DC\uC791 \uC911..."));
console.log("\uD83C\uDF0D [".concat(new Date().toISOString(), "] NODE_ENV: ").concat(process.env.NODE_ENV || "설정되지 않음"));
console.log("\uD83D\uDD27 [".concat(new Date().toISOString(), "] PORT: ").concat(process.env.PORT || "5000 (기본값)"));
console.log("\uD83D\uDCC1 [".concat(new Date().toISOString(), "] \uD604\uC7AC \uC791\uC5C5 \uB514\uB809\uD1A0\uB9AC: ").concat(process.cwd()));
// ✅ DB 연결 문자열(호스트/DB만) 로깅
try {
    var rawUrl = process.env.DATABASE_URL || "";
    var maskedUrl = rawUrl.replace(/(:\/\/.*?:).*?@/, "$1****@");
    var hostDb = maskedUrl.split("@").pop();
    console.log("\uD83D\uDD27 [".concat(new Date().toISOString(), "] DATABASE_URL(host/db):"), hostDb);
}
catch (_a) { }
// ✅ 프로덕션 모드에서도 로그가 나오도록 설정
var isProduction = process.env.NODE_ENV === "production";
var logLevel = process.env.LOG_LEVEL || (isProduction ? "info" : "debug");
console.log("\uD83D\uDCCA [".concat(new Date().toISOString(), "] \uB85C\uADF8 \uB808\uBCA8: ").concat(logLevel));
// ✅ 로그 함수 정의 - 강제 출력
var logInfo = function (message, data) {
    // 강제로 항상 출력
    console.log("\u2139\uFE0F [".concat(new Date().toISOString(), "] ").concat(message), data || "");
};
var logDebug = function (message, data) {
    // 강제로 항상 출력
    console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] ").concat(message), data || "");
};
var logError = function (message, error) {
    console.error("\u274C [".concat(new Date().toISOString(), "] ").concat(message), error || "");
};
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// ✅ 정적 파일 접근 로그 미들웨어 추가
app.use(function (req, res, next) {
    var start = Date.now();
    var path = req.path;
    // ✅ 강제 테스트 로그 - 모든 요청에 대해
    console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] \uBAA8\uB4E0 \uC694\uCCAD: ").concat(req.method, " ").concat(path));
    // 정적 파일 접근 로그
    if (path.startsWith("/settings") ||
        path.startsWith("/dashboard") ||
        path.startsWith("/trading")) {
        logInfo("\uD83D\uDCC4 \uC815\uC801 \uD398\uC774\uC9C0 \uC811\uADFC: ".concat(req.method, " ").concat(path, " - IP: ").concat(req.ip || req.connection.remoteAddress));
    }
    // API 요청 로그
    if (path.startsWith("/api")) {
        logInfo("\uD83D\uDD0C API \uC694\uCCAD: ".concat(req.method, " ").concat(path, " - IP: ").concat(req.ip || req.connection.remoteAddress));
    }
    res.on("finish", function () {
        var duration = Date.now() - start;
        if (path.startsWith("/api")) {
            logInfo("\u2705 API \uC751\uB2F5: ".concat(req.method, " ").concat(path, " ").concat(res.statusCode, " - ").concat(duration, "ms"));
        }
        else if (path.startsWith("/settings") ||
            path.startsWith("/dashboard") ||
            path.startsWith("/trading")) {
            logInfo("\u2705 \uD398\uC774\uC9C0 \uC751\uB2F5: ".concat(req.method, " ").concat(path, " ").concat(res.statusCode, " - ").concat(duration, "ms"));
        }
    });
    next();
});
// ✅ 가장 위에 헬스체크
app.get("/healthz", function (_req, res) {
    res.type("text/plain").send("ok");
});
// ❌ 테스트용 API 키 저장 라우트 제거: 실제 DB 저장 라우트(routes.ts)를 사용합니다.
// (기존 로깅 미들웨어 유지)
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var server, routes, error_1, getPort, port;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                console.log("\uD83D\uDD27 [".concat(new Date().toISOString(), "] HTTP \uC11C\uBC84 \uC0DD\uC131 \uC911..."));
                server = createServer(app);
                logInfo("\uD83D\uDEE3\uFE0F \uB77C\uC6B0\uD2B8 \uB4F1\uB85D \uC911...");
                console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] \uB77C\uC6B0\uD2B8 \uB4F1\uB85D \uC2DC\uC791 - registerRoutes \uD568\uC218 \uD638\uCD9C"));
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, registerRoutes(app, server)];
            case 2:
                _c.sent(); // ✅ 2) 동일 server를 전달하여 WS 부착
                console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] registerRoutes \uD568\uC218 \uC2E4\uD589 \uC644\uB8CC"));
                routes = ((_b = (_a = app._router) === null || _a === void 0 ? void 0 : _a.stack) === null || _b === void 0 ? void 0 : _b.filter(function (layer) { return layer.route; })) || [];
                console.log("\uD83D\uDD0D [".concat(new Date().toISOString(), "] \uB4F1\uB85D\uB41C \uB77C\uC6B0\uD2B8 \uAC1C\uC218: ").concat(routes.length));
                logInfo("\u2705 \uB77C\uC6B0\uD2B8 \uB4F1\uB85D \uC644\uB8CC");
                return [3 /*break*/, 4];
            case 3:
                error_1 = _c.sent();
                console.error("\uD83D\uDCA5 [".concat(new Date().toISOString(), "] \uB77C\uC6B0\uD2B8 \uB4F1\uB85D \uC2E4\uD328:"), error_1);
                throw error_1;
            case 4:
                // ✅ 서버 죽이지 않기 (throw 금지)
                app.use(function (err, _req, res, _next) {
                    var _a, _b, _c;
                    logError("\uC5D0\uB7EC \uBC1C\uC0DD:", err);
                    var status = (_b = (_a = err.status) !== null && _a !== void 0 ? _a : err.statusCode) !== null && _b !== void 0 ? _b : 500;
                    var message = (_c = err.message) !== null && _c !== void 0 ? _c : "Internal Server Error";
                    res.status(status).json({ message: message });
                    console.error(err);
                });
                logInfo("\uD83C\uDF10 \uD658\uACBD \uC124\uC815 \uC911... NODE_ENV: ".concat(app.get("env")));
                if (!(app.get("env") === "development")) return [3 /*break*/, 6];
                logInfo("\u26A1 Vite \uAC1C\uBC1C \uC11C\uBC84 \uC124\uC815 \uC911...");
                return [4 /*yield*/, setupVite(app, server)];
            case 5:
                _c.sent(); // ✅ 3) 같은 server를 Vite에도 넘김
                logInfo("\u2705 Vite \uAC1C\uBC1C \uC11C\uBC84 \uC124\uC815 \uC644\uB8CC");
                return [3 /*break*/, 7];
            case 6:
                logInfo("\uD83D\uDCC1 \uC815\uC801 \uD30C\uC77C \uC11C\uBE59 \uC124\uC815 \uC911...");
                serveStatic(app);
                logInfo("\u2705 \uC815\uC801 \uD30C\uC77C \uC11C\uBE59 \uC124\uC815 \uC644\uB8CC");
                _c.label = 7;
            case 7:
                getPort = function () { return __awaiter(void 0, void 0, void 0, function () {
                    var isLocal, isServer, port_1, defaultPort;
                    return __generator(this, function (_a) {
                        isLocal = process.env.NODE_ENV === 'development' && (process.env.IS_LOCAL === 'true' || !process.env.IS_SERVER);
                        isServer = process.env.NODE_ENV === 'production' || process.env.IS_SERVER === 'true';
                        if (isLocal) {
                            port_1 = parseInt(process.env.PORT || "5001", 10);
                            logInfo("\uD83D\uDCBB \uB85C\uCEEC \uAC1C\uBC1C \uD658\uACBD \uAC10\uC9C0: \uD3EC\uD2B8 ".concat(port_1, " \uC0AC\uC6A9"));
                            return [2 /*return*/, port_1];
                        }
                        else if (isServer) {
                            // 서버 환경: 반드시 5000 포트 고정
                            logInfo("\uD83C\uDF10 \uC11C\uBC84 \uD658\uACBD \uAC10\uC9C0: \uD3EC\uD2B8 5000\uC73C\uB85C \uACE0\uC815");
                            return [2 /*return*/, 5000];
                        }
                        else {
                            defaultPort = parseInt(process.env.PORT || "5000", 10);
                            logInfo("\u2699\uFE0F \uAE30\uBCF8 \uD658\uACBD: \uD3EC\uD2B8 ".concat(defaultPort, " \uC0AC\uC6A9"));
                            return [2 /*return*/, defaultPort];
                        }
                        return [2 /*return*/];
                    });
                }); };
                return [4 /*yield*/, getPort()];
            case 8:
                port = _c.sent();
                logInfo("\uD83D\uDE80 \uC11C\uBC84 \uC2DC\uC791 \uC911... \uD3EC\uD2B8: ".concat(port, " (\uD658\uACBD: ").concat(process.env.NODE_ENV, ")"));
                // Windows 환경 호환성을 위해 host와 reusePort 옵션 제거
                server.listen(port, function () {
                    console.log("\uD83C\uDF89 [".concat(new Date().toISOString(), "] \uC11C\uBC84\uAC00 \uC131\uACF5\uC801\uC73C\uB85C \uC2DC\uC791\uB418\uC5C8\uC2B5\uB2C8\uB2E4!"));
                    logInfo("\uD83C\uDF10 \uC11C\uBC84 \uC8FC\uC18C: http://localhost:".concat(port));
                    logInfo("\uD83D\uDD17 API \uC5D4\uB4DC\uD3EC\uC778\uD2B8: http://localhost:".concat(port, "/api"));
                    log("serving on port ".concat(port));
                });
                // ✅ 서버 에러 핸들링 추가
                server.on("error", function (error) {
                    logError("\uC11C\uBC84 \uC5D0\uB7EC \uBC1C\uC0DD:", error);
                });
                return [2 /*return*/];
        }
    });
}); })();
