import 'dotenv/config';

/** Имя access-cookie в OpenAPI и в браузере (совпадает с ACCESS_COOKIE_NAME). */
export const ACCESS_COOKIE_NAME =
  process.env.ACCESS_COOKIE_NAME?.trim() || 'accessToken';
