'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useVariantManagement } from '@/features/variant-management/model/use-variant-management';
import { VariantList } from '@/features/variant-management/ui/variant-list';
import { VariantCreateForm } from '@/features/variant-management/ui/variant-create-form';

export default function AdminVariants() {
  const [tab, setTab] = useState<'variants' | 'create'>('variants');
  const { variants, classes, createMsg, createLoading, create } =
    useVariantManagement();

  return (
    <div className="space-y-4">
      <div className="flex gap-3 mb-4">
        <Button
          variant={tab === 'variants' ? 'default' : 'outline'}
          onClick={() => setTab('variants')}
        >
          Все варианты
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
