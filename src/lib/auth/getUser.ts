import { cookies } from 'next/headers';
import { verifyJwt, type JwtPayload } from './jwt';

export const AUTH_COOKIE = 'auth_token';

/**
 * Server-side helper: reads the auth cookie and returns the decoded user.
 * Returns null if the cookie is missing or the token is invalid.
 */
export async function getUserFromCookie(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    return await verifyJwt(token);
  } catch {
    return null;
  }
}
