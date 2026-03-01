import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-5xl font-bold mb-4">ExamMath</h1>
      <p className="text-xl text-gray-600 mb-8">
        Банк заданий ЕГЭ по математике — профильный уровень
      </p>
      <div className="flex gap-4">
        <Link
          href="/tasks"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          Перейти к заданиям
        </Link>
        <Link
          href="/register"
          className="px-6 py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition"
        >
          Регистрация
        </Link>
      </div>
    </div>
  );
}
