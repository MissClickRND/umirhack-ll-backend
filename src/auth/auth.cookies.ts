import type { Response } from 'express';

export type CookieOptionsShape = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path?: string;
  maxAge: number;
};

function uniqueCookieNames(preferred: string, candidates: string[]): string[] {
  const names = new Set<string>();

  for (const name of candidates) {
    if (!name || name === preferred) continue;
    names.add(name);
  }

  return Array.from(names);
}

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

  const accessLegacyCookieNames = uniqueCookieNames(accessCookieName, [
    'accessToken',
    'access_token',
  ]);
  const refreshLegacyCookieNames = uniqueCookieNames(refreshCookieName, [
    'refreshToken',
    'refresh_token',
  ]);

  for (const legacyName of accessLegacyCookieNames) {
    res.clearCookie(legacyName, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
    });
  }

  for (const legacyName of refreshLegacyCookieNames) {
    res.clearCookie(legacyName, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/auth',
    });

    // Legacy builds might have stored refresh cookie at '/'.
    res.clearCookie(legacyName, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
    });
  }

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

  const accessCookieNames = [
    accessCookieName,
    ...uniqueCookieNames(accessCookieName, ['accessToken', 'access_token']),
  ];
  const refreshCookieNames = [
    refreshCookieName,
    ...uniqueCookieNames(refreshCookieName, ['refreshToken', 'refresh_token']),
  ];

  for (const name of accessCookieNames) {
    res.clearCookie(name, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
    });
  }

  for (const name of refreshCookieNames) {
    res.clearCookie(name, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/auth',
    });

    res.clearCookie(name, {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
    });
  }
}
