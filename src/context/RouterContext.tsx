/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface RouteMatch {
  route: string;
  params: Record<string, string>;
}

export interface RouterContextType {
  path: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  navigate: (to: string, replace?: boolean) => void;
  goBack: () => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

function extractParams(pattern: string, path: string): { matches: boolean; params: Record<string, string> } {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return { matches: false, params: {} };
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      const paramName = patternParts[i].slice(1);
      params[paramName] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return { matches: false, params: {} };
    }
  }

  return { matches: true, params };
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUrl, setCurrentUrl] = useState<string>(() => {
    // Standard path with search
    return window.location.pathname + window.location.search;
  });

  const pathname = currentUrl.split('?')[0] || '/';
  const queryString = currentUrl.includes('?') ? currentUrl.split('?')[1] : '';
  const searchParams = new URLSearchParams(queryString);

  // Extract params based on registered patterns
  let activeParams: Record<string, string> = {};
  const knownPatterns = ['/book/:id', '/read/:id'];
  for (const pattern of knownPatterns) {
    const { matches, params } = extractParams(pattern, pathname);
    if (matches) {
      activeParams = params;
      break;
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      setCurrentUrl(window.location.pathname + window.location.search);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string, replace = false) => {
    if (replace) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
    }
    setCurrentUrl(to);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/books');
    }
  }, [navigate]);

  return (
    <RouterContext.Provider
      value={{
        path: pathname,
        params: activeParams,
        searchParams,
        navigate,
        goBack
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}
