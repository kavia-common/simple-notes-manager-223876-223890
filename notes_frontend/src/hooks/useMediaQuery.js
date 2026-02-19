import { useEffect, useState } from "react";

// PUBLIC_INTERFACE
export function useMediaQuery(query) {
  /** Tracks a CSS media query in React state. */
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mql = window.matchMedia(query);

    const handler = (e) => setMatches(e.matches);

    // Safari <14 fallback
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler);

    setMatches(mql.matches);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, [query]);

  return matches;
}
