/**
 * API调试工具
 * 用于诊断API调用问题
 */

export interface ApiDebugInfo {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  response?: {
    status: number;
    statusText: string;
    data: any;
  };
  error?: string;
}

/**
 * 调试API调用
 */
export async function debugApiCall(endpoint: string, options: RequestInit = {}): Promise<ApiDebugInfo> {
  const debugInfo: ApiDebugInfo = {
    url: endpoint,
    method: options.method || "GET",
    headers: (options.headers as Record<string, string>) || {},
    body: options.body ? JSON.parse(options.body as string) : undefined,
  };

  try {
    console.log("🔍 API Debug - Request:", debugInfo);

    const response = await fetch(endpoint, options);
    const responseData = await response.json().catch(() => response.text());

    debugInfo.response = {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
    };

    console.log("🔍 API Debug - Response:", debugInfo.response);

    return debugInfo;
  } catch (error) {
    debugInfo.error = error instanceof Error ? error.message : String(error);
    console.error("🔍 API Debug - Error:", debugInfo.error);
    return debugInfo;
  }
}

/**
 * 测试后端健康状态
 */
export async function testBackendHealth(): Promise<boolean> {
  try {
    const result = await debugApiCall("/api/v1/health", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    return result.response?.status === 200;
  } catch {
    return false;
  }
}

/**
 * 测试注册接口
 */
export async function testRegisterApi(userData: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<ApiDebugInfo> {
  return debugApiCall("/api/v1/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });
}

/**
 * 测试登录接口
 */
export async function testLoginApi(credentials: { username: string; password: string }): Promise<ApiDebugInfo> {
  return debugApiCall("/api/v1/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });
}

/**
 * 测试验证码验证接口
 */
export async function testVerifyRegistrationApi(verificationData: {
  username: string;
  verificationCode: string;
}): Promise<ApiDebugInfo> {
  return debugApiCall("/api/v1/auth/verify-registration", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(verificationData),
  });
}
