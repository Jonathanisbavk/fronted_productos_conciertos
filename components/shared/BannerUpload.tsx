'use client';

import { useCallback, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

interface BannerUploadProps {
  value?: File | null;
  previewUrl?: string;
  onChange: (file: File | null) => void;
}

export function BannerUpload({ value, previewUrl, onChange }: BannerUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const preview = localPreview ?? previewUrl ?? null;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setLocalPreview(url);
    onChange(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    setLocalPreview(null);
    onChange(null);
  };

  return (
    <div className="relative">
      {preview ? (
        <div className="relative h-40 overflow-hidden rounded-sm border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Vista previa del boleto" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={clear}
            aria-label="Quitar imagen"
            className="absolute right-2 top-2 rounded-sm bg-background/80 p-1 text-paper outline-none transition-colors hover:bg-destructive hover:text-white focus-visible:ring-2 focus-visible:ring-destructive/60"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed transition-colors focus-within:border-gold/60 focus-within:ring-2 focus-within:ring-gold/30 ${
            dragOver
              ? 'border-primary bg-primary/10'
              : 'border-border bg-background/50 hover:border-gold/60'
          }`}
        >
          <ImagePlus size={30} className="text-muted-foreground" strokeWidth={1.5} />
          <span className="text-sm text-muted-foreground">
            Arrastra el arte o <span className="text-gold underline underline-offset-2">selecciona</span>
          </span>
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground/60">JPG · PNG · WEBP — máx 5 MB</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleInput}
          />
        </label>
      )}
    </div>
  );
}
