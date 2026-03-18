import { z } from "zod";
import { DateTimeSchema, SuccessResponseSchema } from "./common.schema";

// ---- 共通サブスキーマ ----

export const CustomerSchema = z.object({
  id: z.number().int().positive(),
  company_name: z.string(),
  contact_person: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  is_active: z.boolean(),
});

// ---- リクエスト ----

export const CreateCustomerRequestSchema = z.object({
  company_name: z.string().min(1).max(100),
  contact_person: z.string().max(50).optional().nullable(),
  phone: z
    .string()
    .regex(/^[\d-]+$/)
    .optional()
    .nullable(),
  address: z.string().max(200).optional().nullable(),
});

export const UpdateCustomerRequestSchema = CreateCustomerRequestSchema;

export const UpdateCustomerStatusRequestSchema = z.object({
  is_active: z.boolean(),
});

export const GetCustomersQuerySchema = z.object({
  q: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
});

// ---- レスポンス ----

export const CustomerDetailSchema = CustomerSchema.extend({
  created_at: DateTimeSchema.optional(),
  updated_at: DateTimeSchema.optional(),
});

export const GetCustomersResponseSchema = SuccessResponseSchema(
  z.object({
    customers: z.array(CustomerSchema),
  }),
);

export const GetCustomerResponseSchema = SuccessResponseSchema(CustomerDetailSchema);

export const CreateCustomerResponseSchema = SuccessResponseSchema(CustomerDetailSchema);

export const UpdateCustomerResponseSchema = SuccessResponseSchema(CustomerDetailSchema);

export const UpdateCustomerStatusResponseSchema = SuccessResponseSchema(
  z.object({
    id: z.number().int().positive(),
    is_active: z.boolean(),
  }),
);

// ---- TypeScript 型 ----

export type Customer = z.infer<typeof CustomerSchema>;
export type CustomerDetail = z.infer<typeof CustomerDetailSchema>;
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;
export type UpdateCustomerStatusRequest = z.infer<typeof UpdateCustomerStatusRequestSchema>;
export type GetCustomersQuery = z.infer<typeof GetCustomersQuerySchema>;
export type GetCustomersResponse = z.infer<typeof GetCustomersResponseSchema>;
export type GetCustomerResponse = z.infer<typeof GetCustomerResponseSchema>;
export type CreateCustomerResponse = z.infer<typeof CreateCustomerResponseSchema>;
export type UpdateCustomerResponse = z.infer<typeof UpdateCustomerResponseSchema>;
export type UpdateCustomerStatusResponse = z.infer<typeof UpdateCustomerStatusResponseSchema>;
