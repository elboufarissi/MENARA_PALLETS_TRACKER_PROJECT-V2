import { useEffect, useRef, useState } from "react";
import "./loader.css";

/**
 * Usage:
 *  - <PageLoader active minVisibleMs={1500} />
 *  - <PageLoader minVisibleMs={1500} />
 */
export default function PageLoader({
  text = "Loading...",
  minVisibleMs = 3700,   // ⬅️ keep the loader visible at least this long
  active,                // optional boolean; if provided the component is controlled
}) {
  const [fade, setFade] = useState(false);
  const [gone, setGone] = useState(false);

  const startRef = useRef(null);
  const hideTimerRef = useRef(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const ensureMinVisibleThenFade = () => {
    const elapsed = Date.now() - (startRef.current || Date.now());
    const remaining = Math.max(minVisibleMs - elapsed, 0);
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => setFade(true), remaining);
  };

  // Autonomous mode: start timing immediately; fade after window load + minVisibleMs
  useEffect(() => {
    if (typeof active === "boolean") return; // controlled mode
    startRef.current = Date.now();

    const onLoaded = () => ensureMinVisibleThenFade();

    if (document.readyState === "complete") {
      onLoaded();
    } else {
      window.addEventListener("load", onLoaded, { once: true });
    }

    return () => {
      window.removeEventListener("load", onLoaded);
      clearHideTimer();
    };
  }, [minVisibleMs, active]);

  // Controlled mode: when active -> show & start timer; when inactive -> wait minVisibleMs then fade
  useEffect(() => {
    if (typeof active !== "boolean") return;

    // Turning ON: show immediately and start the visible timer
    if (active) {
      setGone(false);
      setFade(false);
      startRef.current = Date.now();
      clearHideTimer();
      return;
    }

    // Turning OFF: enforce min visible time before fade
    ensureMinVisibleThenFade();

    return clearHideTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, minVisibleMs]);

  if (gone) return null;

  return (
    <div
      id="page-loader"
      className={`loader-overlay${fade ? " is-done" : ""}`}
      onTransitionEnd={() => fade && setGone(true)}
      role="alert"
      aria-busy={!fade}
      aria-live="polite"
    >
      <div className="loader" aria-hidden="true" />
      <span className="loader-text">{text}</span>
    </div>
  );
}
