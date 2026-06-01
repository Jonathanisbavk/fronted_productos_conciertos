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
        <div className="relative rounded-lg overflow-hidden border border-cyan-500/40 h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Banner preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 h-40 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
            dragOver
              ? 'border-cyan-400 bg-cyan-500/10'
              : 'border-slate-600 hover:border-cyan-500/60 bg-slate-800/40'
          }`}
        >
          <ImagePlus size={32} className="text-slate-500" />
          <span className="text-sm text-slate-400">
            Arrastra una imagen o <span className="text-cyan-400 underline">selecciona</span>
          </span>
          <span className="text-xs text-slate-600">JPG, PNG, WEBP · Máx 5 MB</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInput}
          />
        </label>
      )}
    </div>
  );
}
