import { z } from "zod";
import { DateSchema, DateTimeSchema, PaginationSchema, SuccessResponseSchema } from "./common.schema";

// ---- 共通サブスキーマ ----

export const ReportStatusSchema = z.enum(["draft", "submitted"]);

export const VisitRecordRequestSchema = z.object({
  customer_id: z.number().int().positive(),
  visited_at: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .nullable(),
  visit_content: z.string().min(1),
});

export const CustomerSummarySchema = z.object({
  id: z.number().int().positive(),
  company_name: z.string(),
  contact_person: z.string().optional().nullable(),
});

export const VisitRecordResponseSchema = z.object({
  id: z.number().int().positive(),
  customer: CustomerSummarySchema,
  visited_at: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .nullable(),
  visit_content: z.string(),
});

export const CommentInReportSchema = z.object({
  id: z.number().int().positive(),
  user: z.object({
    id: z.number().int().positive(),
    name: z.string(),
  }),
  content: z.string(),
  created_at: DateTimeSchema,
});

export const UserSummarySchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  department: z.string().optional(),
});

// ---- リクエスト ----

export const CreateReportRequestSchema = z.object({
  report_date: DateSchema,
  problem: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  visit_records: z.array(VisitRecordRequestSchema).default([]),
});

export const UpdateReportRequestSchema = CreateReportRequestSchema;

export const GetReportsQuerySchema = z.object({
  from: DateSchema.optional(),
  to: DateSchema.optional(),
  user_id: z.coerce.number().int().positive().optional(),
  status: ReportStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().positive().default(20),
});

// ---- レスポンス ----

export const ReportListItemSchema = z.object({
  id: z.number().int().positive(),
  user: z.object({
    id: z.number().int().positive(),
    name: z.string(),
  }),
  report_date: DateSchema,
  status: ReportStatusSchema,
  visit_count: z.number().int().nonnegative(),
  comment_count: z.number().int().nonnegative(),
  submitted_at: DateTimeSchema.nullable(),
  updated_at: DateTimeSchema,
});

export const ReportDetailSchema = z.object({
  id: z.number().int().positive(),
  user: UserSummarySchema,
  report_date: DateSchema,
  problem: z.string().nullable(),
  plan: z.string().nullable(),
  status: ReportStatusSchema,
  submitted_at: DateTimeSchema.nullable(),
  visit_records: z.array(VisitRecordResponseSchema),
  comments: z.array(CommentInReportSchema).optional(),
  created_at: DateTimeSchema,
  updated_at: DateTimeSchema,
});

export const GetReportsResponseSchema = SuccessResponseSchema(
  z.object({
    reports: z.array(ReportListItemSchema),
    pagination: PaginationSchema,
  }),
);

export const GetReportResponseSchema = SuccessResponseSchema(ReportDetailSchema);

export const CreateReportResponseSchema = SuccessResponseSchema(ReportDetailSchema);

export const UpdateReportResponseSchema = SuccessResponseSchema(ReportDetailSchema);

export const SubmitReportResponseSchema = SuccessResponseSchema(
  z.object({
    id: z.number().int().positive(),
    status: z.literal("submitted"),
    submitted_at: DateTimeSchema,
  }),
);

// ---- TypeScript 型 ----

export type ReportStatus = z.infer<typeof ReportStatusSchema>;
export type VisitRecordRequest = z.infer<typeof VisitRecordRequestSchema>;
export type VisitRecordResponse = z.infer<typeof VisitRecordResponseSchema>;
export type ReportListItem = z.infer<typeof ReportListItemSchema>;
export type ReportDetail = z.infer<typeof ReportDetailSchema>;
export type CreateReportRequest = z.infer<typeof CreateReportRequestSchema>;
export type UpdateReportRequest = z.infer<typeof UpdateReportRequestSchema>;
export type GetReportsQuery = z.infer<typeof GetReportsQuerySchema>;
export type GetReportsResponse = z.infer<typeof GetReportsResponseSchema>;
export type GetReportResponse = z.infer<typeof GetReportResponseSchema>;
export type CreateReportResponse = z.infer<typeof CreateReportResponseSchema>;
export type UpdateReportResponse = z.infer<typeof UpdateReportResponseSchema>;
export type SubmitReportResponse = z.infer<typeof SubmitReportResponseSchema>;
