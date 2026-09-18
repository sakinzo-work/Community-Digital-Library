/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Book } from '../../types';
import { BookCover } from './BookCover';
import { useRouter } from '../../context/RouterContext';
import { BookOpen, CheckCircle, Clock, Star } from 'lucide-react';

interface BookCardProps {
  book: Book;
  compact?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ book, compact = false }) => {
  const { navigate } = useRouter();

  const handleCardClick = () => {
    navigate(`/book/${book.id}`);
  };

  const handleReadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (book.isBorrowed) {
      navigate(`/read/${book.id}`);
    } else {
      navigate(`/read/${book.id}?sample=true`);
    }
  };

  return (
    <div
      id={`book-card-${book.id}`}
      onClick={handleCardClick}
      className="group bg-white rounded-xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer overflow-hidden p-4 sm:p-5"
    >
      <div className="flex gap-4 sm:gap-5">
        {/* Book Cover */}
        <div className="flex-shrink-0">
          <BookCover
            src={book.cover}
            title={book.title}
            author={book.author}
            category={book.category}
            coverColor={book.coverColor}
            size="md"
            className="group-hover:scale-[1.02] transition-transform duration-200"
          />
        </div>

        {/* Book Info */}
        <div className="flex flex-col flex-1 min-w-0 justify-between">
          <div>
            {/* Category & Rating */}
            <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                {book.category}
              </span>
              {book.rating && (
                <div className="flex items-center text-xs text-amber-600 font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                  <span>{book.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="font-serif font-bold text-slate-900 text-base sm:text-lg leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
              {book.title}
            </h3>

            {/* Author */}
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1 truncate">
              by {book.author}
            </p>

            {/* Availability Indicator */}
            <div className="mt-2.5 flex items-center gap-1.5 text-xs">
              {book.hasDigitalVersion ? (
                book.available ? (
                  <span className="inline-flex items-center text-emerald-700 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Available to Read
                  </span>
                ) : (
                  <span className="inline-flex items-center text-amber-700 font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
                    Currently Borrowed
                  </span>
                )
              ) : (
                <span className="inline-flex items-center text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Digital copy unavailable
                </span>
              )}
            </div>

            {/* Short Description */}
            {!compact && (
              <p className="text-xs sm:text-sm text-slate-500 mt-2 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                {book.shortDescription || book.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              id={`view-details-btn-${book.id}`}
              type="button"
              onClick={handleCardClick}
              className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-center"
            >
              View Details
            </button>

            {book.hasDigitalVersion && (
              <button
                id={`read-now-btn-${book.id}`}
                type="button"
                onClick={handleReadClick}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-blue-700 hover:bg-blue-800 transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Read</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
