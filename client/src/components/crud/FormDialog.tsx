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
  type?: 'text' | 'number' | 'textarea' | 'select' | 'checkbox';
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
  const form = useForm<FieldValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as DefaultValues<FieldValues>,
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (open) reset(defaultValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => onSubmit(v))} className="space-y-3">
          {fields.map((f) => {
            const err = errors[f.name]?.message as string | undefined;
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

                {(f.type === 'text' || f.type === 'number' || f.type === undefined) && (
                  <Input
                    id={f.name}
                    type={f.type === 'number' ? 'number' : 'text'}
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
