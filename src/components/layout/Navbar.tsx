/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Library, Menu, X, Search, User, IdCard, LogOut, Bookmark, ShieldCheck, ChevronDown } from 'lucide-react';
import { NotificationBell } from './NotificationBell';

export const Navbar: React.FC = () => {
  const { path, navigate } = useRouter();
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Books', to: '/books' },
    { label: 'Categories', to: '/categories' },
    { label: 'About', to: '/about' }
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const handleNav = (to: string) => {
    navigate(to);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const isActive = (to: string) => {
    if (to === '/') {
      return path === '/' || path === '';
    }
    return path.startsWith(to);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and Brand */}
          <div
            id="brand-logo"
            onClick={() => handleNav('/')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-700 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-800 transition-colors">
              <Library className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-slate-900 text-base sm:text-lg tracking-tight leading-none group-hover:text-blue-700 transition-colors">
                  Community Digital Library
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                Knowledge for Everyone
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.to);
              return (
                <button
                  key={link.to}
                  id={`nav-link-${link.label.toLowerCase()}`}
                  type="button"
                  onClick={() => handleNav(link.to)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-50 text-blue-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}

            {/* Quick Catalogue Search Trigger */}
            <button
              id="navbar-browse-button"
              type="button"
              onClick={() => handleNav('/books')}
              className="ml-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-slate-700 hover:bg-slate-100 text-sm font-medium transition-colors"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Catalog</span>
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Member Profile / Auth Desktop Controls */}
            <div className="ml-2 pl-2 border-l border-slate-200 relative">
              {currentUser ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="navbar-user-profile-btn"
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-xs font-semibold text-slate-800"
                    aria-expanded={userDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-[11px]">
                      {currentUser.name.charAt(0)}
                    </div>
                    <span className="max-w-[110px] truncate">{currentUser.name.split(' ')[0]}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-mono">
                      Card
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] font-mono text-slate-500 truncate">{currentUser.libraryCardNumber}</p>
                        <span className="mt-1 inline-block text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          {currentUser.membershipType} Member
                        </span>
                      </div>

                      <div className="py-1">
                        {currentUser.role === 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleNav('/admin')}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-2 mb-1"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-700" />
                            <span>Librarian Admin Panel</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleNav('/profile')}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <IdCard className="w-4 h-4 text-blue-600" />
                          <span>My Library Card & Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleNav('/profile')}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Bookmark className="w-4 h-4 text-slate-400" />
                          <span>Saved Books ({currentUser.savedBookIds.length})</span>
                        </button>
                      </div>

                      <div className="pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                            handleNav('/');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    id="navbar-signin-btn"
                    type="button"
                    onClick={() => handleNav('/login')}
                    className="px-3 py-2 text-xs font-semibold text-slate-700 hover:text-blue-700 rounded-lg transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    id="navbar-register-btn"
                    type="button"
                    onClick={() => handleNav('/register')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-all shadow-xs"
                  >
                    <IdCard className="w-3.5 h-3.5" />
                    <span>Get Member Card</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-1.5">
            <NotificationBell />
            {currentUser && (
              <button
                type="button"
                onClick={() => handleNav('/profile')}
                className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs"
                title="View Profile"
              >
                {currentUser.name.charAt(0)}
              </button>
            )}
            <button
              id="mobile-search-button"
              type="button"
              onClick={() => handleNav('/books')}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="Search Catalogue"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              id="mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg focus:outline-hidden"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Collapsed Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const active = isActive(link.to);
            return (
              <button
                key={link.to}
                id={`mobile-nav-${link.label.toLowerCase()}`}
                type="button"
                onClick={() => handleNav(link.to)}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{link.label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </button>
            );
          })}

          {/* Mobile Auth Buttons */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            {currentUser ? (
              <>
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleNav('/admin')}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-sm font-semibold"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-700" />
                      <span>Librarian Admin Panel</span>
                    </div>
                    <span className="text-xs font-mono bg-amber-200/60 px-2 py-0.5 rounded">
                      Admin
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleNav('/profile')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-50 text-blue-800 text-sm font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <IdCard className="w-4 h-4 text-blue-600" />
                    <span>My Library Card & Profile</span>
                  </div>
                  <span className="text-xs font-mono bg-blue-200/60 px-2 py-0.5 rounded">
                    {currentUser.libraryCardNumber}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    handleNav('/');
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out ({currentUser.name})</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleNav('/login')}
                  className="w-full py-2.5 px-3 text-center border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => handleNav('/register')}
                  className="w-full py-2.5 px-3 text-center bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Register Card
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

