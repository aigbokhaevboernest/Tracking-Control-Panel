import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";

// TESTING value. Set back to 30 * 60 * 1000 before shipping.
const TIMEOUT_MS = 30 * 60 * 1000;
// Warning toast appears this long before logout.
const WARN_BEFORE_MS = 60 * 1000;
const DEBUG = true; // logs "[idle] ..." in the console; set false when done

// Where to land after logout.
const LOGIN_PATH = "/login";

const LAST_ACTIVITY_KEY = "app:last-activity";
const FORCE_LOGOUT_KEY = "app:force-logout";
const WARNING_TOAST_ID = "idle-warning";

const AUTH_STORAGE_PATTERNS = [/supabase\.auth/i, /^sb-.*-auth-token$/i, /^sb-.*-code-verifier$/i];
const isAuthStorageKey = (key: string) => AUTH_STORAGE_PATTERNS.some((p) => p.test(key));

const log = (...args: unknown[]) => {
  if (DEBUG) console.log("[idle]", ...args);
};

const clearIdleKeys = () => {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    localStorage.removeItem(FORCE_LOGOUT_KEY);
  } catch {
    /* ignore */
  }
};

const clearAuthStorage = () => {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key) keys.push(key);
      }
      keys.forEach((key) => {
        if (isAuthStorageKey(key)) storage.removeItem(key);
      });
    } catch {
      /* ignore */
    }
  });
  clearIdleKeys();
};

const clearAuthCookies = () => {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();
    if (!name || !isAuthStorageKey(name)) return;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
};

let loggingOut = false;

// In-memory clock = source of truth. localStorage only shares activity
// between tabs, so blocked storage can't make a session immortal.
let lastActivity = Date.now();

export function useInactivityLogout() {
  const { session, signOut } = useAuth();

  // Keep the latest signOut without re-running the effect when it changes identity.
  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;

  const enabled = !!session;
  // When this session was created. Used to tell a leftover idle timestamp from a
  // previous session apart from the current one.
  const signedInAt = session?.user?.last_sign_in_at ? Date.parse(session.user.last_sign_in_at) : 0;

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let warned = false;

    const forceLogout = async (reason: string) => {
      if (loggingOut) return;
      loggingOut = true;
      log("logging out:", reason);
      toast.dismiss(WARNING_TOAST_ID);

      try {
        localStorage.setItem(FORCE_LOGOUT_KEY, String(Date.now())); // tells other tabs
      } catch {
        /* ignore */
      }

      try {
        await Promise.race([
          Promise.resolve(signOutRef.current()),
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch {
        /* ignore */
      }

      clearAuthStorage();
      clearAuthCookies();
      window.location.replace(LOGIN_PATH);
    };

    const readStored = (): number | null => {
      try {
        const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (!raw) return null;
        const n = Number(raw);
        return Number.isFinite(n) ? n : null;
      } catch {
        return null;
      }
    };

    const writeStored = (t: number) => {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(t));
      } catch {
        /* ignore */
      }
    };

    const arm = (ms: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(check, Math.max(ms, 0));
    };

    // Wall-clock recheck. Never grants free time.
    function check() {
      const stored = readStored();
      const last = Math.max(lastActivity, stored ?? 0); // another tab's activity counts
      lastActivity = last;

      const idleFor = Date.now() - last;
      const warnAt = TIMEOUT_MS - WARN_BEFORE_MS;
      log(`idle ${Math.round(idleFor / 1000)}s / ${Math.round(TIMEOUT_MS / 1000)}s`);

      if (idleFor >= TIMEOUT_MS) {
        void forceLogout("idle timeout");
        return;
      }

      if (idleFor >= warnAt) {
        if (!warned) {
          warned = true;
          toast.warning("Your session will expire in 1 minute due to inactivity.", {
            id: WARNING_TOAST_ID,
            duration: TIMEOUT_MS - idleFor,
          });
        }
        arm(TIMEOUT_MS - idleFor);
      } else {
        if (warned) {
          // Activity in another tab pushed the deadline back.
          warned = false;
          toast.dismiss(WARNING_TOAST_ID);
        }
        arm(warnAt - idleFor);
      }
    }

    const onActivity = () => {
      const now = Date.now();
      // An expired window can't be revived by a tap (e.g. right after wake).
      if (now - lastActivity >= TIMEOUT_MS) {
        void forceLogout("idle timeout (activity after expiry)");
        return;
      }
      lastActivity = now;
      writeStored(now);
      if (warned) {
        warned = false;
        toast.dismiss(WARNING_TOAST_ID);
      }
      arm(TIMEOUT_MS - WARN_BEFORE_MS);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === FORCE_LOGOUT_KEY && e.newValue) {
        clearAuthStorage();
        clearAuthCookies();
        window.location.replace(LOGIN_PATH);
      }
    };

    // Seed the clock.
    const now = Date.now();
    let stored = readStored();
    // A timestamp older than this session's sign-in belongs to a previous
    // session: ignore it so a fresh login never logs out instantly.
    if (stored != null && stored < signedInAt) stored = null;

    if (stored != null && now - stored >= TIMEOUT_MS) {
      // Returning to a persisted session that sat idle past the limit.
      void forceLogout("stale session on load");
      return;
    }
    lastActivity = stored != null ? stored : now;
    if (stored == null) writeStored(now);
    log("armed, timeout =", TIMEOUT_MS / 1000, "s");

    // Discrete user actions ONLY. scroll / touchmove / mousemove are excluded:
    // layout shifts, tickers and charts fire them with nobody there.
    const events: (keyof WindowEventMap)[] = ["mousedown", "keydown", "touchstart", "click"];
    events.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);

    check();
    const heartbeat = setInterval(check, 10000);

    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(heartbeat);
      toast.dismiss(WARNING_TOAST_ID);
      events.forEach((ev) => window.removeEventListener(ev, onActivity));
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [enabled, signedInAt]);
}
