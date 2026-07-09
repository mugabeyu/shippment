'use client';

import { useEffect } from 'react';

// Tracks the pointer over any primary/secondary button and exposes its
// position as CSS vars (--mx/--my) so globals.css can paint a radial
// "spotlight" that follows the cursor — see .btn-primary/.btn-secondary.
const GLOW_SELECTOR = '.btn-primary, .btn-secondary';

export default function CursorGlow() {
  useEffect(() => {
    function handleMove(e: PointerEvent) {
      const el = (e.target as HTMLElement)?.closest?.(GLOW_SELECTOR) as HTMLElement | null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--mx', `${x}%`);
      el.style.setProperty('--my', `${y}%`);
    }
    document.addEventListener('pointermove', handleMove, { passive: true });
    return () => document.removeEventListener('pointermove', handleMove);
  }, []);

  return null;
}
