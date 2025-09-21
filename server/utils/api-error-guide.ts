/**
 * API 키 연동 오류 가이드 시스템
 * 사용자에게 구체적인 해결 방법을 제공
 */

export interface ApiErrorGuide {
  errorCode: string;
  title: string;
  message: string;
  solution: string;
  actionRequired: string;
  severity: 'error' | 'warning' | 'info';
  docs?: string;
}

// 업비트 API 오류 가이드
export const UPBIT_ERROR_GUIDES: Record<string, ApiErrorGuide> = {
  'INVALID_PARAMETER_APIKEY': {
    errorCode: 'UPBIT_INVALID_APIKEY',
    title: '업비트 API 키 오류',
    message: 'API 키가 잘못되었습니다',
    solution: '업비트에서 발급받은 정확한 API 키를 입력해주세요',
    actionRequired: '업비트 > 마이페이지 > Open API 관리에서 API 키를 확인하세요',
    severity: 'error',
    docs: 'https://docs.upbit.com/docs/user-request-guide'
  },
  'INVALID_PARAMETER_SECRET_KEY': {
    errorCode: 'UPBIT_INVALID_SECRET',
    title: '업비트 시크릿 키 오류',
    message: '시크릿 키가 잘못되었습니다',
    solution: '업비트에서 발급받은 정확한 시크릿 키를 입력해주세요',
    actionRequired: '업비트 > 마이페이지 > Open API 관리에서 시크릿 키를 확인하세요',
    severity: 'error',
    docs: 'https://docs.upbit.com/docs/user-request-guide'
  },
  'IP_NOT_ALLOWED': {
    errorCode: 'UPBIT_IP_BLOCKED',
    title: '업비트 IP 제한',
    message: '허용되지 않은 IP에서 접근하고 있습니다',
    solution: '현재 서버 IP를 업비트 API 설정에 추가해주세요',
    actionRequired: '업비트 > Open API 관리 > IP 주소 등록에서 서버 IP를 추가하세요',
    severity: 'error',
    docs: 'https://docs.upbit.com/docs/user-request-guide'
  },
  'PERMISSION_DENIED': {
    errorCode: 'UPBIT_PERMISSION_DENIED',
    title: '업비트 권한 부족',
    message: 'API 키에 필요한 권한이 없습니다',
    solution: 'API 키에 "자산조회" 권한을 추가해주세요',
    actionRequired: '업비트 > Open API 관리에서 API 키 권한을 "자산조회"로 설정하세요',
    severity: 'error',
    docs: 'https://docs.upbit.com/docs/user-request-guide'
  },
  'TOO_MANY_REQUESTS': {
    errorCode: 'UPBIT_RATE_LIMIT',
    title: '업비트 요청 한도 초과',
    message: 'API 요청 한도를 초과했습니다',
    solution: '잠시 후 다시 시도해주세요',
    actionRequired: '1분 후 연동 테스트를 다시 시도하세요',
    severity: 'warning',
    docs: 'https://docs.upbit.com/docs/user-request-guide'
  }
};

// 바이낸스 API 오류 가이드
export const BINANCE_ERROR_GUIDES: Record<string, ApiErrorGuide> = {
  'INVALID_API_KEY': {
    errorCode: 'BINANCE_INVALID_APIKEY',
    title: '바이낸스 API 키 오류',
    message: 'API 키가 잘못되었습니다',
    solution: '바이낸스에서 발급받은 정확한 API 키를 입력해주세요',
    actionRequired: '바이낸스 > API Management에서 API 키를 확인하세요',
    severity: 'error',
    docs: 'https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072'
  },
  'INVALID_SIGNATURE': {
    errorCode: 'BINANCE_INVALID_SECRET',
    title: '바이낸스 시크릿 키 오류',
    message: '시크릿 키가 잘못되었습니다',
    solution: '바이낸스에서 발급받은 정확한 시크릿 키를 입력해주세요',
    actionRequired: '바이낸스 > API Management에서 시크릿 키를 확인하세요',
    severity: 'error',
    docs: 'https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072'
  },
  'IP_RESTRICTION': {
    errorCode: 'BINANCE_IP_BLOCKED',
    title: '바이낸스 IP 제한',
    message: '허용되지 않은 IP에서 접근하고 있습니다',
    solution: '현재 서버 IP를 바이낸스 API 설정에 추가해주세요',
    actionRequired: '바이낸스 > API Management > IP Restriction에서 서버 IP를 추가하세요',
    severity: 'error',
    docs: 'https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072'
  },
  'API_KEY_DISABLED': {
    errorCode: 'BINANCE_API_DISABLED',
    title: '바이낸스 API 키 비활성화',
    message: 'API 키가 비활성화되어 있습니다',
    solution: '바이낸스에서 API 키를 활성화해주세요',
    actionRequired: '바이낸스 > API Management에서 API 키 상태를 "Enable"으로 변경하세요',
    severity: 'error',
    docs: 'https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072'
  },
  'INSUFFICIENT_PERMISSION': {
    errorCode: 'BINANCE_PERMISSION_DENIED',
    title: '바이낸스 권한 부족',
    message: 'API 키에 필요한 권한이 없습니다',
    solution: 'API 키에 "Enable Reading" 권한을 추가해주세요',
    actionRequired: '바이낸스 > API Management에서 "Enable Reading" 권한을 체크하세요',
    severity: 'error',
    docs: 'https://www.binance.com/en/support/faq/how-to-create-api-keys-on-binance-360002502072'
  },
  'RATE_LIMIT_EXCEEDED': {
    errorCode: 'BINANCE_RATE_LIMIT',
    title: '바이낸스 요청 한도 초과',
    message: 'API 요청 한도를 초과했습니다',
    solution: '잠시 후 다시 시도해주세요',
    actionRequired: '1분 후 연동 테스트를 다시 시도하세요',
    severity: 'warning',
    docs: 'https://binance-docs.github.io/apidocs/spot/en/#limits'
  }
};

