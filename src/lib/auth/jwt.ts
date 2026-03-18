import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface JwtPayload extends JWTPayload {
  userId: number;
  role: 'sales' | 'manager';
  email: string;
  name: string;
}

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'development-secret-change-in-production',
);

const EXPIRY = '24h';

export async function signJwt(payload: Omit<JwtPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret);
}

export async function verifyJwt(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as JwtPayload;
}
