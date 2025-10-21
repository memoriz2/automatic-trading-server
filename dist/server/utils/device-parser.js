/**
 * 디바이스 정보 파싱 유틸리티
 * User-Agent 및 요청 정보에서 디바이스 정보 추출
 */
/**
 * User-Agent에서 디바이스 타입 추출
 */
function getDeviceType(userAgent) {
    // 태블릿 확인
    if (/(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
        return 'tablet';
    }
    // 모바일 확인
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent)) {
        return 'mobile';
    }
    // 데스크탑
    if (/windows|macintosh|linux|x11/i.test(userAgent)) {
        return 'desktop';
    }
    return 'unknown';
}
/**
 * User-Agent에서 브라우저 정보 추출
 */
function getBrowser(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('edg/'))
        return 'Edge';
    if (ua.includes('chrome/'))
        return 'Chrome';
    if (ua.includes('firefox/'))
        return 'Firefox';
    if (ua.includes('safari/') && !ua.includes('chrome'))
        return 'Safari';
    if (ua.includes('opera') || ua.includes('opr/'))
        return 'Opera';
    if (ua.includes('msie') || ua.includes('trident/'))
        return 'IE';
    return 'Unknown';
}
/**
 * User-Agent에서 OS 정보 추출
 */
function getOS(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows nt 10.0'))
        return 'Windows 10/11';
    if (ua.includes('windows nt 6.3'))
        return 'Windows 8.1';
    if (ua.includes('windows nt 6.2'))
        return 'Windows 8';
    if (ua.includes('windows nt 6.1'))
        return 'Windows 7';
    if (ua.includes('windows'))
        return 'Windows';
    if (ua.includes('mac os x')) {
        const match = ua.match(/mac os x ([\d_]+)/);
        if (match) {
            const version = match[1].replace(/_/g, '.');
            return `macOS ${version}`;
        }
        return 'macOS';
    }
    if (ua.includes('iphone'))
        return 'iOS (iPhone)';
    if (ua.includes('ipad'))
        return 'iOS (iPad)';
    if (ua.includes('android')) {
        const match = ua.match(/android ([\d.]+)/);
        if (match) {
            return `Android ${match[1]}`;
        }
        return 'Android';
    }
    if (ua.includes('linux'))
        return 'Linux';
    if (ua.includes('ubuntu'))
        return 'Ubuntu';
    return 'Unknown';
}
/**
 * 요청 객체에서 디바이스 정보 추출
 */
export function parseDeviceInfo(req) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    // IP 주소 추출 (프록시 고려)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.headers['x-real-ip'] ||
        req.ip ||
        req.connection?.remoteAddress ||
        'Unknown';
    return {
        deviceType: getDeviceType(userAgent),
        browser: getBrowser(userAgent),
        os: getOS(userAgent),
        ip
    };
}