// 일반적인 네트워크/연결 오류 가이드
export const GENERAL_ERROR_GUIDES: Record<string, ApiErrorGuide> = {
  'NETWORK_ERROR': {
    errorCode: 'NETWORK_ERROR',
    title: '네트워크 연결 오류',
    message: '인터넷 연결을 확인해주세요',
    solution: '네트워크 연결 상태를 확인하고 다시 시도해주세요',
    actionRequired: 'Wi-Fi 또는 인터넷 연결을 확인하세요',
    severity: 'error'
  },
  'TIMEOUT_ERROR': {
    errorCode: 'TIMEOUT_ERROR',
    title: '연결 시간 초과',
    message: '거래소 서버 응답이 없습니다',
    solution: '잠시 후 다시 시도해주세요',
    actionRequired: '거래소 서버 상태가 정상인지 확인하고 재시도하세요',
    severity: 'warning'
  },
  'UNKNOWN_ERROR': {
    errorCode: 'UNKNOWN_ERROR',
    title: '알 수 없는 오류',
    message: '예상하지 못한 오류가 발생했습니다',
    solution: '잠시 후 다시 시도해주세요',
    actionRequired: '문제가 지속되면 고객 지원에 문의하세요',
    severity: 'error'
  }
};

/**
 * 오류 메시지에서 적절한 가이드를 찾는 함수
 */
export function getApiErrorGuide(exchange: 'upbit' | 'binance', error: any): ApiErrorGuide {
  const errorMessage = error?.message || error?.toString() || '';
  const statusCode = error?.status || error?.statusCode;

  // 거래소별 오류 가이드 매핑
  const guides = exchange === 'upbit' ? UPBIT_ERROR_GUIDES : BINANCE_ERROR_GUIDES;

  // HTTP 상태 코드 기반 매핑
  if (statusCode === 401 || statusCode === 403) {
    if (exchange === 'upbit') {
      if (errorMessage.includes('IP')) return guides.IP_NOT_ALLOWED;
      if (errorMessage.includes('permission') || errorMessage.includes('권한')) return guides.PERMISSION_DENIED;
      return guides.INVALID_PARAMETER_APIKEY;
    } else {
      if (errorMessage.includes('IP')) return guides.IP_RESTRICTION;
      if (errorMessage.includes('signature')) return guides.INVALID_SIGNATURE;
      if (errorMessage.includes('disabled')) return guides.API_KEY_DISABLED;
      return guides.INVALID_API_KEY;
    }
  }

  if (statusCode === 429) {
    return exchange === 'upbit' ? guides.TOO_MANY_REQUESTS : guides.RATE_LIMIT_EXCEEDED;
  }

  // 오류 메시지 기반 매핑
  const lowerErrorMessage = errorMessage.toLowerCase();
  
  if (lowerErrorMessage.includes('api key') || lowerErrorMessage.includes('apikey')) {
    return exchange === 'upbit' ? guides.INVALID_PARAMETER_APIKEY : guides.INVALID_API_KEY;
  }
  
  if (lowerErrorMessage.includes('secret') || lowerErrorMessage.includes('signature')) {
    return exchange === 'upbit' ? guides.INVALID_PARAMETER_SECRET_KEY : guides.INVALID_SIGNATURE;
  }
  
  if (lowerErrorMessage.includes('ip') || lowerErrorMessage.includes('restriction')) {
    return exchange === 'upbit' ? guides.IP_NOT_ALLOWED : guides.IP_RESTRICTION;
  }
  
  if (lowerErrorMessage.includes('permission') || lowerErrorMessage.includes('권한')) {
    return exchange === 'upbit' ? guides.PERMISSION_DENIED : guides.INSUFFICIENT_PERMISSION;
  }

  if (lowerErrorMessage.includes('timeout')) {
    return GENERAL_ERROR_GUIDES.TIMEOUT_ERROR;
  }

  if (lowerErrorMessage.includes('network') || lowerErrorMessage.includes('fetch')) {
    return GENERAL_ERROR_GUIDES.NETWORK_ERROR;
  }

  // 기본 오류 가이드
  return GENERAL_ERROR_GUIDES.UNKNOWN_ERROR;
}

/**
 * 현재 서버 IP 정보를 가져오는 함수
 */
export async function getServerIpInfo(): Promise<{ ip: string; location?: string }> {
  try {
    // 여러 IP 확인 서비스를 시도
    const services = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://httpbin.org/ip'
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, { timeout: 5000 } as any);
        if (response.ok) {
          const data = await response.json();
          return {
            ip: data.ip || data.origin,
            location: data.city && data.country ? `${data.city}, ${data.country}` : undefined
          };
        }
      } catch (error) {
        continue; // 다음 서비스 시도
      }
    }
    
    return { ip: '확인 불가' };
  } catch (error) {
    return { ip: '확인 불가' };
  }
}
