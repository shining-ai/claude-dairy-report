'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Customer = { id: number; companyName: string };
type VisitRecord = { customerId: string; visitedAt: string; visitContent: string };

type Props = {
  customers: Customer[];
  defaultDate?: string;
  defaultProblem?: string;
  defaultPlan?: string;
  defaultVisitRecords?: VisitRecord[];
  action: (formData: FormData) => Promise<void>;
};

export function ReportForm({
  customers,
  defaultDate,
  defaultProblem,
  defaultPlan,
  defaultVisitRecords = [],
  action,
}: Props) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>(
    defaultVisitRecords.length > 0
      ? defaultVisitRecords
      : [{ customerId: '', visitedAt: '', visitContent: '' }],
  );

  const addVisitRecord = () => {
    setVisitRecords((prev) => [...prev, { customerId: '', visitedAt: '', visitContent: '' }]);
  };

  const removeVisitRecord = (index: number) => {
    setVisitRecords((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVisitRecord = (index: number, field: keyof VisitRecord, value: string) => {
    setVisitRecords((prev) => prev.map((vr, i) => (i === index ? { ...vr, [field]: value } : vr)));
  };

  return (
    <form action={action} className="space-y-6">
      {/* Date */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          日付 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="report_date"
          required
          defaultValue={defaultDate ?? today}
          max={today}
          className="rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Visit records */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">訪問記録</label>
          <button
            type="button"
            onClick={addVisitRecord}
            className="rounded border border-blue-600 px-3 py-1 text-xs text-blue-600 hover:bg-blue-50"
          >
            + 訪問記録を追加
          </button>
        </div>
        <div className="space-y-3">
          {visitRecords.map((vr, i) => (
            <div key={i} className="rounded-lg border bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">訪問 {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeVisitRecord(i)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  削除
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-gray-600">
                    顧客 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="customer_id[]"
                    required
                    value={vr.customerId}
                    onChange={(e) => updateVisitRecord(i, 'customerId', e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  >
                    <option value="">選択してください</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-gray-600">訪問時刻</label>
                  <input
                    type="time"
                    name="visited_at[]"
                    value={vr.visitedAt}
                    onChange={(e) => updateVisitRecord(i, 'visitedAt', e.target.value)}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-600">
                  訪問内容 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="visit_content[]"
                  required
                  rows={3}
                  value={vr.visitContent}
                  onChange={(e) => updateVisitRecord(i, 'visitContent', e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Problem */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">今の課題・相談</label>
        <textarea
          name="problem"
          rows={3}
          defaultValue={defaultProblem ?? ''}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Plan */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">明日やること</label>
        <textarea
          name="plan"
          rows={3}
          defaultValue={defaultPlan ?? ''}
          className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          下書き保存
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
