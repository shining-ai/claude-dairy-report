import { z } from "zod";

// エラーレスポンス
export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

// ページネーション
export const PaginationSchema = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total_pages: z.number().int().nonnegative(),
});

// 成功レスポンスラッパー
export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
  });

// 共通フィールド
export const IdSchema = z.number().int().positive();
export const DateTimeSchema = z.string().datetime();
export const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
