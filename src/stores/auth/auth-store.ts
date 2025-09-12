"use client";

import { create } from "zustand";

import type { AuthTokens } from "@/types/auth";

export type AuthUser = {
  userId: string;
  username: string;
  email: string;
  role: string;
  name?: string; // 显示名，默认使用 username
  avatar?: string; // 头像占位，后端暂未返回
};

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  setAuthFromTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
};

function getInitialState(): Pick<AuthState, "accessToken" | "user"> {
  if (typeof window === "undefined") {
    return { accessToken: null, user: null };
  }
  try {
    const accessToken = localStorage.getItem("accessToken");
    const userStr = localStorage.getItem("user");
    const user = userStr ? (JSON.parse(userStr) as AuthUser) : null;
    return { accessToken, user };
  } catch {
    return { accessToken: null, user: null };
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...getInitialState(),
  setAuthFromTokens: (tokens) => {
    const mappedUser: AuthUser = {
      ...tokens.user,
      name: tokens.user.username ?? tokens.user.email ?? "",
      avatar: "",
    };
    set({ accessToken: tokens.access_token, user: mappedUser });
  },
  clearAuth: () => set({ accessToken: null, user: null }),
}));
