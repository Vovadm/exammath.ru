'use client';

import { useEffect, useState } from 'react';
import api, { Variant } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VariantsPage() {
  const { user } = useAuth();
  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    if (!user) return;
    api.get<Variant[]>('/variants').then((r) => setVariants(r.data));
  }, [user]);

  if (!user)
    return (
      <div className="text-center py-20">
        <Link href="/login" className="text-indigo-600 hover:underline">
          Войдите
        </Link>{' '}
        чтобы увидеть варианты
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Варианты</h1>
      {variants.length === 0 ? (
        <p className="text-gray-500">Вариантов пока нет</p>
      ) : (
        variants.map((v) => (
          <Card key={v.id} className="mb-4">
            <CardHeader>
              <h2 className="font-bold">{v.title}</h2>
              {v.description && (
                <p className="text-sm text-gray-500">{v.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Заданий: {v.tasks.length}</p>
              <Button size="sm" className="mt-2" asChild>
                <Link href={`/variants/${v.id}`}>Открыть</Link>
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
