import { useEffect, useState } from 'react';
import { variantApi, type VariantCreate } from '@/entities/variant/api/variant-api';
import type { Variant } from '@/entities/variant/model/types';
import type { SchoolClass } from '@/entities/user/model/types';

interface UseVariantManagementReturn {
  variants: Variant[];
  classes: SchoolClass[];
  loading: boolean;
  createMsg: string;
  createLoading: boolean;
  create: (data: VariantCreate) => Promise<boolean>;
  reload: () => void;
}

export function useVariantManagement(): UseVariantManagementReturn {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [createMsg, setCreateMsg] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      variantApi.getTeacherVariants(),
      import('@/shared/api/http').then(({ default: http }) =>
        http.get<SchoolClass[]>('/teacher/classes').then((r) => r.data),
      ),
    ])
      .then(([v, c]) => {
        setVariants(v);
        setClasses(c);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (data: VariantCreate): Promise<boolean> => {
    setCreateLoading(true);
    setCreateMsg('');
    try {
      const created = await variantApi.createTeacherVariant(data);
      setVariants((prev) => [created, ...prev]);
      setCreateMsg('Вариант создан успешно');
      return true;
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setCreateMsg(err?.response?.data?.detail ?? 'Ошибка при создании');
      return false;
    } finally {
      setCreateLoading(false);
    }
  };

  return { variants, classes, loading, createMsg, createLoading, create, reload: load };
}
