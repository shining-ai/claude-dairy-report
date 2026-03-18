import { z } from "zod";
import { DateTimeSchema, SuccessResponseSchema } from "./common.schema";

// ---- 共通サブスキーマ ----

export const UserRoleSchema = z.enum(["sales", "manager"]);

export const UserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  department: z.string().nullable(),
  is_active: z.boolean(),
});

// ---- リクエスト ----

export const CreateUserRequestSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  role: UserRoleSchema,
  department: z.string().max(50).optional().nullable(),
});

export const UpdateUserRequestSchema = z.object({
  name: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: UserRoleSchema,
  department: z.string().max(50).optional().nullable(),
});

export const UpdateUserStatusRequestSchema = z.object({
  is_active: z.boolean(),
});

// ---- レスポンス ----

export const UserDetailSchema = UserSchema.extend({
  created_at: DateTimeSchema.optional(),
  updated_at: DateTimeSchema.optional(),
});

export const GetUsersResponseSchema = SuccessResponseSchema(
  z.object({
    users: z.array(UserSchema),
  }),
);

export const GetUserResponseSchema = SuccessResponseSchema(UserDetailSchema);

export const CreateUserResponseSchema = SuccessResponseSchema(UserDetailSchema);

export const UpdateUserResponseSchema = SuccessResponseSchema(UserDetailSchema);

export const UpdateUserStatusResponseSchema = SuccessResponseSchema(
  z.object({
    id: z.number().int().positive(),
    is_active: z.boolean(),
  }),
);

// ---- TypeScript 型 ----

export type UserRole = z.infer<typeof UserRoleSchema>;
export type User = z.infer<typeof UserSchema>;
export type UserDetail = z.infer<typeof UserDetailSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type UpdateUserStatusRequest = z.infer<typeof UpdateUserStatusRequestSchema>;
export type GetUsersResponse = z.infer<typeof GetUsersResponseSchema>;
export type GetUserResponse = z.infer<typeof GetUserResponseSchema>;
export type CreateUserResponse = z.infer<typeof CreateUserResponseSchema>;
export type UpdateUserResponse = z.infer<typeof UpdateUserResponseSchema>;
export type UpdateUserStatusResponse = z.infer<typeof UpdateUserStatusResponseSchema>;
