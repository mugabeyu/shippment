import { useEffect, useRef, useCallback } from 'react';

const SESSION_TIMEOUT_KEY = 'session_last_active';
const SESSION_TIMEOUT_MINUTES = 30;
const SESSION_WARNING_MINUTES = 5;

function getRemainingTime(): number {
  const last = parseInt(localStorage.getItem(SESSION_TIMEOUT_KEY) || '0', 10);
  const now = Date.now();
  const diff = (SESSION_TIMEOUT_MINUTES * 60 * 1000) - (now - last);
  return Math.max(0, diff);
}

function touchSession() {
  localStorage.setItem(SESSION_TIMEOUT_KEY, String(Date.now()));
}

export function useSessionTimeout(onTimeout?: () => void) {
  const warnedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const warningRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    warnedRef.current = false;
    touchSession();
  }, []);

  useEffect(() => {
    touchSession();

    const scheduleNext = () => {
      const remaining = getRemainingTime();
      if (remaining <= 0) {
        onTimeout?.();
        return;
      }

      const warningAt = SESSION_WARNING_MINUTES * 60 * 1000;
      if (!warnedRef.current && remaining <= warningAt) {
        warnedRef.current = true;
        // Dispatch a custom event so UI can show warning
        window.dispatchEvent(new CustomEvent('session-warning', { detail: { remainingMinutes: Math.ceil(remaining / 60000) } }));
      }

      timeoutRef.current = window.setTimeout(() => {
        onTimeout?.();
      }, remaining);

      if (!warnedRef.current && remaining <= warningAt) {
        warningRef.current = window.setTimeout(() => {
          warnedRef.current = true;
          window.dispatchEvent(new CustomEvent('session-warning', { detail: { remainingMinutes: Math.ceil(remaining / 60000) } }));
        }, remaining - warningAt);
      }
    };

    scheduleNext();

    const events: Array<{ event: string; handler: () => void }> = [
      { event: 'mousemove', handler: () => { touchSession(); scheduleNext(); } },
      { event: 'keydown', handler: () => { touchSession(); scheduleNext(); } },
      { event: 'click', handler: () => { touchSession(); scheduleNext(); } },
      { event: 'scroll', handler: () => { touchSession(); scheduleNext(); } },
      { event: 'touchstart', handler: () => { touchSession(); scheduleNext(); } }
    ];

    events.forEach(({ event, handler }) => {
      window.addEventListener(event, handler, { passive: true });
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      events.forEach(({ event, handler }) => {
        window.removeEventListener(event, handler);
      });
    };
  }, [onTimeout, reset]);

  return { reset, remaining: getRemainingTime };
}
