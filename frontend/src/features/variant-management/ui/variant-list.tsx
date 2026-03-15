'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { Variant } from '@/entities/variant/model/types';
import type { SchoolClass } from '@/entities/user/model/types';
import { useState } from 'react';

interface VariantListProps {
  variants: Variant[];
  classes: SchoolClass[];
}

export function VariantList({ variants, classes }: VariantListProps) {
  const router = useRouter();
  const [expandedVariant, setExpandedVariant] = useState<number | null>(null);

  if (variants.length === 0) {
    return <p className="text-gray-500 text-center py-10">Вариантов пока нет</p>;
  }

  return (
    <div className="space-y-4">
      {variants.map((v) => {
        const variantClass = classes.find((c) => c.id === v.class_id);
        const students = variantClass?.members ?? [];
        const isExpanded = expandedVariant === v.id;

        return (
          <Card key={v.id}>
            <CardContent className="pt-4 flex items-start justify-between">
              <div>
                <p className="font-semibold">{v.title}</p>
                {v.description && (
                  <p className="text-sm text-gray-500">{v.description}</p>
                )}
                <div className="flex gap-2 mt-2">
                  {v.is_public && <Badge variant="secondary">Публичный</Badge>}
                  {v.class_id && (
                    <Badge variant="outline">
                      Класс: {variantClass?.name ?? v.class_id}
                    </Badge>
                  )}
                  <Badge variant="outline">{v.tasks.length} заданий</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (v.id) router.push(`/variants/${v.id}`);
                  }}
                >
                  Открыть
                </Button>
                {students.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExpandedVariant(isExpanded ? null : v.id)}
                  >
                    Ответы учеников
                  </Button>
                )}
              </div>
            </CardContent>
            {isExpanded && students.length > 0 && (
              <CardContent className="pt-0 pb-4">
                <p className="text-xs text-gray-500 mb-2">Выберите ученика:</p>
                <div className="flex flex-wrap gap-2">
                  {students.map((s) => (
                    <Button
                      key={s.user_id}
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const sId = Number(s.user_id);
                        if (v.id && !isNaN(sId)) {
                          router.push(`/variants/${v.id}/student/${sId}`);
                        } else {
                          alert(`Ошибка: id варианта=${v.id}, id ученика=${s.user_id}`);
                        }
                      }}
                    >
                      {s.username} (ID: {s.user_id ?? 'MISSING'})
                    </Button>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
