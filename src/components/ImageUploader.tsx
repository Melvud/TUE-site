// src/components/ImageUploader.tsx
import React from 'react';
import { apiUploadFile } from '../api/client';

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  token?: string | null;
  label?: string;
};

const ImageUploader: React.FC<Props> = ({ value, onChange, token, label = 'Cover image' }) => {
  const [busy, setBusy] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const pick = () => inputRef.current?.click();

  const upload = async (file: File) => {
    setBusy(true);
    setProgress(0);
    try {
      // имитируем прогресс (fetch не даёт нативный прогресс без XHR)
      const progTimer = setInterval(() => setProgress((p) => Math.min(90, p + 10)), 150);
      const url = await apiUploadFile(file, token);
      clearInterval(progTimer);
      setProgress(100);
      onChange(url);
    } catch (e: any) {
      alert(e?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-slate-300">{label}</div>
      <div
        className={`rounded-lg border border-dashed ${
          busy ? 'border-cyan-500' : 'border-slate-600'
        } p-3 bg-slate-800/50`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        {value ? (
          <div className="flex items-center gap-3">
            <img src={value} className="w-28 h-20 object-cover rounded" alt="cover" />
            <div className="flex-1 text-sm text-slate-300 truncate">{value}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="bg-slate-700 px-3 py-2 rounded"
                onClick={() => onChange(null)}
              >
                Remove
              </button>
              <button
                type="button"
                className="bg-cyan-500 hover:bg-cyan-400 px-3 py-2 rounded"
                onClick={pick}
                disabled={busy}
              >
                Replace
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="text-slate-400">Drop image here or</div>
            <button
              type="button"
              className="bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded"
              onClick={pick}
              disabled={busy}
            >
              Choose file
            </button>
            <div className="text-xs text-slate-500">PNG/JPEG, до 10 MB</div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
        />
        {busy && (
          <div className="mt-3 h-2 bg-slate-700 rounded overflow-hidden">
            <div
              className="h-2 bg-cyan-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
