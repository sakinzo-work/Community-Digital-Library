/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useRouter } from '../context/RouterContext';
import {
  Library,
  Target,
  CheckCircle,
  TrendingUp,
  Cpu,
  GraduationCap,
  Code2,
  BookOpen,
  Users,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
          <GraduationCap className="w-4 h-4" />
          <span>B.Sc. Information Technology &bull; Academic Capstone Project</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          About Community Digital Library
        </h1>
        <p className="text-base sm:text-lg text-slate-600 mt-2 max-w-3xl leading-relaxed">
          The Community Digital Library is designed to provide easy access to educational and
          recreational reading resources for members of a community centre.
        </p>
      </div>

      {/* Section 1: About the Project */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Library className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            1. About the Project
          </h2>
        </div>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          The <strong>Community Digital Library (CDL)</strong> is an open-access web application
          developed for community centres, adult learning hubs, and neighborhood civic spaces. By
          blending responsive web technologies with modern typography and an intuitive user experience,
          the portal provides seamless, instant browser-based digital reading and community book lending.
        </p>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Developed as a comprehensive <em>Bachelor of Science in Information Technology (B.Sc. IT)</em> final-year
          project, CDL showcases modular component architecture, robust client-side routing,
          multi-faceted searching algorithms, and an accessible distraction-free digital e-reader.
        </p>
      </section>

      {/* Section 2: Purpose */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            2. Purpose & Vision
          </h2>
        </div>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Community centres frequently encounter budgetary and physical space constraints that limit
          the variety and number of books they can store on shelves. The purpose of CDL is threefold:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h3 className="font-serif font-bold text-slate-800 text-sm mb-1.5">
              Democratize Access
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Guarantee 24/7 access to educational, historical, and literary works for students and families
              without subscription fees.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h3 className="font-serif font-bold text-slate-800 text-sm mb-1.5">
              Foster Digital Literacy
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Provide an intuitive, low-barrier reading experience accessible to seniors, youth, and non-technical
              community patrons.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <h3 className="font-serif font-bold text-slate-800 text-sm mb-1.5">
              Comprehensive Digital Catalog
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Catalog community titles, reading records, and digital lending within a single unified interface.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Features */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            3. Core Implemented Features
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Full Search & Multi-filter</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Simultaneous searching by title, author, category, ISBN, and availability status with zero-delay filtering.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Distraction-Free Digital Reader</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Light, Sepia, and Dark color themes, fluid font size adjustment, chapter indexing, and keyboard controls.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Dynamic Details & State</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Parameterized routing (`/book/:id` and `/read/:id`) retrieving discrete book metadata and related works.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-900">Responsive Mobile Architecture</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Collapsible touch-friendly mobile navigation, responsive covers, and accessible high-contrast UI tokens.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Benefits */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            4. Community Benefits
          </h2>
        </div>
        <ul className="space-y-3 text-sm text-slate-600">
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
            <span>
              <strong>Zero-Cost Academic Reference:</strong> High school and college students in the neighborhood
              can access computer science, science, and math textbooks without personal expense.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
            <span>
              <strong>Reading Accessibility:</strong> Dyslexia-friendly serif/sans font switching, sepia night-mode
              contrast, and adjustable scaling accommodate patrons with low visual acuity.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
            <span>
              <strong>Resource Sustainability:</strong> Eliminates wear-and-tear on community library resources while
              making literature effortlessly accessible and shareable.
            </span>
          </li>
        </ul>
      </section>

      {/* Section 5: Future Improvements */}
      <section className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            5. Future Improvements & System Roadmap
          </h2>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          The application codebase has been designed with strict decoupling between data providers and presentation
          components. The following extensions are mapped for the Phase 2 backend release:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-700">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>User & Admin Authentication (RBAC / JWT)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Librarian Dashboard (Add/Edit/Delete Books)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>PostgreSQL / Firestore Persistence Integration</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Direct PDF / EPUB Binary File Upload & Reader</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Member Borrowing & Due-Date Tracking</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Personal Bookmarks & Reading Progress Sync</span>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <div className="text-center pt-4">
        <button
          type="button"
          onClick={() => navigate('/books')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-all shadow-xs"
        >
          <BookOpen className="w-4 h-4" />
          <span>Start Exploring the Collection</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
