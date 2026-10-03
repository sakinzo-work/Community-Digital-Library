/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, Grid3X3, Home, LogIn, User } from 'lucide-react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const { path, navigate } = useRouter();
  const { currentUser } = useAuth();

  const navItems = [
    {
      label: 'Home',
      to: '/',
      icon: Home
    },
    {
      label: 'Books',
      to: '/books',
      icon: BookOpen
    },
    {
      label: 'Categories',
      to: '/categories',
      icon: Grid3X3
    },
    {
      label: currentUser ? 'Profile' : 'Login',
      to: currentUser ? '/profile' : '/login',
      icon: currentUser ? User : LogIn
    }
  ];

  const isActive = (to: string) => {
    if (to === '/') {
      return path === '/' || path === '';
    }

    if (to === '/books') {
      return path.startsWith('/books') || path.startsWith('/book/');
    }

    if (to === '/login') {
      return path.startsWith('/login') || path.startsWith('/register');
    }

    return path.startsWith(to);
  };

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-50 px-2"
      aria-label="Primary mobile navigation"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-[0_18px_42px_rgba(15,23,42,0.22)] backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className={`min-h-[58px] rounded-xl flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-all ${
                active
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-2' : 'stroke-[1.8]'}`} />
              <span className="leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
