// components/RouteLoader.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import PageLoader from "./PageLoader";

const normalize = (p) =>
  (p || "/").toLowerCase().replace(/\/+$/, "") || "/";

const isExcluded = (path, exclude = []) => {
  const p = normalize(path);
  return exclude.some((rule) => {
    if (typeof rule === "string") {
      const r = normalize(rule);
      return p === r || p.startsWith(r + "/"); // exclude subpaths too
    }
    if (rule instanceof RegExp) return rule.test(path);
    if (typeof rule === "function") return !!rule(p);
    return false;
  });
};

/**
 * Shows a page-level loader on route changes, unless the target path is excluded.
 * - delayMs avoids showing for super-quick transitions (no flicker).
 * - minVisibleMs keeps the loader up long enough to feel intentional.
 */
export default function RouteLoader({
  exclude = [],
  delayMs = 120,
  minVisibleMs = 3700,
  text = "Chargement...",
}) {
  const { pathname } = useLocation();
  const [active, setActive] = useState(false);

  const showTimer = useRef(null);
  const hideTimer = useRef(null);
  const hideAt = useRef(0);

  const clearTimers = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    showTimer.current = null;
    hideTimer.current = null;
  };

  useEffect(() => {
    // New route reached. If excluded, ensure loader is not shown and cancel any pending show.
    if (isExcluded(pathname, exclude)) {
      clearTimers();
      setActive(false);
      return;
    }

    // Not excluded: start a small delay to avoid flicker
    clearTimers();
    showTimer.current = setTimeout(() => {
      setActive(true);
      hideAt.current = Date.now() + minVisibleMs;
    }, delayMs);

    return clearTimers;
  }, [pathname, exclude, delayMs, minVisibleMs]);

  // Auto-hide after minVisibleMs (only if it actually showed)
  useEffect(() => {
    if (!active) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const remaining = Math.max(0, hideAt.current - Date.now());
    hideTimer.current = setTimeout(() => setActive(false), remaining);
    return () => hideTimer.current && clearTimeout(hideTimer.current);
  }, [active]);

  if (!active) return null;
  return <PageLoader active text={text} minVisibleMs={minVisibleMs} />;
}
