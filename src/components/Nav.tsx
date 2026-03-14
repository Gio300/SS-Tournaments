'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const primaryLinks = [
  { href: '/', label: 'Home' },
  { href: '/boards/', label: 'Clans' },
  { href: '/live/', label: 'Live' },
  { href: '/ask/', label: 'Rules Bot' },
];

const moreLinks = [
  { href: '/rules/', label: 'Rules' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/community/', label: 'Community' },
  { href: '/tournaments/', label: 'Tournaments' },
  { href: '/reels/', label: 'Reels' },
  { href: '/matches/', label: 'Matches' },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLLIElement>(null);
  const { user, profile } = useAuth();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isMoreActive = moreLinks.some(
    (l) => pathname === l.href || (l.href !== '/' && pathname?.startsWith(l.href))
  );

  return (
    <header className="sticky top-0 z-50 bg-panel/95 backdrop-blur border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        <Link href="/" className="font-display font-bold text-lg text-text-primary hover:text-accent transition">
          SmashHub
        </Link>

        <button
          type="button"
          className="sm:hidden p-2 text-text-primary hover:text-accent"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        <ul
          className={`absolute top-full left-0 right-0 bg-panel border-b border-border sm:border-0 sm:static sm:flex sm:gap-1 ${
            open ? 'block' : 'hidden'
          }`}
        >
          {primaryLinks.map(({ href, label }) => {
            const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
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
          <li className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={`flex items-center gap-1 w-full sm:w-auto px-4 py-3 sm:py-2 sm:px-3 rounded text-sm font-medium transition ${
                isMoreActive ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
            >
              More
              <ChevronDown size={14} className={moreOpen ? 'rotate-180' : ''} />
            </button>
            {moreOpen && (
              <div className="absolute top-full left-0 mt-1 py-2 min-w-[160px] rounded-lg bg-panel border border-border shadow-lg z-50">
                {moreLinks.map(({ href, label }) => {
                  const active = pathname === href || (href !== '/' && pathname?.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => { setMoreOpen(false); setOpen(false); }}
                      className={`block px-4 py-2 text-sm font-medium transition ${
                        active ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            )}
          </li>
          <li>
            <Link
              href={user ? '/profile/' : '/login/'}
              onClick={() => setOpen(false)}
              className={`block sm:inline-block px-4 py-3 sm:py-2 sm:px-3 rounded text-sm font-medium transition ${
                pathname?.startsWith('/profile') || pathname?.startsWith('/login')
                  ? 'text-accent bg-accent/10'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {user ? (profile?.username ?? 'Profile') : 'Sign in'}
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
