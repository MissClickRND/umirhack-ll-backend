import type { NextFunction, Request, Response } from 'express';

export const EMPLOYER_PUBLIC_VERIFY_PATH = '/employer/public/verify';

const ALLOWED_HEADERS = [
  'Content-Type',
  'Accept',
  'Authorization',
  'X-Requested-With',
  'Origin',
].join(', ');

const METHODS_FULL =
  'GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS' as const;
const METHODS_EMPLOYER_VERIFY = 'POST, OPTIONS' as const;

export type ConditionalCorsOptions = {
  whitelist: string[];
  allowCredentialsForWhitelist: boolean;
};

function normalizePath(path: string): string {
  if (!path || path === '/') return path;
  return path.replace(/\/+$/, '') || '/';
}

function isEmployerPublicVerify(req: Request): boolean {
  const path = normalizePath(req.path);
  if (path !== EMPLOYER_PUBLIC_VERIFY_PATH) return false;
  return req.method === 'POST' || req.method === 'OPTIONS';
}

function setVaryOrigin(res: Response): void {
  const prev = res.getHeader('Vary');
  if (prev === undefined) {
    res.setHeader('Vary', 'Origin');
  } else if (typeof prev === 'string' && !/^\s*Origin\s*$/i.test(prev)) {
    res.setHeader('Vary', `${prev}, Origin`);
  }
}

export function createConditionalCors(options: ConditionalCorsOptions) {
  const allowSet = new Set(options.whitelist);

  return function conditionalCors(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const origin = req.headers.origin as string | undefined;

    if (isEmployerPublicVerify(req)) {
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        setVaryOrigin(res);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader(
        'Access-Control-Allow-Methods',
        METHODS_EMPLOYER_VERIFY,
      );
      res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
      res.setHeader('Access-Control-Max-Age', '86400');

      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
      next();
      return;
    }

    if (!origin) {
      next();
      return;
    }

    if (allowSet.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      setVaryOrigin(res);
      if (options.allowCredentialsForWhitelist) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
      res.setHeader('Access-Control-Allow-Methods', METHODS_FULL);
      res.setHeader('Access-Control-Allow-Headers', ALLOWED_HEADERS);
      res.setHeader('Access-Control-Max-Age', '86400');

      if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
      }
      next();
      return;
    }

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  };
}
