import { useEffect, useRef } from "react";

/**
 * Auto-logout after a period of inactivity.
 * - Listens to user activity (click, keydown, mousemove, scroll, touchstart)
 * - Resets a timer on any activity
 * - Optional cross-tab sync using localStorage "storage" events
 */
type UseAutoLogoutOptions = {
  /** Inactivity window in ms (default: 30 minutes) */
  timeoutMs?: number;
  /** When true (default), sync activity + logout across browser tabs */
  crossTab?: boolean;
  /** Callback right before redirect/cleanup – use for toasts, logging, etc. */
  onBeforeLogout?: () => void;
};

const LAST_ACTIVITY_KEY = "__autoLogout_lastActivity";
const LOGOUT_BROADCAST_KEY = "__autoLogout_doLogout";

export function useAutoLogout(options: UseAutoLogoutOptions = {}) {
  const {
    timeoutMs = 30 * 60 * 1000, // 30 minutes
    crossTab = true,
    onBeforeLogout,
  } = options;

  // Keep the timer ref stable
  const timerRef = useRef<number | null>(null);

  // --- Helpers ---
  const now = () => Date.now();

  const markActivity = () => {
    if (crossTab) {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(now()));
      } catch {
        // ignore storage errors (Safari private / quota)
      }
    }
    resetTimer();
  };

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const doLogout = () => {
    // allow the consumer to show a toast, etc.
    try {
      onBeforeLogout?.();
    } catch {
      // ignore UI callback errors
    }

    // Clear tokens/storage
    try {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      sessionStorage.clear();
    } catch {
      /* ignore */
    }

    // Broadcast to other tabs so they also clear
    if (crossTab) {
      try {
        localStorage.setItem(LOGOUT_BROADCAST_KEY, String(now()));
      } catch {
        /* ignore */
      }
    }

    // Hard redirect to landing/login
    window.location.replace("/");
  };

  const resetTimer = () => {
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      doLogout();
    }, timeoutMs) as unknown as number;
  };

  useEffect(() => {
    // Initialize last-activity for cross-tab
    if (crossTab) {
      try {
        if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
          localStorage.setItem(LAST_ACTIVITY_KEY, String(now()));
        }
      } catch {
        /* ignore */
      }
    }

    // Start timer
    resetTimer();

    // Activity listeners
    const events: Array<keyof WindowEventMap> = [
      "click",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "wheel",
    ];
    events.forEach((ev) =>
      window.addEventListener(ev, markActivity, { passive: true })
    );

    // Visibility change — if user returns, mark activity
    const onVis = () => {
      if (document.visibilityState === "visible") markActivity();
    };
    document.addEventListener("visibilitychange", onVis);

    // Cross-tab sync via storage events
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;

      // Any activity in another tab refreshes our timer
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        resetTimer();
      }

      // If another tab triggers logout, follow along
      if (e.key === LOGOUT_BROADCAST_KEY && e.newValue) {
        doLogout(); // will clean and redirect here as well
      }
    };
    if (crossTab) {
      window.addEventListener("storage", onStorage);
    }

    return () => {
      clearTimer();
      events.forEach((ev) => window.removeEventListener(ev, markActivity));
      document.removeEventListener("visibilitychange", onVis);
      if (crossTab) {
        window.removeEventListener("storage", onStorage);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeoutMs, crossTab]); // options changes restart the effect
}
