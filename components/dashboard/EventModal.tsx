'use client';

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BannerUpload } from '@/components/shared/BannerUpload';
import { createEvento, updateEvento } from '@/lib/api';
import { Evento } from '@/lib/types';
import { notify } from '@/lib/swal';

const schema = z.object({
  name:        z.string().min(3, 'Mínimo 3 caracteres'),
  description: z.string().optional(),
  fecha:       z.string().min(1, 'Fecha requerida'),
  lugar:       z.string().min(2, 'Lugar requerido'),
  ciudad:      z.string().optional(),
  genero:      z.string().optional(),
  precio_eth:  z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Precio debe ser > 0'),
  aforo:       z.coerce.number().int().positive('Aforo debe ser > 0') as z.ZodType<number>,
});

type FormValues = z.infer<typeof schema>;

interface EventModalProps {
  open:     boolean;
  evento?:  Evento | null;
  onClose:  () => void;
  onSaved:  (e: Evento) => void;
}

export function EventModal({ open, evento, onClose, onSaved }: EventModalProps) {
  const [banner, setBanner]   = useState<File | null>(null);
  const [saving, setSaving]   = useState(false);
  const isEdit = !!evento;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  });

  useEffect(() => {
    if (open) {
      setBanner(null);
      reset(evento ? {
        name:        evento.name,
        description: evento.description ?? '',
        fecha:       typeof evento.fecha === 'string'
                       ? evento.fecha.slice(0, 16)
                       : '',
        lugar:       evento.lugar,
        ciudad:      evento.ciudad ?? '',
        genero:      evento.genero ?? '',
        precio_eth:  String(evento.precio_eth),
        aforo:       evento.aforo,
      } : {
        name:'', description:'', fecha:'', lugar:'',
        ciudad:'', genero:'', precio_eth:'', aforo: 0,
      });
    }
  }, [open, evento, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (!isEdit && !banner) { notify('error', 'El banner es obligatorio'); return; }
    setSaving(true);
    try {
      const payload = { ...values, banner: banner ?? undefined };
      const saved   = isEdit
        ? await updateEvento(evento!.id, payload)
        : await createEvento({ ...payload, banner: banner! });
      onSaved(saved);
    } catch (e: unknown) {
      notify('error', e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'h-9 bg-background border-input text-paper placeholder:text-muted-foreground/60 focus:border-primary focus-visible:ring-primary/25';
  const labelClass = 'font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-card text-paper ring-1 ring-border">
        <DialogHeader>
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-gold">
            {isEdit ? 'Editar función' : 'Abrir taquilla'}
          </p>
          <DialogTitle className="font-display text-2xl font-semibold uppercase tracking-tight text-paper">
            {isEdit ? 'Editar evento' : 'Nueva función'}
          </DialogTitle>
        </DialogHeader>
        <div className="perf-rule -mt-1" aria-hidden />

        <form onSubmit={handleSubmit(onSubmit)} className="mt-1 space-y-4">

          {/* Banner */}
          <div>
            <Label className={`${labelClass} mb-2 block`}>
              Banner {!isEdit && <span className="text-primary">*</span>}
            </Label>
            <BannerUpload
              value={banner}
              previewUrl={evento?.banner ? evento.banner : undefined}
              onChange={setBanner}
            />
          </div>

          {/* Nombre */}
          <div>
            <Label className={labelClass}>Nombre <span className="text-primary">*</span></Label>
            <Input {...register('name')} className={fieldClass} placeholder="Ej: Rock de los 90s" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Descripción */}
          <div>
            <Label className={labelClass}>Descripción</Label>
            <Textarea {...register('description')} className={`${fieldClass} resize-none`} rows={2} placeholder="Breve descripción del evento..." />
          </div>

          {/* Fecha + Lugar */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelClass}>Fecha <span className="text-primary">*</span></Label>
              <Input type="datetime-local" {...register('fecha')} className={fieldClass} />
              {errors.fecha && <p className="text-destructive text-xs mt-1">{errors.fecha.message}</p>}
            </div>
            <div>
              <Label className={labelClass}>Lugar <span className="text-primary">*</span></Label>
              <Input {...register('lugar')} className={fieldClass} placeholder="Ej: Movistar Arena" />
              {errors.lugar && <p className="text-destructive text-xs mt-1">{errors.lugar.message}</p>}
            </div>
          </div>

          {/* Ciudad + Género */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelClass}>Ciudad</Label>
              <Input {...register('ciudad')} className={fieldClass} placeholder="Ej: Bogotá" />
            </div>
            <div>
              <Label className={labelClass}>Género</Label>
              <Input {...register('genero')} className={fieldClass} placeholder="Ej: Rock, Pop, Jazz" />
            </div>
          </div>

          {/* Precio + Aforo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelClass}>Precio ETH <span className="text-primary">*</span></Label>
              <Input {...register('precio_eth')} className={fieldClass} placeholder="0.05" />
              {errors.precio_eth && <p className="text-destructive text-xs mt-1">{errors.precio_eth.message}</p>}
            </div>
            <div>
              <Label className={labelClass}>Aforo <span className="text-primary">*</span></Label>
              <Input type="number" {...register('aforo')} className={fieldClass} placeholder="5000" />
              {errors.aforo && <p className="text-destructive text-xs mt-1">{errors.aforo.message}</p>}
            </div>
          </div>

          <div className="perf-rule mt-2" aria-hidden />
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" size="lg" onClick={onClose} className="text-muted-foreground hover:text-paper">
              Cancelar
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="gap-2 font-semibold"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Sellando…' : isEdit ? 'Actualizar' : 'Emitir función'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
