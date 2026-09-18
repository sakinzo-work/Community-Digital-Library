/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { CategoryInfo } from '../types';
import { BookService } from '../services/bookService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Layers,
  ArrowRight,
  BookOpen,
  Atom,
  Laptop,
  Landmark,
  Binary,
  Scroll,
  Sparkles,
  Globe,
  GraduationCap
} from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { navigate } = useRouter();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      try {
        const data = await BookService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Atom':
        return <Atom className="w-6 h-6 text-blue-600" />;
      case 'Laptop':
        return <Laptop className="w-6 h-6 text-emerald-600" />;
      case 'Landmark':
        return <Landmark className="w-6 h-6 text-amber-700" />;
      case 'Binary':
        return <Binary className="w-6 h-6 text-indigo-600" />;
      case 'Scroll':
        return <Scroll className="w-6 h-6 text-rose-600" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-amber-500" />;
      case 'Globe':
        return <Globe className="w-6 h-6 text-teal-600" />;
      case 'GraduationCap':
        return <GraduationCap className="w-6 h-6 text-indigo-600" />;
      case 'BookOpen':
      default:
        return <BookOpen className="w-6 h-6 text-blue-600" />;
    }
  };

  const handleBrowseCategory = (categoryName: string) => {
    navigate(`/books?category=${encodeURIComponent(categoryName)}`);
  };

  if (loading) {
    return <LoadingSpinner message="Organizing knowledge categories..." />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
          <Layers className="w-4 h-4" />
          <span>Knowledge Disciplines</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Explore by Category
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
          Browse our structured digital collections. Select any subject area to view all matching
          literature, academic texts, and reference manuals.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            id={`category-item-${category.id}`}
            className="bg-white rounded-2xl border border-slate-200/90 hover:border-blue-300 p-6 sm:p-8 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {getCategoryIcon(category.iconName)}
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  {category.bookCount} {category.bookCount === 1 ? 'Volume' : 'Volumes'}
                </span>
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                {category.name}
              </h2>

              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                {category.description}
              </p>

              {/* Notable Authors */}
              {category.featuredAuthors && category.featuredAuthors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Notable Authors in Collection:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {category.featuredAuthors.map((author) => (
                      <span
                        key={author}
                        className="text-xs px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/60"
                      >
                        {author}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                id={`browse-cat-btn-${category.id}`}
                type="button"
                onClick={() => handleBrowseCategory(category.name)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white font-semibold text-sm transition-all shadow-2xs group/btn"
              >
                <span>Browse {category.name} Books</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
