"use client";

/**
 * 认证相关的工具函数
 * 包括token管理、cookie操作、用户状态管理等
 */

import { useAuthStore } from "@/stores/auth/auth-store";
import type { AuthTokens, User } from "@/types/auth";

// Token存储键名
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_TOKEN_COOKIE = "auth-token";

/**
 * 设置认证token到localStorage和cookie
 */
export function setAuthTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;

  // 存储到localStorage（用于API调用）
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);

  // 存储到cookie（用于中间件认证）
  setAuthTokenCookie(tokens.access_token);

  // 存储用户信息
  localStorage.setItem("user", JSON.stringify(tokens.user));

  // 同步到全局 auth store（用于全局组件即时使用）
  useAuthStore.getState().setAuthFromTokens(tokens);
}

/**
 * 设置认证token到cookie
 */
export function setAuthTokenCookie(token: string): void {
  if (typeof window === "undefined") return;

  const maxAge = 60 * 60 * 24 * 7; // 7天
  document.cookie = `${AUTH_TOKEN_COOKIE}=${token}; path=/; max-age=${maxAge}; secure; samesite=strict`;
}

/**
 * 从localStorage获取访问token
 */
export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * 从cookie获取认证token
 */
export function getAuthTokenFromCookie(): string | null {
  if (typeof window === "undefined") return null;

  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${AUTH_TOKEN_COOKIE}=`))
      ?.split("=")[1] || null
  );
}

/**
 * 获取当前用户信息
 */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
}

/**
 * 清除所有认证信息
 */
export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;

  // 清除localStorage
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem("user");

  // 清除cookie
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;

  // 清除全局 auth store
  useAuthStore.getState().clearAuth();
}

/**
 * 检查用户是否已登录
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null && getAuthTokenFromCookie() !== null;
}

/**
 * 登出用户
 */
export function logout(): void {
  clearAuthTokens();

  // 重定向到登录页
  if (typeof window !== "undefined") {
    window.location.href = "/auth/v1/login";
  }
}
