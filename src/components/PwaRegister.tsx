'use client';

import { useEffect } from 'react';
import { basePath } from '@/lib/basePath';

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    const swPath = basePath ? `${basePath}/sw.js` : '/sw.js';
    navigator.serviceWorker.register(swPath).catch(() => {});
  }, []);
  return null;
}
