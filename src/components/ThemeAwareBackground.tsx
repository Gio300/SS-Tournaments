'use client';

import { useTheme } from '@/components/ThemeProvider';
import { basePath } from '@/lib/basePath';

export function ThemeAwareBackground() {
  const { theme } = useTheme();

  const darkGradient = basePath
    ? `linear-gradient(180deg, #0B0E14 0%, rgba(11,14,20,0.85) 40%, rgba(11,14,20,0.9) 100%), url('${basePath}/bg-pattern.png.svg')`
    : undefined;

  const lightGradient = 'linear-gradient(180deg, #ffffff 0%, rgba(245,245,245,0.98) 100%)';

  const backgroundImage = theme === 'light' ? lightGradient : darkGradient;

  return (
    <div
      className="fixed inset-0 -z-10 bg-app-background"
      style={backgroundImage ? { backgroundImage } : undefined}
      aria-hidden
    />
  );
}
