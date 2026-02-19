import { useEffect, useState } from "react";

function safeParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch (_e) {
    return fallback;
  }
}

// PUBLIC_INTERFACE
export function useLocalStorageState(key, initialValue) {
  /**
   * React state that persists to localStorage.
   * @param {string} key localStorage key
   * @param {any} initialValue initial value if key missing
   */
  const [value, setValue] = useState(() => {
    const raw = localStorage.getItem(key);
    if (raw === null) return initialValue;
    return safeParse(raw, initialValue);
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
