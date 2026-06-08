import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/auth/AuthProvider";

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_MS = 29 * 60 * 1000; // 1 minute before logout

export function useInactivityLogout() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const logoutTimer = useRef<number | null>(null);
  const warnTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!session) return;

    function reset() {
      if (logoutTimer.current) window.clearTimeout(logoutTimer.current);
      if (warnTimer.current) window.clearTimeout(warnTimer.current);
      warnTimer.current = window.setTimeout(() => {
        toast.warning("Your session will expire in 1 minute due to inactivity.", {
          duration: 60_000,
        });
      }, WARNING_MS);
      logoutTimer.current = window.setTimeout(async () => {
        await signOut();
        toast.info("Signed out due to inactivity");
        navigate("/login", { replace: true });
      }, INACTIVITY_MS);
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (logoutTimer.current) window.clearTimeout(logoutTimer.current);
      if (warnTimer.current) window.clearTimeout(warnTimer.current);
    };
  }, [session, signOut, navigate]);
}
