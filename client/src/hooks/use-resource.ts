import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/api-error';

/** Mutasi CRUD generik untuk sebuah resource REST + invalidasi list query. */
export function useResource(resource: string, queryKey: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: [queryKey] });

  const create = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post(`/${resource}`, data),
    onSuccess: () => {
      invalidate();
      toast.success('Data tersimpan');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gagal menyimpan')),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.patch(`/${resource}/${id}`, data),
    onSuccess: () => {
      invalidate();
      toast.success('Perubahan tersimpan');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gagal menyimpan')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/${resource}/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success('Data dihapus');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Gagal menghapus')),
  });

  return { create, update, remove };
}
