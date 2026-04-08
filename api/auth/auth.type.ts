export type UserRole = 'user' | 'seller' | 'admin';

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  role?: UserRole;
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
  token: string;
}

export interface RegisterResponse {
  message: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface RefreshTokenResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

/** @deprecated dùng RegisterPayload */
export type IRegister = RegisterPayload;
/** @deprecated dùng LoginPayload */
export type IAuth = LoginPayload;
