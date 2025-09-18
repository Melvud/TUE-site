// src/components/Modal.tsx
import React from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidthClass?: string; // напр. "max-w-3xl"
};

const Modal: React.FC<Props> = ({ open, onClose, title, children, maxWidthClass = 'max-w-3xl' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`absolute left-1/2 top-10 -translate-x-1/2 bg-slate-800 text-white rounded-2xl shadow-2xl w-[95%] ${maxWidthClass}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="text-slate-300 hover:text-white">✕</button>
        </div>
        <div className="p-5 max-h-[75vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
