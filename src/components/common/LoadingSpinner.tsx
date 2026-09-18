/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading library collection...' }) => {
  return (
    <div className="min-h-[280px] flex flex-col items-center justify-center p-8 text-center">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-3 border-blue-100 border-t-blue-700 animate-spin" />
        <BookOpen className="w-5 h-5 text-blue-700 absolute inset-0 m-auto" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-600">{message}</p>
    </div>
  );
};

export const BookGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4 animate-pulse"
        >
          <div className="w-32 h-44 bg-slate-200 rounded-md flex-shrink-0" />
          <div className="flex-1 space-y-3 py-1">
            <div className="h-4 bg-slate-200 rounded w-1/3" />
            <div className="h-5 bg-slate-200 rounded w-4/5" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-3/4" />
            <div className="pt-4 flex gap-2">
              <div className="h-8 bg-slate-200 rounded w-1/2" />
              <div className="h-8 bg-slate-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
