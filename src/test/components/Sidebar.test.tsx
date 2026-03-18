// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/'),
}));

describe('TC-SCR-08 サイドメニュー権限制御', () => {
  it('営業マスタメニューが営業には非表示', () => {
    render(<Sidebar role="sales" />);
    expect(screen.queryByText('営業マスタ')).toBeNull();
  });

  it('営業マスタメニューが上長には表示される', () => {
    render(<Sidebar role="manager" />);
    expect(screen.getByText('営業マスタ')).toBeDefined();
  });

  it('ダッシュボード・日報一覧・顧客マスタは全ロールで表示', () => {
    render(<Sidebar role="sales" />);
    expect(screen.getByText('ダッシュボード')).toBeDefined();
    expect(screen.getByText('日報一覧')).toBeDefined();
    expect(screen.getByText('顧客マスタ')).toBeDefined();
  });
});
