import type { LoginResponse, RefreshTokenResponse } from './auth.type';

export function pickTokensFromLoginResponse(response: LoginResponse) {
  const accessToken = response.accessToken ?? response.token;
  const refreshToken = response.refreshToken;
  const expiresIn = response.expiresIn ?? 1800;
  return { accessToken, refreshToken, expiresIn };
}

export function pickTokensFromRefreshResponse(response: RefreshTokenResponse) {
  const accessToken = response.accessToken ?? response.token ?? '';
  return {
    accessToken,
    refreshToken: response.refreshToken,
    expiresIn: response.expiresIn ?? 1800,
  };
}
