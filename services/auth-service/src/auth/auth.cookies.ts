import type { Response } from "express";

export type CookieSameSite = "lax" | "strict" | "none";

export function setAuthCookies(params: {
  res: Response;
  accessToken: string;
  refreshToken: string;
  secure: boolean;
  sameSite: CookieSameSite;
  cookieDomain?: string;
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
    cookieDomain,
    accessMaxAgeMs,
    refreshMaxAgeMs,
    accessCookieName,
    refreshCookieName,
  } = params;

  // Browsers reject SameSite=None cookies without Secure.
  const normalizedSecure = sameSite === "none" ? true : secure;

  res.cookie(accessCookieName, accessToken, {
    httpOnly: true,
    secure: normalizedSecure,
    sameSite,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    path: "/",
    maxAge: accessMaxAgeMs,
  });

  res.cookie(refreshCookieName, refreshToken, {
    httpOnly: true,
    secure: normalizedSecure,
    sameSite,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    path: "/",
    maxAge: refreshMaxAgeMs,
  });
}

export function clearAuthCookies(params: {
  res: Response;
  secure: boolean;
  sameSite: CookieSameSite;
  cookieDomain?: string;
  accessCookieName: string;
  refreshCookieName: string;
}) {
  const {
    res,
    secure,
    sameSite,
    cookieDomain,
    accessCookieName,
    refreshCookieName,
  } = params;

  const normalizedSecure = sameSite === "none" ? true : secure;

  res.clearCookie(accessCookieName, {
    httpOnly: true,
    secure: normalizedSecure,
    sameSite,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    path: "/",
  });

  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure: normalizedSecure,
    sameSite,
    ...(cookieDomain ? { domain: cookieDomain } : {}),
    path: "/",
  });
}
