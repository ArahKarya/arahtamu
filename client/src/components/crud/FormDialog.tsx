import { useEffect } from 'react';
import { useForm, Controller, type DefaultValues, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

export interface CrudField {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'password' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'datetime';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: CrudField[];
  schema: ZodType;
  defaultValues: Record<string, unknown>;
  submitting?: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
}

/** Ambil error message berdasarkan nama field (mendukung dot-path nested). */
function nestedError(errors: Record<string, unknown>, name: string): string | undefined {
  const node = name.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, errors);
  const msg = (node as { message?: unknown } | undefined)?.message;
  return typeof msg === 'string' ? msg : undefined;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  fields,
  schema,
  defaultValues,
  submitting,
  onSubmit,
}: FormDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FieldValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<FieldValues>,
  });

  useEffect(() => {
    if (open) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => onSubmit(v))} className="space-y-3">
          {fields.map((f) => {
            const err = nestedError(errors as Record<string, unknown>, f.name);
            return (
              <div key={f.name} className="space-y-1.5">
                {f.type !== 'checkbox' && <Label htmlFor={f.name}>{f.label}</Label>}

                {f.type === 'textarea' && (
                  <Textarea id={f.name} placeholder={f.placeholder} {...register(f.name)} />
                )}

                {f.type === 'select' && (
                  <Controller
                    control={control}
                    name={f.name}
                    render={({ field }) => (
                      <select
                        id={f.name}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        value={(field.value as string) ?? ''}
                        onChange={(e) => field.onChange(e.target.value || undefined)}
                      >
                        <option value="">— Pilih —</option>
                        {f.options?.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                )}

                {f.type === 'multiselect' && (
                  <Controller
                    control={control}
                    name={f.name}
                    render={({ field }) => {
                      const selected = Array.isArray(field.value) ? (field.value as string[]) : [];
                      return (
                        <div className="space-y-1.5 rounded-md border p-3">
                          {f.options?.map((o) => (
                            <label key={o.value} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={selected.includes(o.value)}
                                onCheckedChange={(v) =>
                                  field.onChange(
                                    v === true
                                      ? [...selected, o.value]
                                      : selected.filter((x) => x !== o.value),
                                  )
                                }
                              />
                              {o.label}
                            </label>
                          ))}
                        </div>
                      );
                    }}
                  />
                )}

                {f.type === 'checkbox' && (
                  <Controller
                    control={control}
                    name={f.name}
                    render={({ field }) => (
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value === true}
                          onCheckedChange={(v) => field.onChange(v === true)}
                        />
                        {f.label}
                      </label>
                    )}
                  />
                )}

                {(f.type === 'text' ||
                  f.type === 'number' ||
                  f.type === 'password' ||
                  f.type === 'datetime' ||
                  f.type === undefined) && (
                  <Input
                    id={f.name}
                    type={
                      f.type === 'number'
                        ? 'number'
                        : f.type === 'password'
                          ? 'password'
                          : f.type === 'datetime'
                            ? 'datetime-local'
                            : 'text'
                    }
                    placeholder={f.placeholder}
                    {...register(
                      f.name,
                      f.type === 'number'
                        ? { setValueAs: (v) => (v === '' || v === null ? undefined : Number(v)) }
                        : {},
                    )}
                  />
                )}

                {err && <p className="text-xs text-destructive">{err}</p>}
              </div>
            );
          })}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
