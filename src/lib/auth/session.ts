import { type NextRequest, NextResponse } from 'next/server';
import { verifyJwt, type JwtPayload } from './jwt';

export type AuthUser = JwtPayload;

/**
 * Extracts and verifies the JWT from the Authorization header.
 * Returns null if no token or invalid token.
 */
export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  const token = auth.slice(7);
  try {
    return await verifyJwt(token);
  } catch {
    return null;
  }
}

/**
 * Returns a 401 Unauthorized response.
 */
export function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
    { status: 401 },
  );
}

/**
 * Returns a 403 Forbidden response.
 */
export function forbidden(message = '権限がありません'): NextResponse {
  return NextResponse.json({ error: { code: 'FORBIDDEN', message } }, { status: 403 });
}

/**
 * Checks that the authenticated user has one of the required roles.
 * Returns the user or a NextResponse error if not authorized.
 */
export function requireRole(
  user: AuthUser,
  ...roles: Array<'sales' | 'manager'>
): { ok: true; user: AuthUser } | { ok: false; response: NextResponse } {
  if (!roles.includes(user.role)) {
    return { ok: false, response: forbidden() };
  }
  return { ok: true, user };
}
