/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { Book, CategoryInfo } from '../types';
import { BookService, SearchFilterParams } from '../services/bookService';
import { BookCard } from '../components/common/BookCard';
import { EmptyState } from '../components/common/EmptyState';
import { BookGridSkeleton } from '../components/common/LoadingSpinner';
import { Search, SlidersHorizontal, X, ArrowUpDown, Filter, RotateCcw, ChevronDown } from 'lucide-react';

export const BooksPage: React.FC = () => {
  const { searchParams, navigate } = useRouter();

  // Search and filter states initialized from URL parameters
  const [query, setQuery] = useState<string>(searchParams.get('query') || searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || 'all');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'digital' | 'available'>(
    (searchParams.get('availability') as any) || 'all'
  );
  const [selectedAuthor, setSelectedAuthor] = useState<string>(searchParams.get('author') || 'all');
  const [sortBy, setSortBy] = useState<'title_asc' | 'title_desc' | 'author' | 'newest'>('title_asc');

  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync state if URL query params change (e.g. user clicked category link or navbar search)
  useEffect(() => {
    const urlQuery = searchParams.get('query') || searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || 'all';
    const urlAvailability = (searchParams.get('availability') as any) || 'all';
    const urlAuthor = searchParams.get('author') || 'all';

    setQuery(urlQuery);
    setSelectedCategory(urlCategory);
    setSelectedAvailability(urlAvailability);
    setSelectedAuthor(urlAuthor);
  }, [searchParams]);

  // Load static filter options (categories, authors)
  useEffect(() => {
    async function loadFilterOptions() {
      const [cats, auths] = await Promise.all([
        BookService.getCategories(),
        BookService.getAuthors()
      ]);
      setCategories(cats);
      setAuthors(auths);
    }
    loadFilterOptions();
  }, []);

  // Fetch books whenever filter criteria change
  useEffect(() => {
    async function fetchBooks() {
      setLoading(true);
      try {
        const filterParams: SearchFilterParams = {
          query,
          category: selectedCategory,
          availability: selectedAvailability,
          author: selectedAuthor,
          sortBy
        };
        const results = await BookService.getBooks(filterParams);
        setBooks(results);
      } catch (err) {
        console.error('Failed to fetch books', err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchBooks, 50);
    return () => clearTimeout(timer);
  }, [query, selectedCategory, selectedAvailability, selectedAuthor, sortBy]);

  const hasActiveFilters = useMemo(() => {
    return (
      query.trim() !== '' ||
      selectedCategory !== 'all' ||
      selectedAvailability !== 'all' ||
      selectedAuthor !== 'all'
    );
  }, [query, selectedCategory, selectedAvailability, selectedAuthor]);

  const handleClearFilters = () => {
    setQuery('');
    setSelectedCategory('all');
    setSelectedAvailability('all');
    setSelectedAuthor('all');
    setSortBy('title_asc');
    navigate('/books');
  };

  const handleCategoryPillClick = (catName: string) => {
    const nextCategory = selectedCategory.toLowerCase() === catName.toLowerCase() ? 'all' : catName;
    setSelectedCategory(nextCategory);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Books Catalogue
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Browse, filter, and read from our community digital collection.
        </p>
      </div>

      {/* Main Search and Control Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input Bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="catalogue-search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, category, or ISBN..."
              className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs text-sm transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-56">
              <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                id="catalogue-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort books by"
                className="w-full pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-medium focus:outline-hidden focus:border-blue-600 shadow-xs appearance-none cursor-pointer"
              >
                <option value="title_asc">Title (A – Z)</option>
                <option value="title_desc">Title (Z – A)</option>
                <option value="author">Author (A – Z)</option>
                <option value="newest">Newest First</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="md:hidden flex items-center gap-1.5 px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm font-semibold shadow-xs"
            >
              <Filter className="w-4 h-4 text-slate-500" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-600 ml-1" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryPillClick(cat.name)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                  isSelected
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Toolbar (Desktop and collapsible Mobile) */}
      <div
        className={`${
          mobileFiltersOpen ? 'block' : 'hidden'
        } md:block bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Category Filter */}
          <div>
            <label
              htmlFor="filter-category-select"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
            >
              Category
            </label>
            <select
              id="filter-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-hidden focus:border-blue-600"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label
              htmlFor="filter-availability-select"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
            >
              Availability
            </label>
            <select
              id="filter-availability-select"
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-hidden focus:border-blue-600"
            >
              <option value="all">All Collection</option>
              <option value="digital">Available to Read (Digital Copy)</option>
              <option value="available">Available to Borrow</option>
            </select>
          </div>

          {/* Author Filter */}
          <div>
            <label
              htmlFor="filter-author-select"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5"
            >
              Author
            </label>
            <select
              id="filter-author-select"
              value={selectedAuthor}
              onChange={(e) => setSelectedAuthor(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-hidden focus:border-blue-600"
            >
              <option value="all">All Authors ({authors.length})</option>
              {authors.map((authorName) => (
                <option key={authorName} value={authorName}>
                  {authorName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary and Clear Action */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 font-medium">
            Showing <span className="font-bold text-slate-900">{books.length}</span> {books.length === 1 ? 'book' : 'books'}
            {hasActiveFilters && ' matching active filters'}
          </div>

          {hasActiveFilters && (
            <button
              id="clear-filters-btn"
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Book Grid / Empty State / Loading */}
      {loading ? (
        <BookGridSkeleton count={8} />
      ) : books.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No books match your criteria"
          description="Try broadening your search term, selecting 'All Categories', or clearing availability constraints."
          onReset={handleClearFilters}
          actionText="Reset Filters"
        />
      )}
    </div>
  );
};
