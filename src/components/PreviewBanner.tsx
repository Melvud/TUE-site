// src/components/PreviewBanner.tsx
import React from 'react';

export default function PreviewBanner() {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  if (p.get('preview') !== '1') return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[9999] bg-yellow-400 text-black text-center py-1 text-sm">
      Preview mode — draft content visible
    </div>
  );
}
