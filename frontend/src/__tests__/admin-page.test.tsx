import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AdminPage from '@/app/admin/page';

const mockUseAuth = vi.fn();

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/app/admin/components/admin-tasks', () => ({
  default: () => <div data-testid="admin-tasks">AdminTasks</div>,
}));
vi.mock('@/app/admin/components/admin-users', () => ({
  default: () => <div data-testid="admin-users">AdminUsers</div>,
}));
vi.mock('@/app/admin/components/admin-variants', () => ({
  default: () => <div data-testid="admin-variants">AdminVariants</div>,
}));
vi.mock('@/app/admin/components/admin-classes', () => ({
  default: () => <div data-testid="admin-classes">AdminClasses</div>,
}));
vi.mock('@/app/admin/components/admin-stats', () => ({
  default: () => <div data-testid="admin-stats">AdminStats</div>,
}));

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows access denied for non-admin users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'student', role: 'student' },
    });
    render(<AdminPage />);
    expect(screen.getByText(/доступ только для администраторов/i)).toBeInTheDocument();
  });

  it('shows access denied for null user', () => {
    mockUseAuth.mockReturnValue({ user: null });
    render(<AdminPage />);
    expect(screen.getByText(/доступ только для администраторов/i)).toBeInTheDocument();
  });

  it('shows access denied for teacher', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 2, username: 'teacher', role: 'teacher' },
    });
    render(<AdminPage />);
    expect(screen.getByText(/доступ только для администраторов/i)).toBeInTheDocument();
  });

  it('renders admin panel for admin user', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', role: 'admin' },
    });
    render(<AdminPage />);
    expect(screen.getByText('Админ-панель')).toBeInTheDocument();
  });

  it('renders all tab buttons', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', role: 'admin' },
    });
    render(<AdminPage />);
    expect(screen.getByText(/задания/i)).toBeInTheDocument();
    expect(screen.getByText(/пользователи/i)).toBeInTheDocument();
    expect(screen.getByText(/варианты/i)).toBeInTheDocument();
    expect(screen.getByText(/классы/i)).toBeInTheDocument();
    expect(screen.getByText(/статистика/i)).toBeInTheDocument();
  });

  it('shows tasks tab by default', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', role: 'admin' },
    });
    render(<AdminPage />);
    expect(screen.getByTestId('admin-tasks')).toBeInTheDocument();
  });
});
