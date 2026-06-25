/** Theo FE_AI_API.md: chỉ `admin` và `user` — không còn `seller`. */
export type UserRole = 'user' | 'admin';

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

export interface LoginResponse {
  message: string;
  /** Alias của accessToken (tương thích code cũ) */
  token: string;
  accessToken?: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterResponse {
  message: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface RefreshTokenResponse {
  message: string;
  token?: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LogoutResponse {
  message: string;
}

export interface LogoutPayload {
  refreshToken?: string;
}

/** @deprecated dùng RegisterPayload */
export type IRegister = RegisterPayload;
/** @deprecated dùng LoginPayload */
export type IAuth = LoginPayload;
