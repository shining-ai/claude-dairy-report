import { type NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/auth/jwt';

// Paths that don't require authentication
const PUBLIC_PATHS = ['/api/v1/auth/login'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /api/v1 routes
  if (!pathname.startsWith('/api/v1')) {
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 },
    );
  }

  const token = auth.slice(7);
  try {
    const payload = await verifyJwt(token);
    const headers = new Headers(req.headers);
    headers.set('x-user-id', String(payload.userId));
    headers.set('x-user-role', payload.role);
    headers.set('x-user-email', payload.email);
    headers.set('x-user-name', payload.name);
    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証トークンが無効です' } },
      { status: 401 },
    );
  }
}

export const config = {
  matcher: '/api/v1/:path*',
};
