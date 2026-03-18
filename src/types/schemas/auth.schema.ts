import { z } from "zod";
import { SuccessResponseSchema } from "./common.schema";

// ---- リクエスト ----

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ---- レスポンス ----

export const AuthUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["sales", "manager"]),
  department: z.string(),
});

export const LoginResponseSchema = SuccessResponseSchema(
  z.object({
    token: z.string(),
    user: AuthUserSchema,
  }),
);

export const LogoutResponseSchema = SuccessResponseSchema(
  z.object({
    message: z.string(),
  }),
);

// ---- TypeScript 型 ----

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
