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
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
var JWT_SECRET = process.env.JWT_SECRET || 'kimchi-premium-jwt-secret-2025';
var SALT_ROUNDS = 12;
/**
 * 비밀번호 해시화
 */
export function hashPassword(password) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, bcrypt.hash(password, SALT_ROUNDS)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_1 = _a.sent();
                    console.error('비밀번호 해시화 실패:', error_1);
                    throw new Error('비밀번호 처리에 실패했습니다');
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * 비밀번호 검증
 */
export function verifyPassword(password, hashedPassword) {
    return __awaiter(this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, bcrypt.compare(password, hashedPassword)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    error_2 = _a.sent();
                    console.error('비밀번호 검증 실패:', error_2);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    });
}
/**
 * JWT 토큰 생성
 */
export function generateToken(userId, username) {
    return jwt.sign({ userId: userId, username: username }, JWT_SECRET, { expiresIn: '24h' });
}
/**
 * JWT 토큰 검증
 */
export function verifyToken(token) {
    try {
        var decoded = jwt.verify(token, JWT_SECRET);
        return { userId: decoded.userId, username: decoded.username };
    }
    catch (error) {
        console.error('토큰 검증 실패:', error);
        return null;
    }
}
/**
 * 인증 미들웨어
 */
export function authenticateToken(req, res, next) {
    console.log("[\uC11C\uBC84 \uC778\uC99D] \uBBF8\uB4E4\uC6E8\uC5B4 \uC2E4\uD589: ".concat(req.method, " ").concat(req.originalUrl));
    var authHeader = req.headers['authorization'];
    console.log("[\uC11C\uBC84 \uC778\uC99D] Authorization \uD5E4\uB354 \uC218\uC2E0: ".concat(authHeader));
    var token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    if (!token) {
        console.log('[서버 인증] 실패: 요청에 토큰이 없습니다. (401 반환)');
        return res.status(401).json({ message: '로그인이 필요합니다' });
    }
    console.log("[\uC11C\uBC84 \uC778\uC99D] \uC694\uCCAD\uC5D0\uC11C \uD1A0\uD070 \uCD94\uCD9C: ".concat(token.substring(0, 15), "..."));
    var decoded = verifyToken(token);
    if (!decoded) {
        console.log('[서버 인증] 실패: 토큰이 유효하지 않습니다. (403 반환)');
        return res.status(403).json({ message: '유효하지 않은 토큰입니다' });
    }
    // 요청 객체에 사용자 정보 추가
    req.user = decoded;
    console.log("[\uC11C\uBC84 \uC778\uC99D] \uC131\uACF5: \uC0AC\uC6A9\uC790 \uC815\uBCF4\uB97C \uC694\uCCAD\uC5D0 \uCD94\uAC00\uD588\uC2B5\uB2C8\uB2E4.", decoded);
    next();
}
/**
 * 비밀번호 강도 검증
 */
export function validatePasswordStrength(password) {
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
export function validateUsername(username) {
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
