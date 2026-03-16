'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ThemeProvider';

type Theme = 'light' | 'dark';
type ColorScheme = 'red' | 'blue' | 'green' | 'purple' | 'orange';

const VALID_THEMES: Theme[] = ['light', 'dark'];
const VALID_SCHEMES: ColorScheme[] = ['red', 'blue', 'green', 'purple', 'orange'];

export function ThemeSync() {
  const { profile } = useAuth();
  const { theme, setTheme, colorScheme, setColorScheme } = useTheme();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!profile) {
      hasSynced.current = false;
      return;
    }
    const prefs = profile.theme_prefs as { theme?: string; colorScheme?: string } | null | undefined;
    if (!prefs || hasSynced.current) return;
    if (VALID_THEMES.includes(prefs.theme as Theme)) {
      setTheme(prefs.theme as Theme);
    }
    if (VALID_SCHEMES.includes(prefs.colorScheme as ColorScheme)) {
      setColorScheme(prefs.colorScheme as ColorScheme);
    }
    hasSynced.current = true;
  }, [profile, profile?.theme_prefs, setTheme, setColorScheme]);

  return null;
}
