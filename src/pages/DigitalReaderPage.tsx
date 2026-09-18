/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Book } from '../types';
import { BookService } from '../services/bookService';
import { apiRequest } from '../services/apiClient';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Coffee,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ListOrdered,
  AlertCircle,
  Loader2,
  BookOpen,
  IdCard,
  Clock
} from 'lucide-react';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

type ReaderTheme = 'light' | 'sepia' | 'dark';

export const DigitalReaderPage: React.FC = () => {
  const { params, searchParams, navigate } = useRouter();
  const bookId = params.id;
  const isSample = searchParams.get('sample') === 'true';

  const {
    currentUser,
    token,
    updateReadingProgress
  } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [scale, setScale] = useState<number>(1);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToc, setShowToc] = useState(false);

  const [progressRestored, setProgressRestored] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [borrowingInProgress, setBorrowingInProgress] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  /*
   * Load book information from the real backend.
   */
  useEffect(() => {
    let mounted = true;

    async function loadBook() {
      if (!bookId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setPdfError(null);

      try {
        const data = await BookService.getBookById(bookId);

        if (mounted) {
          setBook(data);
        }
      } catch (error) {
        console.error('Failed to load book:', error);

        if (mounted) {
          setBook(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadBook();

    return () => {
      mounted = false;
    };
  }, [bookId, retryCount]);

  /*
   * Handle one-click borrow & read for members
   */
  async function handleBorrowAndRead() {
    if (!book) return;
    setBorrowingInProgress(true);
    setPdfError(null);
    try {
      const res = await BookService.borrowBook(book.id);
      if (res.success) {
        setBook({ ...book, isBorrowed: true, available: false });
        // If the user borrowed from sample preview, seamlessly transition to full reader
        if (isSample) {
          navigate(`/read/${book.id}`);
        }
      } else {
        setPdfError(res.message || 'Unable to checkout book at this time.');
      }
    } catch (err: any) {
      setPdfError(err.message || 'Failed to borrow book');
    } finally {
      setBorrowingInProgress(false);
    }
  }

  /*
   * Get the real PDF path from the backend.
   * If in sample mode, point to the dedicated, secure 5-page sample endpoint.
   */
  const pdfUrl = isSample
    ? `/api/books/${encodeURIComponent(bookId || '')}/sample.pdf`
    : (book?.pdfPath || null);

  /*
   * IMPORTANT:
   *
   * The PDF endpoint is protected by the backend.
   *
   * Pass bookId and JWT token in both query string and headers
   * so PDF.js and subresource requests authenticate reliably.
   */
  const pdfFile = useMemo(() => {
    if (!token || !bookId) {
      return null;
    }

    // In sample mode, fetch from the dedicated 5-page sample endpoint
    if (isSample) {
      return {
        url: `/api/books/${encodeURIComponent(bookId)}/sample.pdf?token=${encodeURIComponent(token)}`,
        httpHeaders: {
          Authorization: `Bearer ${token}`
        }
      };
    }

    if (!pdfUrl) {
      return null;
    }

    const separator = pdfUrl.includes('?') ? '&' : '?';
    const queryParams = new URLSearchParams();
    if (bookId) queryParams.append('bookId', bookId);
    queryParams.append('token', token);

    const fullUrl = `${pdfUrl}${separator}${queryParams.toString()}`;

    return {
      url: fullUrl,
      httpHeaders: {
        Authorization: `Bearer ${token}`
      }
    };
  }, [isSample, pdfUrl, token, bookId]);

  /*
   * Keep safePageNumber unconditionally memoized before any early returns.
   */
  const safePageNumber = useMemo(() => {
    if (!Number.isFinite(currentPage) || currentPage < 1) {
      return 1;
    }
    if (numPages > 0) {
      return Math.min(Math.max(1, currentPage), numPages);
    }
    return 1;
  }, [currentPage, numPages]);

  /*
   * Restore the user's last reading position from SQLite.
   * Skipped in sample mode so the preview always starts on page 1.
   */
  useEffect(() => {
    if (isSample) {
      setProgressRestored(true);
      return;
    }

    let mounted = true;

    async function restoreProgress() {
      if (
        !currentUser ||
        !token ||
        !bookId ||
        progressRestored
      ) {
        return;
      }

      try {
        const data = await apiRequest<{ progress: any }>(
          `/api/progress/${encodeURIComponent(bookId)}`
        );

        if (
          mounted &&
          data.progress &&
          Number.isFinite(
            Number(data.progress.currentPage)
          )
        ) {
          const savedPage = Math.max(
            1,
            Math.floor(Number(data.progress.currentPage))
          );

          setCurrentPage((prev) => {
            return numPages > 0 ? Math.min(savedPage, numPages) : savedPage;
          });
        }
      } catch (error) {
        console.error(
          'Failed to restore reading progress:',
          error
        );
      } finally {
        if (mounted) {
          setProgressRestored(true);
        }
      }
    }

    restoreProgress();

    return () => {
      mounted = false;
    };
  }, [
    isSample,
    currentUser,
    token,
    bookId,
    progressRestored,
    numPages
  ]);

  /*
   * Keep currentPage strictly clamped within [1, numPages] when numPages is known.
   */
  useEffect(() => {
    if (numPages > 0 && currentPage > numPages) {
      setCurrentPage(numPages);
    } else if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [numPages, currentPage]);

  /*
   * Save reading progress to SQLite whenever the page changes.
   * Strictly disabled in sample mode to protect permanent reading progress.
   */
  useEffect(() => {
    if (
      isSample ||
      !progressRestored ||
      !bookId ||
      !currentUser ||
      numPages <= 0
    ) {
      return;
    }

    const validatedPage = Math.min(Math.max(1, currentPage), numPages);
    updateReadingProgress(
      bookId,
      validatedPage,
      numPages
    );
  }, [
    isSample,
    progressRestored,
    bookId,
    currentUser,
    currentPage,
    numPages,
    updateReadingProgress
  ]);

  /*
   * PDF successfully loaded.
   */
  const handleDocumentLoadSuccess = useCallback(
    ({ numPages: totalPages }: { numPages: number }) => {
      const validTotal = Math.max(1, totalPages || 1);
      setNumPages(validTotal);
      setPdfError(null);

      setCurrentPage((previousPage) => {
        const pageNum = Number.isFinite(previousPage) ? previousPage : 1;
        return Math.min(Math.max(1, pageNum), validTotal);
      });
    },
    []
  );

  /*
   * PDF loading failure.
   */
  const handleDocumentLoadError = useCallback(
    (error: Error) => {
      console.error('PDF loading error:', error);
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('404') || msg.includes('not found') || msg.includes('unexpected server response (404)')) {
        setPdfError('Digital edition unavailable. The PDF document file is missing or unavailable on the server.');
      } else if (msg.includes('403') || msg.includes('forbidden') || msg.includes('unexpected server response (403)')) {
        setPdfError('Access restricted. An active borrowing is required to access this digital edition.');
      } else {
        setPdfError('Digital edition unavailable. Could not load the document stream from the server.');
      }
    },
    []
  );

  /*
   * Previous page.
   */
  const handlePreviousPage = useCallback(() => {
    setCurrentPage((page) =>
      Math.max(1, page - 1)
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  /*
   * Next page.
   */
  const handleNextPage = useCallback(() => {
    setCurrentPage((page) =>
      Math.min(numPages, page + 1)
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [numPages]);

  /*
   * Keyboard navigation.
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        handlePreviousPage();
      }

      if (event.key === 'ArrowRight') {
        handleNextPage();
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    handlePreviousPage,
    handleNextPage
  ]);

  /*
   * Fullscreen support.
   */
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error(
        'Fullscreen error:',
        error
      );
    }
  };

  /*
   * Keep fullscreen button state synchronized.
   */
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        Boolean(document.fullscreenElement)
      );
    };

    document.addEventListener(
      'fullscreenchange',
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        'fullscreenchange',
        handleFullscreenChange
      );
    };
  }, []);

  /*
   * Zoom controls.
   */
  const decreaseZoom = () => {
    setScale((value) =>
      Math.max(
        0.7,
        Number((value - 0.1).toFixed(1))
      )
    );
  };

  const increaseZoom = () => {
    setScale((value) =>
      Math.min(
        2,
        Number((value + 0.1).toFixed(1))
      )
    );
  };

  /*
   * Reader themes.
   */
  const themeClasses: Record<
    ReaderTheme,
    {
      container: string;
      toolbar: string;
      text: string;
      border: string;
      page: string;
    }
  > = {
    light: {
      container: 'bg-slate-100 text-slate-900',
      toolbar:
        'bg-white border-slate-200 text-slate-800',
      text: 'text-slate-800',
      border: 'border-slate-200',
      page: 'bg-white'
    },
    sepia: {
      container:
        'bg-[#fbf0d9] text-[#433422]',
      toolbar:
        'bg-[#f4e4c1] border-[#e2ce9f] text-[#433422]',
      text: 'text-[#3b2e1e]',
      border: 'border-[#ebd9b4]',
      page: 'bg-[#fcf5e5]'
    },
    dark: {
      container:
        'bg-[#0f172a] text-slate-200',
      toolbar:
        'bg-[#1e293b] border-[#334155] text-slate-200',
      text: 'text-slate-200',
      border: 'border-[#334155]',
      page: 'bg-[#1e293b]'
    }
  };

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <LoadingSpinner
        message="Opening digital edition..."
      />
    );
  }

  /*
   * Book not found.
   */
  if (!book) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-rose-600" />

        <h2 className="text-xl font-bold font-serif text-slate-800 mt-4">
          Book Not Found
        </h2>

        <p className="text-sm text-slate-500 mt-2">
          The requested book could not be loaded
          from the library database.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
          >
            Retry Loading
          </button>
          <button
            type="button"
            onClick={() => navigate('/books')}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Back to Catalogue
          </button>
        </div>
      </div>
    );
  }

  /*
   * User must be authenticated.
   */
  if (!currentUser || !token) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-amber-600" />

        <h2 className="text-xl font-bold font-serif text-slate-800 mt-4">
          Sign In Required
        </h2>

        <p className="text-sm text-slate-500 mt-2">
          Please sign in to access digital books
          and save your reading progress.
        </p>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mt-5 px-5 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold"
        >
          Sign In
        </button>
      </div>
    );
  }

  const currentTheme = themeClasses[theme];

  const progress =
    numPages > 0
      ? Math.round(
          (safePageNumber / numPages) * 100
        )
      : 0;

  /*
   * No real PDF available.
   */
  if (!pdfUrl) {
    return (
      <div
        className={`min-h-screen ${currentTheme.container} flex flex-col`}
      >
        <header
          className={`sticky top-0 z-30 px-4 sm:px-6 py-3 border-b flex items-center gap-3 ${currentTheme.toolbar}`}
        >
          <button
            type="button"
            onClick={() =>
              navigate(`/book/${book.id}`)
            }
            className="p-2 rounded-lg hover:opacity-75 flex items-center gap-2 text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Book Details</span>
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-amber-600" />

            <h2 className="text-xl font-bold mt-4">
              Digital Edition Unavailable
            </h2>

            <p className="text-sm opacity-70 mt-2">
              This book does not currently have a
              real PDF uploaded to the library.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate(`/book/${book.id}`)
              }
              className="mt-5 px-5 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold"
            >
              Back to Book
            </button>
          </div>
        </main>
      </div>
    );
  }

  /*
   * If there is a PDF path but no authenticated
   * PDF request object, stop before loading PDF.js.
   */
  if (!pdfFile) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-10 h-10 mx-auto text-amber-600" />

        <h2 className="text-xl font-bold mt-4">
          Authentication Required
        </h2>

        <p className="text-sm text-slate-500 mt-2">
          Your secure reading session could not be established.
          Please sign in again.
        </p>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="mt-5 px-5 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold"
        >
          Sign In
        </button>
      </div>
    );
  }

  /*
   * Regular members must borrow the book before reading its digital edition.
   * Skipped entirely in sample mode since the sample endpoint is restricted to 5 pages server-side.
   */
  if (!isSample && currentUser?.role !== 'admin' && book && !book.isBorrowed) {
    return (
      <div className={`min-h-screen ${currentTheme.container} flex flex-col transition-colors duration-200`}>
        <header
          className={`sticky top-0 z-30 px-3 sm:px-6 py-3 border-b flex items-center justify-between gap-3 ${currentTheme.toolbar}`}
        >
          <button
            id="reader-back-btn"
            type="button"
            onClick={() => navigate(`/book/${book.id}`)}
            className="p-1.5 rounded-lg hover:opacity-75 flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Book Details</span>
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <BookOpen className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white">
              Borrowing Required
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              To read <strong>&ldquo;{book.title}&rdquo;</strong>, please borrow this book to add it to your active loans.
            </p>

            {pdfError && (
              <p className="text-xs text-rose-600 mt-3 font-medium bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg">
                {pdfError}
              </p>
            )}

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleBorrowAndRead}
                disabled={borrowingInProgress}
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                {borrowingInProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Borrowing book...</span>
                  </>
                ) : (
                  <>
                    <IdCard className="w-4 h-4" />
                    <span>Borrow & Read Now</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate(`/book/${book.id}`)}
                className="w-full sm:w-auto px-4 py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${currentTheme.container} flex flex-col transition-colors duration-200`}
    >
      {/* Top Toolbar */}
      <header
        className={`sticky top-0 z-30 px-3 sm:px-6 py-3 border-b flex items-center justify-between gap-3 ${currentTheme.toolbar}`}
      >
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="reader-back-btn"
            type="button"
            onClick={() =>
              navigate(`/book/${book.id}`)
            }
            className="p-1.5 rounded-lg hover:opacity-75 flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />

            <span className="hidden sm:inline">
              Book Details
            </span>
          </button>

          <div className="h-5 w-px bg-current opacity-20 hidden sm:block" />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold truncate">
                {book.title}
              </h1>
              {isSample && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 uppercase tracking-wide shrink-0">
                  Sample Preview
                </span>
              )}
            </div>

            <p className="text-[11px] opacity-70 truncate">
              {book.author}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Contents */}
          {book.content?.tableOfContents &&
            book.content.tableOfContents.length > 0 && (
              <button
                type="button"
                onClick={() => setShowToc(true)}
                className="p-2 rounded-lg hover:opacity-75 flex items-center gap-1"
                title="Table of Contents"
              >
                <ListOrdered className="w-4 h-4" />

                <span className="hidden lg:inline text-xs">
                  Contents
                </span>
              </button>
            )}

          {/* Zoom Out */}
          <button
            type="button"
            onClick={decreaseZoom}
            disabled={scale <= 0.7}
            className="p-2 rounded-lg hover:opacity-75 disabled:opacity-30"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="hidden sm:inline text-[11px] font-semibold min-w-[42px] text-center">
            {Math.round(scale * 100)}%
          </span>

          {/* Zoom In */}
          <button
            type="button"
            onClick={increaseZoom}
            disabled={scale >= 2}
            className="p-2 rounded-lg hover:opacity-75 disabled:opacity-30"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Themes */}
          <div className="flex items-center border rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-1.5 rounded-md ${
                theme === 'light'
                  ? 'bg-black/10'
                  : 'hover:opacity-75'
              }`}
              title="Light"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setTheme('sepia')}
              className={`p-1.5 rounded-md ${
                theme === 'sepia'
                  ? 'bg-amber-900/15'
                  : 'hover:opacity-75'
              }`}
              title="Sepia"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-1.5 rounded-md ${
                theme === 'dark'
                  ? 'bg-white/20'
                  : 'hover:opacity-75'
              }`}
              title="Dark"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:opacity-75 hidden sm:block"
            title="Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
      </header>

      {/* Sample Mode Banner */}
      {isSample && (
        <div
          id="sample-preview-banner"
          className="bg-amber-500/10 border-b border-amber-500/20 px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-800 dark:text-amber-300">
              Preview
            </span>
            <span className="font-semibold">
              Preview Sample — First 5 Pages
            </span>
            <span className="opacity-70 hidden md:inline">
              (Only pages 1–{numPages || 5} of the actual PDF are included in this preview edition)
            </span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {book && !book.isBorrowed && book.available && (
              <button
                id="sample-borrow-cta-btn"
                type="button"
                onClick={handleBorrowAndRead}
                disabled={borrowingInProgress}
                className="px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                {borrowingInProgress ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Borrowing...</span>
                  </>
                ) : (
                  <>
                    <IdCard className="w-3.5 h-3.5" />
                    <span>Borrow Full Book to Continue Reading</span>
                  </>
                )}
              </button>
            )}

            {book && !book.isBorrowed && !book.available && (
              <button
                id="sample-reserve-cta-btn"
                type="button"
                onClick={() => navigate(`/book/${book.id}`)}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Reserve / Join Queue</span>
              </button>
            )}

            {book && book.isBorrowed && (
              <button
                id="sample-read-full-btn"
                type="button"
                onClick={() => navigate(`/read/${book.id}`)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Read Full Book</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="w-full bg-black/10 h-1">
        <div
          className="bg-blue-600 h-1 transition-all duration-300"
          style={{
            width: `${progress}%`
          }}
        />
      </div>

      {/* PDF Canvas */}
      <main className="flex-1 w-full flex justify-center px-2 sm:px-6 py-6 sm:py-8 overflow-x-auto">
        <div className="w-full flex justify-center">
          <Document
            file={pdfFile}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={handleDocumentLoadError}
            loading={
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin" />

                <p className="text-sm opacity-70 mt-3">
                  Loading secure PDF...
                </p>
              </div>
            }
            error={
              <div className="max-w-md text-center py-20">
                <AlertCircle className="w-10 h-10 mx-auto text-rose-600" />

                <h2 className="text-xl font-bold mt-3">
                  Digital Edition Unavailable
                </h2>

                <p className="text-sm opacity-70 mt-2">
                  {pdfError ||
                    'The digital edition could not be loaded. Make sure you have an active borrowing for this book.'}
                </p>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/book/${book.id}`)
                  }
                  className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Back to Book
                </button>
              </div>
            }
          >
            {numPages > 0 ? (
              <div
                key={`reader-page-${safePageNumber}-${scale}`}
                className={`rounded-lg shadow-xl overflow-hidden ${currentTheme.page}`}
              >
                <Page
                  pageNumber={safePageNumber}
                  scale={scale}
                  renderTextLayer
                  renderAnnotationLayer
                  onLoadError={(err) => {
                    console.warn('Page render error:', err);
                    if (currentPage !== 1) {
                      setCurrentPage(1);
                    }
                  }}
                  loading={
                    <div className="min-h-[500px] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  }
                />
              </div>
            ) : (
              <div className="min-h-[500px] flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm opacity-70 mt-3 font-medium">
                  Preparing reader pages...
                </p>
              </div>
            )}
          </Document>

          {/* End of Sample Notice */}
          {isSample && numPages > 0 && safePageNumber >= numPages && (
            <div
              id="sample-end-notice"
              className="mt-8 max-w-xl mx-auto p-5 rounded-2xl bg-white/95 dark:bg-slate-850/95 border border-amber-300 dark:border-amber-800 shadow-lg text-center"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-base text-slate-900 dark:text-white">
                End of 5-Page Sample Preview
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-md mx-auto leading-relaxed">
                You have reached page {numPages} of the preview edition. To continue reading the complete digital edition of <strong>{book?.title}</strong>, borrow or reserve the book.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                {book && !book.isBorrowed && book.available && (
                  <button
                    type="button"
                    onClick={handleBorrowAndRead}
                    disabled={borrowingInProgress}
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    {borrowingInProgress ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Borrowing...</span>
                      </>
                    ) : (
                      <>
                        <IdCard className="w-3.5 h-3.5" />
                        <span>Borrow Full Book to Continue Reading</span>
                      </>
                    )}
                  </button>
                )}

                {book && !book.isBorrowed && !book.available && (
                  <button
                    type="button"
                    onClick={() => navigate(`/book/${book.id}`)}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Reserve / Join Queue</span>
                  </button>
                )}

                {book && book.isBorrowed && (
                  <button
                    type="button"
                    onClick={() => navigate(`/read/${book.id}`)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Full Book</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate(`/book/${book?.id}`)}
                  className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium text-xs transition-colors cursor-pointer"
                >
                  Book Details
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Controls */}
      <footer
        className={`sticky bottom-0 z-30 border-t px-4 sm:px-6 py-3 ${currentTheme.toolbar}`}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="reader-prev-page-btn"
              type="button"
              onClick={handlePreviousPage}
              disabled={safePageNumber <= 1}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-semibold text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5"
            >
              <ChevronLeft className="w-4 h-4" />

              <span>Previous</span>
            </button>

            <button
              id="reader-next-page-btn"
              type="button"
              onClick={handleNextPage}
              disabled={
                numPages === 0 ||
                safePageNumber >= numPages
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>

              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs font-medium">
            {isSample ? (
              <>
                Sample Page <strong>{safePageNumber}</strong> of <strong>{numPages || 5}</strong>
                <span className="mx-2 opacity-50">•</span>
                <span className="text-amber-700 dark:text-amber-400 font-semibold">5-Page Preview Edition</span>
              </>
            ) : (
              <>
                Page <strong>{safePageNumber}</strong>
                {numPages > 0 && (
                  <>
                    {' '}
                    of <strong>{numPages}</strong>
                  </>
                )}
                <span className="mx-2 opacity-50">•</span>
                {progress}% completed
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Table of Contents */}
      {showToc &&
        book.content?.tableOfContents &&
        book.content.tableOfContents.length > 0 && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowToc(false)}
          >
            <div
              className={`w-full max-w-md rounded-2xl border shadow-xl p-6 ${currentTheme.page} ${currentTheme.border}`}
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="font-serif font-bold text-lg">
                  Table of Contents
                </h2>

                <button
                  type="button"
                  onClick={() => setShowToc(false)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-black/10"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                {book.content.tableOfContents.map(
                  (chapter, index) => (
                    <button
                      key={`${chapter}-${index}`}
                      type="button"
                      onClick={() => {
                        /*
                         * PDF table-of-contents entries do not
                         * necessarily map directly to PDF pages.
                         */
                        setShowToc(false);
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-black/5 flex items-center justify-between text-xs sm:text-sm"
                    >
                      <span className="font-medium">
                        {chapter}
                      </span>

                      <span className="text-xs opacity-50">
                        Ch. {index + 1}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
};