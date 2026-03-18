import type { DailyReport, VisitRecord, Comment, User, Customer } from '@/generated/prisma/client';

type VisitRecordWithCustomer = VisitRecord & { customer: Customer };
type CommentWithUser = Comment & { user: User };
type ReportWithRelations = DailyReport & {
  user: User;
  visitRecords: VisitRecordWithCustomer[];
  comments?: CommentWithUser[];
};

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatReportDetail(report: ReportWithRelations) {
  return {
    id: report.id,
    user: {
      id: report.user.id,
      name: report.user.name,
      department: report.user.department,
    },
    report_date: formatDate(report.reportDate),
    problem: report.problem,
    plan: report.plan,
    status: report.status,
    submitted_at: report.submittedAt?.toISOString() ?? null,
    visit_records: report.visitRecords.map((vr) => ({
      id: vr.id,
      customer: {
        id: vr.customer.id,
        company_name: vr.customer.companyName,
        contact_person: vr.customer.contactPerson,
      },
      visited_at: vr.visitedAt,
      visit_content: vr.visitContent,
    })),
    comments: report.comments?.map((c) => ({
      id: c.id,
      user: { id: c.user.id, name: c.user.name },
      content: c.content,
      created_at: c.createdAt.toISOString(),
    })),
    created_at: report.createdAt.toISOString(),
    updated_at: report.updatedAt.toISOString(),
  };
}
