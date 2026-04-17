"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void; hydrated: boolean }>({
  theme: "light",
  toggle: () => {},
  hydrated: false,
});

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Read the real theme from DOM (the pre-hydration inline script in
 * layout.tsx has already applied the `.dark` class if appropriate).
 * Called ONLY on the client — server snapshot is always "light".
 */
function readThemeFromDom(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

/** Subscribe to DOM class changes on <html> so theme toggles propagate. */
function subscribeToThemeClass(listener: () => void): () => void {
  if (typeof MutationObserver === "undefined") return () => undefined;
  const observer = new MutationObserver(listener);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

/**
 * Sync the DOM class BEFORE React's first commit so a dark-mode user's
 * toggle doesn't re-render the whole tree back to light. We use
 * `useSyncExternalStore` with a stable server snapshot to avoid the
 * React 19 `react-hooks/set-state-in-effect` lint and to match the
 * pre-hydration DOM without a hydration mismatch.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<Theme>(
    subscribeToThemeClass,
    readThemeFromDom,
    () => "light", // SSR snapshot — must match the initial server HTML
  );

  // After hydration, sync any migrated localStorage preference to DOM.
  // The pre-hydration script already handled the "dark → show dark"
  // case; this catches the "user toggled but we haven't persisted yet"
  // edge where `readThemeFromDom` and localStorage disagree.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kronos-theme");
      if (saved === "dark" && theme !== "dark") {
        document.documentElement.classList.add("dark");
      } else if (saved === "light" && theme !== "light") {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Private mode / storage disabled — silent
    }
  }, [theme]);

  // Listen for OS-level preference changes (only when no saved preference).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem("kronos-theme");
      } catch {
        // storage disabled
      }
      if (!saved) {
        if (e.matches) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = useCallback(() => {
    const next: Theme = readThemeFromDom() === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("kronos-theme", next);
    } catch {
      // Private mode — silent
    }
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  // `hydrated` is always true client-side once useSyncExternalStore has
  // had a chance to run — we expose it for the Sidebar's icon gate which
  // deliberately waits for hydration to avoid a flash.
  const hydrated = typeof document !== "undefined";

  return (
    <ThemeContext.Provider value={{ theme, toggle, hydrated }}>
      {children}
    </ThemeContext.Provider>
  );
}
