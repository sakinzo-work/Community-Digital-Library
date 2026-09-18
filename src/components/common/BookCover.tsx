/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Book as BookIcon } from 'lucide-react';

interface BookCoverProps {
  src: string;
  title: string;
  author: string;
  category: string;
  coverColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BookCover: React.FC<BookCoverProps> = ({
  src,
  title,
  author,
  category,
  coverColor = '#1e293b',
  size = 'md',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const sizeClasses = {
    sm: 'w-20 h-28 text-xs',
    md: 'w-36 h-52 text-sm',
    lg: 'w-48 h-68 text-base',
    xl: 'w-56 h-80 sm:w-64 sm:h-92 text-lg'
  };

  return (
    <div
      className={`relative rounded-md overflow-hidden shadow-md transition-shadow hover:shadow-xl select-none flex-shrink-0 bg-slate-100 ${sizeClasses[size]} ${className}`}
      style={{
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1), inset -2px 0 4px rgba(0,0,0,0.15)'
      }}
    >
      {/* Book Spine Simulation Effect */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-black/30 via-white/10 to-transparent z-10 pointer-events-none" />
      <div className="absolute left-2.5 top-0 bottom-0 w-px bg-black/10 z-10 pointer-events-none" />

      {!imageError && src ? (
        <>
          <img
            src={src}
            alt={`Cover of ${title}`}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
              <BookIcon className="w-6 h-6 text-slate-400" />
            </div>
          )}
        </>
      ) : (
        /* Rich Fallback Decorative Cover */
        <div
          className="w-full h-full p-4 flex flex-col justify-between text-white relative overflow-hidden"
          style={{ backgroundColor: coverColor }}
        >
          {/* Subtle background ornament */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-black/10 pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-block px-1.5 py-0.5 text-[10px] tracking-wider uppercase font-semibold bg-white/20 rounded backdrop-blur-xs">
              {category}
            </span>
          </div>

          <div className="relative z-10 my-auto py-2">
            <h4 className="font-serif font-bold leading-tight line-clamp-3 text-slate-50 drop-shadow-xs">
              {title}
            </h4>
          </div>

          <div className="relative z-10 border-t border-white/20 pt-1.5">
            <p className="text-[11px] font-sans text-slate-200 truncate font-medium">
              {author}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
