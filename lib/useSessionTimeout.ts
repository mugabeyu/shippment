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

// mousemove/scroll can fire hundreds of times per second; only re-touch the
// session (localStorage write + timer reset) this often instead of on every event.
const ACTIVITY_THROTTLE_MS = 15000;

export function useSessionTimeout(onTimeout?: () => void) {
  const warnedRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const warningRef = useRef<number | null>(null);
  const lastActivityRef = useRef(0);

  const reset = useCallback(() => {
    warnedRef.current = false;
    touchSession();
  }, []);

  useEffect(() => {
    touchSession();

    const scheduleNext = () => {
      // Each call replaces the pending logout/warning timers — without this, every
      // activity event (throttled to ~1/15s) stacked another uncleared setTimeout,
      // so the very first one (from page load) would still fire and log the user
      // out ~30 minutes later even with continuous activity.
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      if (warningRef.current) { clearTimeout(warningRef.current); warningRef.current = null; }

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

    const onActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
      lastActivityRef.current = now;
      reset();
      scheduleNext();
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, onActivity, { passive: true });
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, onActivity);
      });
    };
  }, [onTimeout, reset]);

  return { reset, remaining: getRemainingTime };
}
