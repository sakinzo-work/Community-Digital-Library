/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRouter } from '../../context/RouterContext';
import { Library, GraduationCap } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: About the Library */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Library className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif font-bold text-white text-base block">
                  Community Digital Library
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  Knowledge for Everyone
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Empowering our local community through free, open access to curated digital books,
              historical archives, educational literature, and science volumes.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-blue-400">
              <GraduationCap className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>B.Sc. IT Academic Capstone Project</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="hover:text-white transition-colors text-slate-400"
                >
                  Home Dashboard
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/books')}
                  className="hover:text-white transition-colors text-slate-400"
                >
                  Browse Books Catalogue
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/categories')}
                  className="hover:text-white transition-colors text-slate-400"
                >
                  Subject Categories
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="hover:text-white transition-colors text-slate-400"
                >
                  Member Card & Profile
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="hover:text-white transition-colors text-slate-400"
                >
                  Register for Library Card
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => navigate('/about')}
                  className="hover:text-white transition-colors text-slate-400"
                >
                  About the Project
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Project Information */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Project Information
            </h4>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <GraduationCap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>B.Sc. IT Final-Year Project</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Library className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <span>Community Digital Library</span>
              </li>
              <li className="text-xs text-slate-400 leading-relaxed pt-1">
                Digital library platform for community learning and reading.
              </li>
            </ul>
          </div>

          {/* Column 4: Digital Services & Accessibility */}
          <div>
            <h4 className="font-serif text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Digital Member Policy
            </h4>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              All digital books are accessible free of charge for community members. High-contrast reader
              mode and responsive font sizing ensure accessibility across devices.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <p className="font-medium text-white mb-1">Digital Learning Support</p>
              <p className="text-slate-400">Digital reader tools, book reservations, and catalogue search are available online 24/7.</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Community Digital Library. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400">Open Access Initiative</span>
            <span>&bull;</span>
            <span className="hover:text-slate-400">Digital Inclusion Program</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
