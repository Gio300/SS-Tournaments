'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ColorScheme = 'red' | 'blue' | 'green' | 'purple' | 'orange';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  colorScheme: ColorScheme;
  setColorScheme: (s: ColorScheme) => void;
} | null>(null);

const THEME_KEY = 'smashhub-theme';
const COLOR_SCHEME_KEY = 'smashhub-color-scheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('red');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null;
    const storedScheme = localStorage.getItem(COLOR_SCHEME_KEY) as ColorScheme | null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setThemeState(storedTheme);
      document.documentElement.setAttribute('data-theme', storedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    if (storedScheme && ['red', 'blue', 'green', 'purple', 'orange'].includes(storedScheme)) {
      setColorSchemeState(storedScheme);
      document.documentElement.setAttribute('data-accent-scheme', storedScheme);
    } else {
      document.documentElement.setAttribute('data-accent-scheme', 'red');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-accent-scheme', colorScheme);
    localStorage.setItem(COLOR_SCHEME_KEY, colorScheme);
  }, [colorScheme, mounted]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const setColorScheme = (s: ColorScheme) => setColorSchemeState(s);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, colorScheme, setColorScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
