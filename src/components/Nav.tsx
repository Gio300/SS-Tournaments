'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { NavSearchBar } from '@/components/NavSearchBar';

const primaryLinks: { href: string; label: string; activePaths?: string[] }[] = [
  { href: '/', label: 'Home' },
  { href: '/play/', label: 'Play', activePaths: ['/play/', '/tournaments/', '/matches/'] },
  { href: '/view/', label: 'View', activePaths: ['/view/', '/rankings/', '/live/', '/reels/', '/following/', '/community/', '/search/'] },
  { href: '/boards/', label: 'Clan' },
  { href: '/profile/', label: 'Profile' },
  { href: '/settings/', label: 'Settings' },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  async function handleLogout() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 bg-panel/95 backdrop-blur border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        <Link href="/" className="font-display font-bold text-lg transition flex items-center gap-0.5 shrink-0">
          <span className="text-red-600 hover:text-red-700">Smash</span>
          <span className="text-green-600 hover:text-green-700">Hub</span>
        </Link>

        <div className="hidden sm:block flex-1 max-w-md">
          <NavSearchBar />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded text-text-muted hover:text-text-primary hover:bg-white/5 transition"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        <button
          type="button"
          className="sm:hidden p-2 text-text-primary hover:text-accent"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
        </div>

        <ul
          className={`absolute top-full left-0 right-0 bg-panel border-b border-border sm:border-0 sm:static sm:flex sm:gap-1 ${
            open ? 'block' : 'hidden'
          }`}
        >
          {primaryLinks.map((link) => {
            const href = link.href;
            const label = link.label;
            const activePaths = 'activePaths' in link ? link.activePaths : undefined;
            const active = activePaths
              ? activePaths.some((p) => pathname === p || (p !== '/' && pathname?.startsWith(p)))
              : (pathname === href || (href !== '/' && pathname?.startsWith(href)));
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block sm:inline-block px-4 py-3 sm:py-2 sm:px-3 rounded text-sm font-medium transition ${
                    active ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
          {user ? (
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 w-full sm:w-auto px-4 py-3 sm:py-2 sm:px-3 rounded text-sm font-medium text-text-muted hover:text-text-primary hover:bg-white/5 transition"
              >
                <LogOut size={16} />
                Log out
              </button>
            </li>
          ) : (
            <li>
              <Link
                href="/login/"
                onClick={() => setOpen(false)}
                className="block sm:inline-block px-4 py-3 sm:py-2 sm:px-3 rounded text-sm font-medium text-text-muted hover:text-text-primary hover:bg-white/5 transition"
              >
                Sign in
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
