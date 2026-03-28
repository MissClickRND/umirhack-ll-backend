import type { Response } from "express";

export type CookieSameSite = "lax" | "strict" | "none";

export function setAuthCookies(params: {
  res: Response;
  accessToken: string;
  refreshToken: string;
  secure: boolean;
  sameSite: CookieSameSite;
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
  accessCookieName: string;
  refreshCookieName: string;
}) {
  const {
    res,
    accessToken,
    refreshToken,
    secure,
    sameSite,
    accessMaxAgeMs,
    refreshMaxAgeMs,
    accessCookieName,
    refreshCookieName,
  } = params;

  res.cookie(accessCookieName, accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: accessMaxAgeMs,
  });

  res.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/auth",
    maxAge: refreshMaxAgeMs,
  });
}

export function clearAuthCookies(params: {
  res: Response;
  secure: boolean;
  sameSite: CookieSameSite;
  accessCookieName: string;
  refreshCookieName: string;
}) {
  const { res, secure, sameSite, accessCookieName, refreshCookieName } = params;

  res.clearCookie(accessCookieName, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
  });

  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/auth",
  });
}
