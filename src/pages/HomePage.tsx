/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from '../context/RouterContext';
import { Book, CategoryInfo, LibraryStats } from '../types';
import { BookService } from '../services/bookService';
import { BookCard } from '../components/common/BookCard';
import { BookGridSkeleton } from '../components/common/LoadingSpinner';
import {
  BookOpen,
  Layers,
  CheckCircle2,
  Users,
  Search,
  ArrowRight,
  Sparkles,
  Atom,
  Laptop,
  Landmark,
  Binary,
  Scroll,
  Globe,
  Compass,
  IdCard,
  RefreshCw,
  AlertCircle,
  GraduationCap
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigate } = useRouter();
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [heroSearch, setHeroSearch] = useState('');

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const [booksData, catsData, statsData] = await Promise.all([
        BookService.getFeaturedBooks(),
        BookService.getCategories(),
        BookService.getLibraryStats()
      ]);
      setFeaturedBooks(booksData);
      setCategories(catsData);
      setStats(statsData);
    } catch (err: any) {
      console.warn('Could not load home data on first attempt:', err);
      setLoadError(err?.message || 'Failed to load library catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/books?query=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/books');
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Atom':
        return <Atom className="w-5 h-5 text-blue-600" />;
      case 'Laptop':
        return <Laptop className="w-5 h-5 text-emerald-600" />;
      case 'Landmark':
        return <Landmark className="w-5 h-5 text-amber-700" />;
      case 'Binary':
        return <Binary className="w-5 h-5 text-indigo-600" />;
      case 'Scroll':
        return <Scroll className="w-5 h-5 text-rose-600" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'Globe':
        return <Globe className="w-5 h-5 text-teal-600" />;
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-indigo-600" />;
      case 'BookOpen':
      default:
        return <BookOpen className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-b from-slate-950 via-slate-900 to-slate-900 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8 rounded-b-3xl shadow-md border-b border-slate-800">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-64 bg-blue-600/10 blur-3xl pointer-events-none rounded-full" />
        <div className="absolute -right-20 top-20 w-80 h-80 bg-blue-500/10 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-blue-300 text-xs sm:text-sm font-medium">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Community Digital Library &bull; Free Public Reading Hub</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Discover. Read. Learn.
          </h1>

          <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Explore our digital collection of books and read them anytime from anywhere.
          </p>

          {/* Quick Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-xl mx-auto pt-2 flex items-center bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/30 transition-all"
          >
            <div className="pl-3 text-slate-300">
              <Search className="w-5 h-5" />
            </div>
            <input
              id="home-hero-search-input"
              type="text"
              value={heroSearch}
              onChange={(e) => setHeroSearch(e.target.value)}
              placeholder="Search by title, author, or subject..."
              aria-label="Search by title, author, or subject"
              className="w-full px-3 py-2 text-sm text-white placeholder-slate-400 bg-transparent focus:outline-hidden"
            />
            <button
              id="home-hero-search-submit-btn"
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-xs flex-shrink-0"
            >
              Search
            </button>
          </form>

          {/* Popular Subject Quick Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400 pt-1">
            <span className="font-medium text-slate-400">Popular:</span>
            {['Computer & Information Technology', 'Science & Mathematics', 'Education', 'Arts & Humanities'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => navigate(`/books?category=${encodeURIComponent(tag)}`)}
                className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 text-xs transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              id="hero-browse-books-btn"
              type="button"
              onClick={() => navigate('/books')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm sm:text-base shadow-xs transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Browse Books</span>
            </button>

            <button
              id="hero-explore-categories-btn"
              type="button"
              onClick={() => navigate('/categories')}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold text-sm sm:text-base transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Categories</span>
            </button>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Stat 1: Total Books */}
            <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:px-4 first:pt-0 first:px-0">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                  {stats ? stats.totalBooks : '—'}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Total Books
                </p>
              </div>
            </div>

            {/* Stat 2: Categories */}
            <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:px-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                  {stats ? stats.totalCategories : '—'}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Categories
                </p>
              </div>
            </div>

            {/* Stat 3: Available to Read */}
            <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:px-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                  {stats ? stats.availableToRead : '—'}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Available to Read
                </p>
              </div>
            </div>

            {/* Stat 4: Active Members */}
            <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:px-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold font-serif text-slate-900">
                  {stats ? stats.activeMembers.toLocaleString() : '—'}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Community Readers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Sparkles className="w-4 h-4" />
              <span>Curated Selection</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Featured Books
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Hand-picked recommendations spanning literature, science, computing, and philosophy.
            </p>
          </div>
          <button
            id="view-all-featured-btn"
            type="button"
            onClick={() => navigate('/books')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
          >
            <span>View all books</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <BookGridSkeleton count={6} />
        ) : loadError && featuredBooks.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-6 text-center">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-slate-800 font-medium">{loadError}</p>
            <p className="text-slate-500 text-sm mt-1">Connecting to the library database...</p>
            <button
              onClick={() => loadHomeData()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Loading</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </section>

      {/* Categories Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Layers className="w-4 h-4" />
              <span>Subject Areas</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Explore by Category
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Discover titles organized across {stats ? `${stats.totalCategories} curated categories` : 'curated learning pathways'}.
            </p>
          </div>
          <button
            id="view-all-categories-btn"
            type="button"
            onClick={() => navigate('/categories')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
          >
            <span>All categories</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              id={`cat-card-${cat.id}`}
              onClick={() => navigate(`/books?category=${encodeURIComponent(cat.name)}`)}
              className="group bg-white rounded-xl border border-slate-200/80 hover:border-blue-300 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform mb-3">
                  {getCategoryIcon(cat.iconName)}
                </div>
                <h3 className="font-serif font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600">
                <span>{cat.bookCount} {cat.bookCount === 1 ? 'Book' : 'Books'}</span>
                <span className="text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                  Browse &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Digital Reading Support Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Digital Learning & Support
            </span>
            <h3 className="font-serif text-2xl font-bold text-slate-900">
              Digital Reading & Literacy Support
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Explore our digital collection, reading tools, and community learning resources anytime.
            </p>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap gap-3 flex-shrink-0">
            <button
              id="home-register-card-btn"
              type="button"
              onClick={() => navigate('/register')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors shadow-xs"
            >
              <IdCard className="w-4 h-4" />
              <span>Get Member Card</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/books')}
              className="px-5 py-2.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-sm font-semibold transition-colors shadow-xs"
            >
              Start Reading
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
