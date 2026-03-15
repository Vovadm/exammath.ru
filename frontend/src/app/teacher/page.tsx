'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { useVariantManagement } from '@/features/variant-management/model/use-variant-management';
import { VariantList } from '@/features/variant-management/ui/variant-list';
import { VariantCreateForm } from '@/features/variant-management/ui/variant-create-form';

export default function TeacherPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'variants' | 'create'>('variants');
  const { variants, classes, createMsg, createLoading, create } =
    useVariantManagement();

  if (!user) return null;

  if (user.role !== 'teacher' && user.role !== 'admin') {
    router.push('/');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Панель учителя</h1>
      <div className="flex gap-3 mb-6">
        <Button
          variant={tab === 'variants' ? 'default' : 'outline'}
          onClick={() => setTab('variants')}
        >
          Мои варианты
        </Button>
        <Button
          variant={tab === 'create' ? 'default' : 'outline'}
          onClick={() => setTab('create')}
        >
          Создать вариант
        </Button>
      </div>
      {tab === 'variants' && <VariantList variants={variants} classes={classes} />}
      {tab === 'create' && (
        <VariantCreateForm
          classes={classes}
          createMsg={createMsg}
          createLoading={createLoading}
          onSubmit={create}
          onSuccess={() => setTab('variants')}
        />
      )}
    </div>
  );
}
