/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
  actionText?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No books found',
  description = 'We couldn\'t find any books matching your current search or filter criteria.',
  onReset,
  actionText = 'Reset Filters'
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
      <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-500 mb-4">
        <SearchX className="w-7 h-7" />
      </div>
      <h3 className="font-serif font-bold text-lg text-slate-800">{title}</h3>
      <p className="text-slate-500 text-sm mt-2 leading-relaxed">{description}</p>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-lg transition-colors shadow-xs"
        >
          <RotateCcw className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};
