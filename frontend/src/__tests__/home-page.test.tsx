import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '@/app/page';

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

describe('HomePage', () => {
  it('renders the main heading', () => {
    render(<HomePage />);
    expect(screen.getByText('ExamMath')).toBeInTheDocument();
  });

  it('renders subtitle about ЕГЭ', () => {
    render(<HomePage />);
    expect(screen.getByText(/банк заданий егэ/i)).toBeInTheDocument();
  });

  it('has link to tasks page', () => {
    render(<HomePage />);
    const link = screen.getByText('Перейти к заданиям');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/tasks');
  });

  it('has link to register page', () => {
    render(<HomePage />);
    const link = screen.getByText('Регистрация');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/register');
  });
});
