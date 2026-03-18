import { z } from "zod";
import { DateTimeSchema, SuccessResponseSchema } from "./common.schema";

// ---- 共通サブスキーマ ----

export const CommentSchema = z.object({
  id: z.number().int().positive(),
  user: z.object({
    id: z.number().int().positive(),
    name: z.string(),
  }),
  content: z.string(),
  created_at: DateTimeSchema,
});

// ---- リクエスト ----

export const CreateCommentRequestSchema = z.object({
  content: z.string().min(1),
});

// ---- レスポンス ----

export const GetCommentsResponseSchema = SuccessResponseSchema(
  z.object({
    comments: z.array(CommentSchema),
  }),
);

export const CreateCommentResponseSchema = SuccessResponseSchema(CommentSchema);

// ---- TypeScript 型 ----

export type Comment = z.infer<typeof CommentSchema>;
export type CreateCommentRequest = z.infer<typeof CreateCommentRequestSchema>;
export type GetCommentsResponse = z.infer<typeof GetCommentsResponseSchema>;
export type CreateCommentResponse = z.infer<typeof CreateCommentResponseSchema>;
