import type { Metadata } from 'next';
import { Inter, Geist } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: {
    default: 'ExamMath — Банк заданий ЕГЭ по математике',
    template: '%s | ExamMath',
  },
  description:
    'Бесплатный банк заданий ЕГЭ по математике профильного уровня. Решайте задания из ФИПИ, проверяйте ответы, готовьтесь к экзамену.',
  keywords: [
    'ЕГЭ',
    'математика',
    'профильный уровень',
    'задания ЕГЭ',
    'ФИПИ',
    'подготовка к ЕГЭ',
  ],
  metadataBase: new URL('https://exammath.ru'),
  alternates: { canonical: '/' },
  icons: {
    icon: '/favicon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://exammath.ru',
    siteName: 'ExamMath',
    title: 'ExamMath — Банк заданий ЕГЭ по математике',
    description: 'Бесплатный банк заданий ЕГЭ по математике профильного уровня.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ExamMath' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ExamMath — Банк заданий ЕГЭ',
    description: 'Бесплатный банк заданий ЕГЭ по математике профильного уровня.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={cn('font-sans', geist.variable)}>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <AuthProvider>
          <Header />
          <main className="flex-1 bg-gray-50">{children}</main>
          <Footer />
        </AuthProvider>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
