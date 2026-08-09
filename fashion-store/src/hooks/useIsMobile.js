import { useState, useEffect } from "react";

/**
 * Detects whether the app is currently running in a "mobile" viewport
 * (phone/small tablet width) vs "desktop" width, and keeps that value
 * live-updated on resize / orientation change.
 *
 * Why JS detection instead of pure CSS media queries:
 * CSS-only responsive design (two stylesheets both targeting the same
 * class, one overriding the other by media query) is fragile — if the
 * two sources get injected into <head> in a different order than
 * expected, cascade rules can silently flip and break layout only on
 * mobile. Deciding "mobile or desktop" once in JS and rendering a
 * genuinely different component tree removes that whole class of bugs:
 * there's no override to lose, mobile markup simply isn't rendered on
 * desktop and vice versa.
 *
 * breakpoint: viewport width (px) below which isMobile becomes true.
 * Kept in sync with the site's existing @media (max-width: 900px) rules.
 */
export default function useIsMobile(breakpoint = 900) {
  const getMatch = () =>
    typeof window !== "undefined" &&
    window.matchMedia(`(max-width: ${breakpoint}px)`).matches;

  const [isMobile, setIsMobile] = useState(getMatch);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const onChange = (e) => setIsMobile(e.matches);

    // Safari <14 fallback: addListener/removeListener instead of addEventListener
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);

    setIsMobile(mql.matches);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [breakpoint]);

  return isMobile;
}
