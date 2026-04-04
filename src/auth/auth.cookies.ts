import type { Response } from 'express';

export type CookieOptionsShape = {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    path?: string;
    maxAge: number;
};

export function setAuthCookies(params: {
  res: Response;
  accessToken: string;
  refreshToken: string;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
  domain?: string;
  accessCookieName?: string;
  refreshCookieName?: string;
}) {
  const {
    res,
    accessToken,
    refreshToken,
    secure,
    sameSite,
    accessMaxAgeMs,
    refreshMaxAgeMs,
    domain,
    accessCookieName = 'accessToken',
    refreshCookieName = 'refreshToken',
  } = params;

  res.cookie(accessCookieName, accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    path: '/', // access нужен на все запросы
    maxAge: accessMaxAgeMs,
  });

  res.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    // Часто refresh ограничивают только auth-роутами:
    path: '/auth',
    maxAge: refreshMaxAgeMs,
  });
}

export function clearAuthCookies(
  res: Response,
  params: {
    secure: boolean;
    sameSite: 'lax' | 'strict' | 'none';
    domain?: string;
    accessCookieName?: string;
    refreshCookieName?: string;
  },
) {
  const {
    secure,
    sameSite,
    domain,
    accessCookieName = 'accessToken',
    refreshCookieName = 'refreshToken',
  } = params;

  res.clearCookie(accessCookieName, {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    path: '/',
  });
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure,
    sameSite,
    domain,
    path: '/auth',
  });
}
