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
      className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_-12px_32px_rgba(15,23,42,0.12)]"
      aria-label="Primary mobile navigation"
    >
      <div className="grid grid-cols-4 gap-1 px-2 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.to);

          return (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className={`min-h-14 rounded-lg flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
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
