import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';

const mockLogin = vi.fn();
const mockPush = vi.fn();

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
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

vi.mock('@/components/turnstile', () => ({
  TurnstileWidget: ({ onSuccess }: { onSuccess: (t: string) => void }) => (
    <button data-testid="turnstile" onClick={() => onSuccess('test-token')}>
      captcha
    </button>
  ),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByText('Вход')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByText('Войти')).toBeInTheDocument();
  });

  it('has link to register page', () => {
    render(<LoginPage />);
    const link = screen.getByText('Регистрация');
    expect(link.closest('a')).toHaveAttribute('href', '/register');
  });

  it('calls login and redirects on success', async () => {
    mockLogin.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('username'), 'myuser');
    await user.type(screen.getByPlaceholderText('••••••••'), 'mypass');
    await user.click(screen.getByText('Войти'));

    expect(mockLogin).toHaveBeenCalledWith('myuser', 'mypass', '');
    expect(mockPush).toHaveBeenCalledWith('/tasks');
  });

  it('shows error on login failure', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { detail: 'Неверный пароль' } },
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('username'), 'myuser');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong');
    await user.click(screen.getByText('Войти'));

    expect(await screen.findByText('Неверный пароль')).toBeInTheDocument();
  });

  it('shows generic error when no detail', async () => {
    mockLogin.mockRejectedValue(new Error('network'));
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByPlaceholderText('username'), 'u');
    await user.type(screen.getByPlaceholderText('••••••••'), 'p');
    await user.click(screen.getByText('Войти'));

    expect(await screen.findByText('Ошибка входа')).toBeInTheDocument();
  });
});
