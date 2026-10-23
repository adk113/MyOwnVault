import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);

const THEME_KEY = 'mov-theme';

export function UIProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');
  const [masked, setMasked] = useState(true); // privacy blur ON by default, never persisted
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme); // non-sensitive UI preference
  }, [theme]);

  const toast = useCallback((message, tone = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-3), { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
      masked,
      toggleMasked: () => setMasked((m) => !m),
      setMasked,
      toasts,
      toast,
    }),
    [theme, masked, toasts, toast],
  );
  return <UICtx.Provider value={value}>{children}</UICtx.Provider>;
}
