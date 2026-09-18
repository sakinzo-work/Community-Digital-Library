/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Book, Review } from '../types';
import { BookService } from '../services/bookService';
import { BookCover } from '../components/common/BookCover';
import { BookCard } from '../components/common/BookCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ClaimCountdown } from '../components/common/ClaimCountdown';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Layers,
  Globe2,
  CheckCircle,
  Clock,
  Share2,
  Bookmark,
  Building,
  Hash,
  Star,
  Check,
  IdCard,
  MessageSquare,
  Trash2,
  Send,
  AlertCircle,
  XCircle,
  RotateCcw,
  BookCheck
} from 'lucide-react';

export const BookDetailsPage: React.FC = () => {
  const { params, navigate, goBack } = useRouter();
  const bookId = params.id;
  const { currentUser, isBookmarked, toggleBookmark, borrowBook, returnBook, reserveBook, cancelReservation, isAdmin, refreshUserData } = useAuth();

  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Review form state
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [borrowingInProgress, setBorrowingInProgress] = useState(false);
  const [reservingInProgress, setReservingInProgress] = useState(false);
  const [returningInProgress, setReturningInProgress] = useState(false);

  const activeLoan =
    book?.userLoan ||
    currentUser?.borrowedBooks?.find(
      (b) => b.bookId === book?.id && (b.status === 'active' || b.status === 'overdue' || (!b.status && !b.isReturned))
    );

  const isCurrentMemberBorrowed = Boolean(activeLoan || book?.isBorrowed);

  const activeHold =
    book?.userReservation ||
    currentUser?.reservations?.find(
      (r) => r.bookId === book?.id && (r.status === 'waiting' || r.status === 'ready')
    );

  const isLoanOverdue = Boolean(
    activeLoan && (
      activeLoan.status === 'overdue' ||
      (activeLoan.dueDate && (() => {
        const due = new Date(activeLoan.dueDate.length === 10 ? activeLoan.dueDate + 'T23:59:59.999Z' : activeLoan.dueDate);
        return !Number.isNaN(due.getTime()) && Date.now() > due.getTime();
      })())
    )
  );

  const waitingQueueCount = typeof book?.waitingCount === 'number' ? book.waitingCount : 0;
  const queuePos = activeHold?.queuePosition || 1;
  const membersAhead = Math.max(0, queuePos - 1);

  const loadReviews = async (id: string) => {
    try {
      const revs = await BookService.getBookReviews(id);
      setReviews(revs);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  useEffect(() => {
    async function loadBook() {
      if (!bookId) return;
      setLoading(true);
      try {
        const data = await BookService.getBookById(bookId);
        setBook(data);
        if (data) {
          const related = await BookService.getRelatedBooks(data.id, data.category, 3);
          setRelatedBooks(related);
        }
        await loadReviews(bookId);
      } catch (err) {
        console.error('Error fetching book details', err);
      } finally {
        setLoading(false);
      }
    }
    loadBook();
    if (currentUser) {
      refreshUserData();
    }
  }, [bookId]);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBookmarkToggle = async () => {
    if (!book) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }
    const newlySaved = await toggleBookmark(book.id);
    setNotification(newlySaved ? 'Added to your Member Reading List' : 'Removed from Reading List');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBorrow = async () => {
    if (!book) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setBorrowingInProgress(true);
    try {
      const res = await borrowBook(book.id);
      setNotification(res.message);
      if (res.success) {
        // Refresh book status
        const updated = await BookService.getBookById(book.id);
        if (updated) setBook(updated);
      }
    } finally {
      setBorrowingInProgress(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleReserve = async () => {
    if (!book) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setReservingInProgress(true);
    try {
      const res = await reserveBook(book.id);
      setNotification(res.message);
      if (res.success) {
        const updated = await BookService.getBookById(book.id);
        if (updated) setBook(updated);
      }
    } catch (err: any) {
      setNotification(err.message || 'Failed to place reservation');
    } finally {
      setReservingInProgress(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleCancelHold = async (reservationId: string) => {
    if (!book) return;
    setReservingInProgress(true);
    try {
      const res = await cancelReservation(reservationId);
      setNotification(res.message);
      if (res.success) {
        const updated = await BookService.getBookById(book.id);
        if (updated) setBook(updated);
      }
    } catch (err: any) {
      setNotification(err.message || 'Failed to cancel reservation');
    } finally {
      setReservingInProgress(false);
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const handleReturn = async () => {
    if (!book || !currentUser) return;
    setReturningInProgress(true);
    try {
      const targetId = activeLoan?.id || book.id;
      const res = await returnBook(targetId);
      setNotification(res.message);
      if (res.success) {
        const updated = await BookService.getBookById(book.id);
        if (updated) setBook(updated);
      }
    } finally {
      setReturningInProgress(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (!comment.trim()) return;

    setSubmittingReview(true);
    const res = await BookService.addReview(book.id, rating, comment.trim());
    setSubmittingReview(false);

    if (res.success) {
      setComment('');
      setNotification('Your review has been saved to the library catalog');
      await loadReviews(book.id);
      const updated = await BookService.getBookById(book.id);
      if (updated) setBook(updated);
    } else {
      setNotification(res.message || 'Failed to submit review');
    }
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Delete this review?')) return;
    const res = await BookService.deleteReview(reviewId);
    if (res.success) {
      setNotification('Review removed');
      if (book) {
        await loadReviews(book.id);
        const updated = await BookService.getBookById(book.id);
        if (updated) setBook(updated);
      }
    } else {
      setNotification(res.message || 'Failed to delete review');
    }
    setTimeout(() => setNotification(null), 3000);
  };

  const saved = book ? isBookmarked(book.id) : false;

  if (loading) {
    return <LoadingSpinner message="Retrieving book details from catalogue..." />;
  }

  if (!book) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="font-serif text-2xl font-bold text-slate-800">Book Not Found</h2>
        <p className="text-slate-500 text-sm mt-2">
          The requested book ID could not be located in our library catalog.
        </p>
        <button
          type="button"
          onClick={() => navigate('/books')}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalogue</span>
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          id="back-to-books-btn"
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Books</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="book-bookmark-btn"
            type="button"
            onClick={handleBookmarkToggle}
            className={`p-2 rounded-lg border text-sm transition-colors flex items-center gap-1.5 ${
              saved
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title={saved ? 'Remove from reading list' : 'Save to my member reading list'}
          >
            <Bookmark className={`w-4 h-4 ${saved ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span className="hidden sm:inline text-xs font-medium">
              {saved ? 'Bookmarked' : 'Save Book'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm transition-colors flex items-center gap-1.5"
            title="Copy link to book"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">
              {copied ? 'Copied Link!' : 'Share'}
            </span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs text-emerald-700 hover:text-emerald-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Book Main Hero Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Large Book Cover */}
          <div className="lg:col-span-4 flex flex-col items-center sm:items-start">
            <div className="w-full max-w-[260px] sm:max-w-xs mx-auto">
              <BookCover
                src={book.cover}
                title={book.title}
                author={book.author}
                category={book.category}
                coverColor={book.coverColor}
                size="xl"
                className="w-full shadow-xl"
              />
            </div>

            {/* Availability Pill */}
            <div className="mt-6 w-full max-w-xs mx-auto space-y-2">
              {!book.hasDigitalVersion ? (
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="font-medium">
                    Digital copy unavailable
                  </span>
                </div>
              ) : isCurrentMemberBorrowed ? (
                <div className={`p-3 border rounded-xl text-xs flex items-start gap-2.5 ${
                  isLoanOverdue
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}>
                  {isLoanOverdue ? (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>Currently borrowed by you</span>
                      {isLoanOverdue && (
                        <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[10px] uppercase font-bold rounded">
                          Overdue
                        </span>
                      )}
                    </div>
                    {activeLoan?.borrowedAt && (
                      <div className="text-[11px] opacity-80 mt-0.5">
                        Borrowed: {activeLoan.borrowedAt}
                      </div>
                    )}
                    {activeLoan?.dueDate && (
                      <div className={`text-[11px] font-medium mt-0.5 ${isLoanOverdue ? 'text-rose-700 font-bold' : 'opacity-80'}`}>
                        Due: {activeLoan.dueDate}
                      </div>
                    )}
                  </div>
                </div>
              ) : activeHold?.status === 'ready' ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold">Your reservation is ready!</div>
                    <div className="text-[11px] text-emerald-700 mt-0.5 mb-2">
                      Ready to borrow now. You have 24 hours to claim this volume.
                    </div>
                    <ClaimCountdown expiresAt={activeHold.expiresAt} />
                  </div>
                </div>
              ) : activeHold?.status === 'waiting' ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Reservation active</div>
                    <div className="text-[11px] text-amber-800 mt-0.5">
                      You are #{queuePos} in the queue ({membersAhead} {membersAhead === 1 ? 'member' : 'members'} ahead of you).
                    </div>
                  </div>
                </div>
              ) : book.available ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium">
                    Available to borrow
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Currently borrowed by another member</div>
                    <div className="text-[11px] text-amber-700 mt-0.5 font-semibold">
                      {waitingQueueCount > 0
                        ? `${waitingQueueCount} ${waitingQueueCount === 1 ? 'member' : 'members'} waiting`
                        : '0 members waiting'} &bull; Available to reserve
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Book Details & Synopsis */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
            <div>
              {/* Category, Year, Rating Header */}
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <span
                  onClick={() => navigate(`/books?category=${encodeURIComponent(book.category)}`)}
                  className="cursor-pointer px-3 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  {book.category}
                </span>

                <span className="text-xs text-slate-400 font-semibold">&bull;</span>
                <span className="text-xs font-medium text-slate-500">{book.year}</span>

                <span className="text-xs text-slate-400 font-semibold">&bull;</span>
                <div className="flex items-center text-xs font-semibold text-amber-700">
                  {book.rating && book.rating > 0 ? (
                    <>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                      <span>{book.rating.toFixed(1)}</span>
                      <span className="text-slate-400 font-normal ml-1">
                        ({reviews.length === 0 ? 'No reviews yet' : reviews.length === 1 ? '1 review' : `${reviews.length} reviews`})
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 font-normal">
                      {reviews.length === 0 ? 'No reviews yet' : reviews.length === 1 ? '1 review' : `${reviews.length} reviews`}
                    </span>
                  )}
                </div>
              </div>

              {/* Title and Author */}
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
                {book.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-medium mt-2">
                Written by <span className="text-slate-900 font-semibold">{book.author}</span>
              </p>

              {/* Primary Action Button Area */}
              <div className="mt-6 flex flex-col gap-4">
                {!book.hasDigitalVersion ? (
                  /* Case A: No real PDF:
                   * - "Digital copy unavailable"
                   * - Catalogue information remains visible.
                   * - No borrow/reserve/read buttons.
                   */
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="px-5 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-medium text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Digital copy unavailable</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/books')}
                      className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
                    >
                      Browse Catalogue
                    </button>
                  </div>
                ) : isCurrentMemberBorrowed ? (
                  /* Case 3: Real PDF + borrowed by current member:
                   * - Currently borrowed by you
                   * - Borrowed date
                   * - Due date
                   * - If overdue, clearly show "Overdue"
                   * - Read Full Book
                   * - Return Book
                   * - No Reserve button
                   */
                  <div className="space-y-3">
                    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLoanOverdue
                        ? 'bg-rose-50 border-rose-200 text-rose-900'
                        : 'bg-blue-50 border-blue-200 text-blue-900'
                    }`}>
                      <div className="flex items-start gap-3">
                        {isLoanOverdue ? (
                          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">Currently borrowed by you</span>
                            {isLoanOverdue ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-rose-600 text-white shadow-2xs">
                                Overdue
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Active Loan
                              </span>
                            )}
                          </div>
                          <div className="text-xs mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                            {activeLoan?.borrowedAt && (
                              <span className="text-slate-600">
                                Borrowed: <strong className="text-slate-900">{activeLoan.borrowedAt}</strong>
                              </span>
                            )}
                            {activeLoan?.dueDate && (
                              <span className={isLoanOverdue ? 'text-rose-700 font-bold' : 'text-slate-600'}>
                                Due Date: <strong className={isLoanOverdue ? 'text-rose-800' : 'text-slate-900'}>{activeLoan.dueDate}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        id="read-book-primary-btn"
                        type="button"
                        onClick={() => navigate(`/read/${book.id}`)}
                        className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm sm:text-base flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <BookOpen className="w-5 h-5" />
                        <span>Read Full Book</span>
                      </button>
                      <button
                        id="return-book-details-btn"
                        type="button"
                        onClick={handleReturn}
                        disabled={returningInProgress}
                        className="px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{returningInProgress ? 'Returning...' : 'Return Book'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/books')}
                        className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
                      >
                        Browse Catalogue
                      </button>
                    </div>
                  </div>
                ) : activeHold?.status === 'ready' ? (
                  /* Case 5: Reserved by current member and ready:
                   * - Your reservation is ready!
                   * - You are next in line.
                   * - Borrow Reserved Copy
                   * - Cancel Reservation
                   * - Read Sample (5 Pages)
                   */
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-sm">Your reservation is ready!</div>
                          <div className="text-xs text-emerald-800 mt-1">
                            You are next in line. The digital volume has been returned and is available exclusively for you to borrow now.
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <ClaimCountdown expiresAt={activeHold.expiresAt} />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        id="read-sample-btn"
                        type="button"
                        onClick={() => navigate(`/read/${book.id}?sample=true`)}
                        className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-slate-600" />
                        <span>Read Sample (5 Pages)</span>
                      </button>
                      <button
                        id="borrow-reserved-btn"
                        type="button"
                        onClick={handleBorrow}
                        disabled={borrowingInProgress}
                        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm sm:text-base flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <BookCheck className="w-5 h-5" />
                        <span>{borrowingInProgress ? 'Borrowing...' : 'Borrow Reserved Copy'}</span>
                      </button>
                      <button
                        id="cancel-hold-btn"
                        type="button"
                        onClick={() => handleCancelHold(activeHold.id)}
                        disabled={reservingInProgress}
                        className="px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {reservingInProgress ? 'Cancelling...' : 'Cancel Reservation'}
                      </button>
                      {currentUser?.role === 'admin' && (
                        <button
                          id="read-book-admin-btn"
                          type="button"
                          onClick={() => navigate(`/read/${book.id}`)}
                          className="px-5 py-3 rounded-xl border border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Read Full Book (Admin)</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate('/books')}
                        className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
                      >
                        Browse Catalogue
                      </button>
                    </div>
                  </div>
                ) : activeHold?.status === 'waiting' ? (
                  /* Case 4: Reserved by current member and waiting:
                   * - Reservation active
                   * - Queue position
                   * - Members ahead
                   * - Cancel Reservation
                   * - Read Sample (5 Pages)
                   */
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">Reservation active</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-200 text-amber-900">
                            Queue #{queuePos}
                          </span>
                        </div>
                        <div className="text-xs text-amber-800 mt-1">
                          You are <strong>#{queuePos} in the queue</strong> ({membersAhead} {membersAhead === 1 ? 'member' : 'members'} ahead of you). You will be next in line when previous copies are returned.
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        id="read-sample-btn"
                        type="button"
                        onClick={() => navigate(`/read/${book.id}?sample=true`)}
                        className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm sm:text-base flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <BookOpen className="w-5 h-5" />
                        <span>Read Sample (5 Pages)</span>
                      </button>
                      <button
                        id="cancel-hold-btn"
                        type="button"
                        onClick={() => handleCancelHold(activeHold.id)}
                        disabled={reservingInProgress}
                        className="px-4 py-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {reservingInProgress ? 'Cancelling...' : 'Cancel Reservation'}
                      </button>
                      {currentUser?.role === 'admin' && (
                        <button
                          id="read-book-admin-btn"
                          type="button"
                          onClick={() => navigate(`/read/${book.id}`)}
                          className="px-5 py-3 rounded-xl border border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Read Full Book (Admin)</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate('/books')}
                        className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
                      >
                        Browse Catalogue
                      </button>
                    </div>
                  </div>
                ) : book.available ? (
                  /* Case 1: Available:
                   * - Read Sample (5 Pages)
                   * - Borrow
                   */
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      id="read-sample-btn"
                      type="button"
                      onClick={() => navigate(`/read/${book.id}?sample=true`)}
                      className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm sm:text-base flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>Read Sample (5 Pages)</span>
                    </button>
                    <button
                      id="borrow-book-btn"
                      type="button"
                      onClick={handleBorrow}
                      disabled={borrowingInProgress}
                      className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm sm:text-base flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      <BookCheck className="w-4 h-4" />
                      <span>{borrowingInProgress ? 'Borrowing...' : 'Borrow'}</span>
                    </button>
                    {currentUser?.role === 'admin' && (
                      <button
                        id="read-book-admin-btn"
                        type="button"
                        onClick={() => navigate(`/read/${book.id}`)}
                        className="px-5 py-3 rounded-xl border border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Read Full Book (Admin)</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate('/books')}
                      className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
                    >
                      Browse Catalogue
                    </button>
                  </div>
                ) : (
                  /* Case 2: Borrowed by another member:
                   * - Read Sample (5 Pages)
                   * - Number of members waiting (e.g. "3 members waiting")
                   * - Reserve
                   */
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="font-medium">Currently borrowed by another member.</span>
                      </div>
                      <span className="font-semibold bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full text-xs border border-amber-200">
                        {waitingQueueCount > 0
                          ? `${waitingQueueCount} ${waitingQueueCount === 1 ? 'member' : 'members'} waiting`
                          : '0 members waiting'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        id="read-sample-btn"
                        type="button"
                        onClick={() => navigate(`/read/${book.id}?sample=true`)}
                        className="px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm sm:text-base flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <BookOpen className="w-5 h-5" />
                        <span>Read Sample (5 Pages)</span>
                      </button>
                      <button
                        id="reserve-book-btn"
                        type="button"
                        onClick={handleReserve}
                        disabled={reservingInProgress}
                        className="px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm sm:text-base flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <Clock className="w-4 h-4" />
                        <span>{reservingInProgress ? 'Reserving...' : 'Reserve'}</span>
                      </button>
                      {currentUser?.role === 'admin' && (
                        <button
                          id="read-book-admin-btn"
                          type="button"
                          onClick={() => navigate(`/read/${book.id}`)}
                          className="px-5 py-3 rounded-xl border border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold text-sm flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Read Full Book (Admin)</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate('/books')}
                        className="px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer"
                      >
                        Browse Catalogue
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Description Section */}
              <div className="mt-8 border-t border-slate-100 pt-6">
                <h3 className="font-serif text-lg font-bold text-slate-900 mb-3">
                  Synopsis & Overview
                </h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                  {book.description}
                </p>
              </div>
            </div>

            {/* Book Metadata Grid */}
            <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/60 p-4 rounded-xl">
              <div>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Published
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{book.year}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Pages
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{book.pages} pages</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Globe2 className="w-3.5 h-3.5" />
                  Language
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{book.language}</p>
              </div>

              <div>
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  Publisher
                </span>
                <p className="text-sm font-semibold text-slate-800 mt-0.5 truncate">
                  {book.publisher || 'Not specified'}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5" />
                  ISBN-13: <strong className="text-slate-700">{book.isbn}</strong>
                </span>
                <span>Community Archive ID: #{book.id.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section from SQLite */}
      <section className="space-y-6 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h3 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-amber-700" />
              Member Reviews & Ratings ({reviews.length})
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Read opinions and recommendations from our library readers.
            </p>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(book.rating || 0)
                    ? 'fill-amber-500 text-amber-500'
                    : 'text-slate-300'
                }`}
              />
            ))}
            <span className="text-sm font-semibold text-slate-700 ml-1">
              {book.rating ? book.rating.toFixed(1) : 'No reviews'}
            </span>
          </div>
        </div>

        {/* Add Review Form (for logged in members) */}
        {currentUser ? (
          <form onSubmit={handleReviewSubmit} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-semibold text-slate-900 text-sm">Write a Member Review</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Your Rating:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-500 hover:scale-110 transition"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-semibold text-slate-700 ml-2">{rating} out of 5 stars</span>
            </div>

            <div>
              <textarea
                rows={3}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about this book, pacing, characters, or key learnings..."
                className="w-full p-3 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-600 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingReview}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
            <span>Please sign in or register with your library card to leave a review.</span>
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 bg-amber-700 text-white rounded-lg font-semibold hover:bg-amber-800"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-3">
          {reviews.map((rev) => (
            <div key={rev.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'M'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 text-sm">{rev.userName}</span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= rev.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  {(isAdmin || currentUser?.id === rev.userId) && (
                    <button
                      onClick={() => handleDeleteReview(rev.id)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                      title="Delete review"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">{rev.comment}</p>
            </div>
          ))}

          {reviews.length === 0 && (
            <p className="text-xs text-slate-500 italic text-center py-4">
              Be the first community member to write a review for this book!
            </p>
          )}
        </div>
      </section>

      {/* Related Books in Category */}
      {relatedBooks.length > 0 && (
        <section className="space-y-6 pt-4">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="font-serif text-2xl font-bold text-slate-900">
              More in {book.category}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Explore other recommended titles in this subject area.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedBooks.map((relBook) => (
              <BookCard key={relBook.id} book={relBook} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
