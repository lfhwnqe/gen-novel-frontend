export enum Role {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export interface User {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  access_token: string;
  user: User;
}
