'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold hover:opacity-90 transition">
          📐 ExamMath
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/tasks" className="hover:underline">
            Задания
          </Link>
          <Link href="/variants" className="hover:underline">
            Варианты
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  className="bg-white text-gray-800 hover:bg-gray-100 font-semibold"
                >
                  {user.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/profile">Личный кабинет</Link>
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Админ-панель</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={logout}>Выйти</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                asChild
                className="bg-white text-gray-800 hover:bg-gray-100 font-semibold"
              >
                <Link href="/login">Войти</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-transparent text-white border-2 border-white hover:bg-white hover:text-gray-800 font-semibold transition"
              >
                <Link href="/register">Регистрация</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
