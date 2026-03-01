import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from '@/components/header';

const mockUseAuth = vi.fn();

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo link', () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    render(<Header />);
    const logo = screen.getByText(/exammath/i);
    expect(logo).toBeInTheDocument();
    expect(logo.closest('a')).toHaveAttribute('href', '/');
  });

  it('renders navigation links', () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    render(<Header />);
    expect(screen.getByText('Задания')).toBeInTheDocument();
    expect(screen.getByText('Варианты')).toBeInTheDocument();
  });

  it('shows login and register buttons when not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    render(<Header />);
    expect(screen.getByText('Войти')).toBeInTheDocument();
    expect(screen.getByText('Регистрация')).toBeInTheDocument();
  });

  it('shows username when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', email: 'test@test.com', role: 'student' },
      logout: vi.fn(),
    });
    render(<Header />);
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('does not show login/register when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'testuser', email: 'test@test.com', role: 'student' },
      logout: vi.fn(),
    });
    render(<Header />);
    expect(screen.queryByText('Войти')).not.toBeInTheDocument();
    expect(screen.queryByText('Регистрация')).not.toBeInTheDocument();
  });
});
