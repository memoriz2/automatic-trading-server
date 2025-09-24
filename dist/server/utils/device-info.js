/**
 * 디바이스 정보 관련 유틸리티
 */
/**
 * User-Agent를 분석하여 디바이스 타입을 결정
 */
export function getDeviceTypeFromUserAgent(userAgent) {
    if (!userAgent)
        return 'desktop';
    const ua = userAgent.toLowerCase();
    // 모바일 디바이스 감지
    if (ua.includes('mobile') ||
        ua.includes('android') ||
        ua.includes('iphone') ||
        ua.includes('ipod') ||
        ua.includes('blackberry') ||
        ua.includes('windows phone')) {
        return 'mobile';
    }
    // 태블릿 감지
    if (ua.includes('ipad') ||
        ua.includes('tablet') ||
        (ua.includes('android') && !ua.includes('mobile'))) {
        return 'tablet';
    }
    // 기본값은 데스크톱
    return 'desktop';
}
/**
 * 요청에서 디바이스 정보를 추출
 */
export function extractDeviceInfo(req) {
    const userAgent = req.headers['user-agent'];
    const deviceType = getDeviceTypeFromUserAgent(userAgent);
    // 실제 클라이언트 IP 주소 추출
    let clientIp = 'unknown';
    // 1. X-Forwarded-For 헤더 (프록시 환경)
    if (req.headers['x-forwarded-for']) {
        const forwardedIps = req.headers['x-forwarded-for'].split(',');
        clientIp = forwardedIps[0].trim(); // 첫 번째 IP가 실제 클라이언트 IP
    }
    // 2. X-Real-IP 헤더 (nginx 등)
    else if (req.headers['x-real-ip']) {
        clientIp = req.headers['x-real-ip'];
    }
    // 3. req.ip (Express 기본)
    else if (req.ip) {
        clientIp = req.ip;
    }
    // 4. connection.remoteAddress
    else if (req.connection?.remoteAddress) {
        clientIp = req.connection.remoteAddress;
    }
    // 5. socket.remoteAddress
    else if (req.socket?.remoteAddress) {
        clientIp = req.socket.remoteAddress;
    }
    // IPv6 로컬호스트를 IPv4로 변환
    if (clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
        clientIp = '127.0.0.1';
    }
    return {
        deviceId: clientIp, // IP를 deviceId로도 사용
        deviceType,
        userAgent,
        ip: clientIp
    };
}
/**
 * 디바이스 정보를 로깅용 문자열로 변환
 */
export function formatDeviceInfo(deviceInfo) {
    return `${deviceInfo.deviceType}(${deviceInfo.deviceId})`;
}
/**
 * 디바이스 ID가 유효한지 확인
 */
export function isValidDeviceId(deviceId) {
    return !!(deviceId && deviceId !== 'unknown' && deviceId.length > 5);
}
