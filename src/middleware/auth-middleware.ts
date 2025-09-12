import { NextResponse, type NextRequest } from "next/server";

export function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authToken = req.cookies.get("auth-token");

  // 检查是否需要认证的路径
  if (!authToken && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/v1/login", req.url));
  }

  // 如果已登录，访问登录页面时重定向到dashboard
  if (authToken && (pathname === "/auth/v1/login" || pathname === "/auth/v2/login" || pathname === "/auth/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}
