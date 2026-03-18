// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportForm } from '@/components/reports/ReportForm';

vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({ back: vi.fn() }),
}));

const mockCustomers = [
  { id: 1, companyName: '株式会社A' },
  { id: 2, companyName: '株式会社B' },
];

const noop = async (_: FormData) => {};

describe('TC-SCR-01 日報作成：訪問記録の追加・削除', () => {
  it('01: 訪問記録を複数追加できる', async () => {
    render(<ReportForm customers={mockCustomers} action={noop} />);

    const addButton = screen.getByText('+ 訪問記録を追加');

    // Initially 1 visit record
    expect(screen.getAllByText(/訪問 \d+/)).toHaveLength(1);

    // Add 3 more
    fireEvent.click(addButton);
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    expect(screen.getAllByText(/訪問 \d+/)).toHaveLength(4);
  });

  it('02: 訪問記録を削除できる', async () => {
    render(<ReportForm customers={mockCustomers} action={noop} />);

    const addButton = screen.getByText('+ 訪問記録を追加');
    fireEvent.click(addButton);

    expect(screen.getAllByText(/訪問 \d+/)).toHaveLength(2);

    // Delete first row
    const deleteButtons = screen.getAllByText('削除');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getAllByText(/訪問 \d+/)).toHaveLength(1);
  });
});
