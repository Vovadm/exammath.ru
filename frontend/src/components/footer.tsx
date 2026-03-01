import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-400 py-6">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        <div className="w-10" />

        <div className="text-center">
          <p className="text-sm">Разработано учеником школы 1576</p>
          <p className="text-xs mt-1">
            при поддержке{' '}
            <Link
              href="https://examinf.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white underline transition"
            >
              examinf.ru
            </Link>
          </p>
        </div>

        <Link
          href="https://github.com/Vovadm/exammath.ru"
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-70 hover:opacity-100 transition"
          aria-label="GitHub"
        >
          <Image src="/github-mark-white.svg" alt="GitHub" width={24} height={24} />
        </Link>
      </div>
    </footer>
  );
}
