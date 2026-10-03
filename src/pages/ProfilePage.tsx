/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Book, MembershipType } from '../types';
import { BookService } from '../services/bookService';
import { BookCover } from '../components/common/BookCover';
import { ClaimCountdown } from '../components/common/ClaimCountdown';
import {
  IdCard,
  User,
  Mail,
  Phone,
  Calendar,
  Bookmark,
  BookOpen,
  Clock,
  RotateCcw,
  Edit3,
  Check,
  X,
  LogOut,
  Copy,
  ExternalLink,
  Library,
  Sparkles,
  Award,
  ArrowRight,
  Layers,
  FileText,
  BookmarkCheck,
  AlertCircle
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { navigate } = useRouter();
  const {
    currentUser,
    logout,
    updateProfile,
    toggleBookmark,
    returnBook,
    borrowBook,
    cancelReservation
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'saved' | 'borrows' | 'holds' | 'history'>('saved');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editMembership, setEditMembership] = useState<MembershipType>('Resident');

  // Book data for saved books, borrows, and history
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [borrowedBookMap, setBorrowedBookMap] = useState<Record<string, Book>>({});
  const [historyBookMap, setHistoryBookMap] = useState<Record<string, Book>>({});
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditPhone(currentUser.phone || '');
      setEditBio(currentUser.bio || '');
      setEditMembership(currentUser.membershipType);
    }
  }, [currentUser]);

  // Load books related to user's saved list, borrows, and history
  useEffect(() => {
    async function loadUserBooks() {
      if (!currentUser) return;
      setLoadingData(true);
      try {
        const all = await BookService.getBooks();

        // Saved books
        const saved = all.filter((b) => currentUser.savedBookIds.includes(b.id));
        setSavedBooks(saved);

        // Map for borrowed books
        const bMap: Record<string, Book> = {};
        currentUser.borrowedBooks.forEach((record) => {
          const b = all.find((item) => item.id === record.bookId);
          if (b) bMap[record.bookId] = b;
        });
        currentUser.reservations?.forEach((record) => {
          const b = all.find((item) => item.id === record.bookId);
          if (b) bMap[record.bookId] = b;
        });
        setBorrowedBookMap(bMap);

        // Map for history books
        const hMap: Record<string, Book> = {};
        currentUser.readingHistory.forEach((record) => {
          const b = all.find((item) => item.id === record.bookId);
          if (b) hMap[record.bookId] = b;
        });
        setHistoryBookMap(hMap);
      } catch (e) {
        console.error('Failed to load user books', e);
      } finally {
        setLoadingData(false);
      }
    }
    loadUserBooks();
  }, [currentUser]);

  const handleCopyCard = () => {
    if (currentUser?.libraryCardNumber) {
      navigator.clipboard?.writeText(currentUser.libraryCardNumber);
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2000);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    await updateProfile({
      name: editName.trim(),
      phone: editPhone.trim(),
      bio: editBio.trim(),
      membershipType: editMembership
    });

    setIsEditing(false);
    setStatusMessage('Profile information successfully updated!');
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleRemoveBookmark = async (bookId: string) => {
    await toggleBookmark(bookId);
    setSavedBooks((prev) => prev.filter((b) => b.id !== bookId));
  };

  const handleReturnBook = async (borrowingOrBookId: string) => {
    const res = await returnBook(borrowingOrBookId);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCancelReservation = async (reservationId: string) => {
    const res = await cancelReservation(reservationId);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleBorrowReserved = async (bookId: string) => {
    const res = await borrowBook(bookId);
    setStatusMessage(res.message);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-700 mx-auto flex items-center justify-center mb-4">
          <IdCard className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-slate-900">
          Member Profile Access
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Sign in to view your digital library card, track saved books, and manage reading loans.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 transition-colors shadow-xs"
          >
            Member Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Register for Free
          </button>
        </div>
      </div>
    );
  }

  const activeBorrows = currentUser.borrowedBooks.filter((b) => !b.isReturned);
  const returnedBorrows = currentUser.borrowedBooks.filter((b) => b.isReturned);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-12 space-y-5 sm:space-y-8">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{statusMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Profile Header & Digital Library Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
        {/* Left Column: Digital Membership Card & Quick Actions */}
        <div className="lg:col-span-5 space-y-6">
          {/* Digital Card */}
          <div className="rounded-[1.6rem] sm:rounded-3xl bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-7 shadow-xl border border-blue-900/50 relative overflow-hidden">
            <Library className="absolute -right-8 -bottom-8 w-44 h-44 text-white/5 pointer-events-none" />

            {/* Top Bar */}
            <div className="flex items-start justify-between gap-3 mb-6 relative z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-xs">
                  <Library className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif font-bold text-base text-white leading-tight truncate">
                    Community Digital Library
                  </h2>
                  <span className="text-[11px] text-blue-300 font-medium">
                    Digital Member Card &bull; Active
                  </span>
                </div>
              </div>

              <span className="shrink-0 px-2.5 sm:px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-[11px] sm:text-xs font-semibold text-blue-200">
                {currentUser.membershipType}
              </span>
            </div>

            {/* Cardholder Info */}
            <div className="space-y-4 relative z-10">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium block">
                  Member Name
                </span>
                <p className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide mt-0.5">
                  {currentUser.name}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium block">
                    Library Card ID
                  </span>
                  <p className="font-mono text-base font-bold text-amber-300 tracking-wider">
                    {currentUser.libraryCardNumber}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCard}
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Copy Card ID"
                >
                  {copiedCard ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedCard ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Barcode representation */}
              <div className="pt-2 flex flex-col items-center">
                <div className="h-7 w-full flex items-center justify-center gap-1 opacity-70">
                  <div className="w-1.5 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-1 h-full bg-white" />
                  <div className="w-2 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-1.5 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-1 h-full bg-white" />
                  <div className="w-2.5 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-1 h-full bg-white" />
                </div>
                <span className="text-[10px] font-mono text-slate-400 tracking-widest mt-1">
                  {currentUser.libraryCardNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 text-center shadow-xs">
              <span className="text-xl sm:text-2xl font-bold font-serif text-blue-700 block">
                {currentUser.savedBookIds.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">Saved Books</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 text-center shadow-xs">
              <span className="text-xl sm:text-2xl font-bold font-serif text-emerald-700 block">
                {activeBorrows.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">Active Loans</span>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 text-center shadow-xs">
              <span className="text-xl sm:text-2xl font-bold font-serif text-indigo-700 block">
                {currentUser.readingHistory.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">History</span>
            </div>
          </div>
        </div>

        {/* Right Column: Member Details & Edit Profile */}
        <div className="lg:col-span-7 bg-white rounded-[1.6rem] sm:rounded-3xl border border-slate-200/90 p-4 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
          <div className="flex flex-col gap-4 pb-5 border-b border-slate-100 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                    {currentUser.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Member since {currentUser.memberSince}</span>
                </p>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
              {!isEditing ? (
                <button
                  id="edit-profile-btn"
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:bg-slate-50"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              ) : null}

              <button
                id="profile-logout-btn"
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/40 px-3.5 py-2.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                title="Log out of library account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Edit Form OR Details View */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Membership Category
                  </label>
                  <select
                    value={editMembership}
                    onChange={(e) => setEditMembership(e.target.value as MembershipType)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  >
                    <option value="Resident">Community Resident</option>
                    <option value="Student">Student</option>
                    <option value="Educator">Educator</option>
                    <option value="Senior">Senior Member</option>
                    <option value="General">General Patron</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Member Bio & Reading Focus
                </label>
                <textarea
                  rows={2}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-xs">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] uppercase tracking-wide text-slate-400 font-bold block">Registered Email</span>
                    <span className="font-semibold text-slate-800 break-all">{currentUser.email}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-xs">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[11px] uppercase tracking-wide text-slate-400 font-bold block">Contact Phone</span>
                    <span className="font-semibold text-slate-800">
                      {currentUser.phone || 'No phone recorded'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                  <FileText className="h-3.5 w-3.5 text-slate-500" />
                  <span>Member Bio & Reading Notes</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  &ldquo;{currentUser.bio || 'Exploring the community library resources.'}&rdquo;
                </p>
              </div>

              {/* Interests */}
              {currentUser.favoriteCategories && currentUser.favoriteCategories.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    <Layers className="h-3.5 w-3.5 text-blue-600" />
                    <span>Favorite Disciplines</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentUser.favoriteCategories.map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[11px] font-bold text-blue-700"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <div className="flex items-center gap-1.5 overflow-x-auto sm:gap-4 sm:border-b sm:border-slate-200 sm:pb-px">
          <button
            id="tab-saved-books"
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap sm:rounded-none sm:pb-3 sm:pt-0 sm:text-sm sm:border-b-2 ${
              activeTab === 'saved'
                ? 'bg-blue-700 text-white sm:bg-transparent sm:border-blue-700 sm:text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:border-transparent sm:hover:bg-transparent'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span className="sm:hidden">Saved</span>
            <span className="hidden sm:inline">Saved Reading List</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'saved' ? 'bg-white/20 text-white sm:bg-slate-100 sm:text-slate-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {currentUser.savedBookIds.length}
            </span>
          </button>

          <button
            id="tab-borrowed-books"
            type="button"
            onClick={() => setActiveTab('borrows')}
            className={`rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap sm:rounded-none sm:pb-3 sm:pt-0 sm:text-sm sm:border-b-2 ${
              activeTab === 'borrows'
                ? 'bg-blue-700 text-white sm:bg-transparent sm:border-blue-700 sm:text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:border-transparent sm:hover:bg-transparent'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="sm:hidden">Loans</span>
            <span className="hidden sm:inline">Active & Past Loans</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'borrows' ? 'bg-white/20 text-white sm:bg-slate-100 sm:text-slate-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {currentUser.borrowedBooks.length}
            </span>
          </button>

          <button
            id="tab-holds-books"
            type="button"
            onClick={() => setActiveTab('holds')}
            className={`rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap sm:rounded-none sm:pb-3 sm:pt-0 sm:text-sm sm:border-b-2 ${
              activeTab === 'holds'
                ? 'bg-blue-700 text-white sm:bg-transparent sm:border-blue-700 sm:text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:border-transparent sm:hover:bg-transparent'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>Reservations</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'holds' ? 'bg-white/20 text-white sm:bg-slate-100 sm:text-slate-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {currentUser.reservations?.filter((r) => r.status === 'waiting' || r.status === 'ready').length || 0}
            </span>
          </button>

          <button
            id="tab-reading-history"
            type="button"
            onClick={() => setActiveTab('history')}
            className={`rounded-xl px-3 py-2 text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap sm:rounded-none sm:pb-3 sm:pt-0 sm:text-sm sm:border-b-2 ${
              activeTab === 'history'
                ? 'bg-blue-700 text-white sm:bg-transparent sm:border-blue-700 sm:text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 sm:border-transparent sm:hover:bg-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="sm:hidden">History</span>
            <span className="hidden sm:inline">Digital Reading History</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'history' ? 'bg-white/20 text-white sm:bg-slate-100 sm:text-slate-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {currentUser.readingHistory.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Saved Reading List */}
      {activeTab === 'saved' && (
        <div>
          {savedBooks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-md mx-auto">
              <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-slate-800">Your Reading List is Empty</h3>
              <p className="text-xs text-slate-500 mt-1">
                Browse our collection and bookmark books to save them to your profile.
              </p>
              <button
                type="button"
                onClick={() => navigate('/books')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-xl hover:bg-blue-800 transition-colors"
              >
                <span>Browse Catalogue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="flex gap-4">
                    <div className="w-20 shrink-0">
                      <BookCover
                        src={book.cover}
                        title={book.title}
                        author={book.author}
                        category={book.category}
                        coverColor={book.coverColor}
                        size="sm"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        {book.category}
                      </span>
                      <h4
                        onClick={() => navigate(`/book/${book.id}`)}
                        className="font-serif font-bold text-slate-900 text-sm mt-1.5 truncate cursor-pointer hover:text-blue-700 transition-colors"
                        title={book.title}
                      >
                        {book.title}
                      </h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{book.author}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {book.year} &bull; {book.pages} pages
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {book.hasDigitalVersion ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/read/${book.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(`/book/${book.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                      >
                        <span>Details</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveBookmark(book.id)}
                      className="text-xs text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1 p-1"
                      title="Remove from saved books"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active & Past Loans */}
      {activeTab === 'borrows' && (
        <div className="space-y-6">
          {currentUser.borrowedBooks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-md mx-auto">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-slate-800">No Active Borrowed Titles</h3>
              <p className="text-xs text-slate-500 mt-1">
                You can reserve or borrow digital titles directly from our book detail pages.
              </p>
              <button
                type="button"
                onClick={() => navigate('/books')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-xl hover:bg-blue-800 transition-colors"
              >
                <span>Find Books to Borrow</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {currentUser.borrowedBooks.map((record, idx) => {
                const book = borrowedBookMap[record.bookId];
                const isOverdue = !record.isReturned && (
                  record.status === 'overdue' ||
                  Boolean(record.dueDate && (() => {
                    const due = new Date(record.dueDate.length === 10 ? record.dueDate + 'T23:59:59.999Z' : record.dueDate);
                    return !Number.isNaN(due.getTime()) && Date.now() > due.getTime();
                  })())
                );

                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      record.isReturned
                        ? 'border-slate-200/60 bg-slate-50/40 opacity-75'
                        : isOverdue
                        ? 'border-rose-300 ring-1 ring-rose-200 shadow-xs'
                        : 'border-blue-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {book && (
                        <div className="w-14 shrink-0">
                          <BookCover
                            src={book.cover}
                            title={book.title}
                            author={book.author}
                            category={book.category}
                            coverColor={book.coverColor}
                            size="sm"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              record.isReturned
                                ? 'bg-slate-100 text-slate-600'
                                : isOverdue
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {record.isReturned ? 'Returned' : isOverdue ? 'Overdue' : 'Active Loan'}
                          </span>
                          <span className="text-xs text-slate-400">
                            Borrowed on {record.borrowedAt}
                          </span>
                        </div>

                        <h4
                          onClick={() => navigate(`/book/${record.bookId}`)}
                          className="font-serif font-bold text-slate-900 text-base mt-1 cursor-pointer hover:text-blue-700 transition-colors"
                        >
                          {book ? book.title : `Book #${record.bookId}`}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {book ? book.author : 'Community Collection'}
                        </p>

                        {!record.isReturned && (
                          <p className={`text-xs font-semibold mt-2 flex items-center gap-1.5 ${
                            isOverdue ? 'text-rose-700 font-bold' : 'text-amber-700'
                          }`}>
                            {isOverdue ? <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> : <Clock className="w-3.5 h-3.5" />}
                            <span>Due Date: {record.dueDate}{isOverdue ? ' (Overdue)' : ''}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!record.isReturned ? (
                        <button
                          type="button"
                          onClick={() => handleReturnBook(record.id || record.bookId)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Mark as Returned</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Returned to collection</span>
                      )}

                      <button
                        type="button"
                        onClick={() => navigate(`/book/${record.bookId}`)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
                        title="View Book"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Digital Reading History */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {currentUser.readingHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-md mx-auto">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-slate-800">No Digital Reading Activity</h3>
              <p className="text-xs text-slate-500 mt-1">
                Open any book marked with &quot;Digital Edition&quot; in our digital reader to begin tracking your progress.
              </p>
              <button
                type="button"
                onClick={() => navigate('/books?availability=digital')}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-xs font-semibold rounded-xl hover:bg-blue-800 transition-colors"
              >
                <span>Read Digital Volumes</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentUser.readingHistory.map((rec, idx) => {
                const book = historyBookMap[rec.bookId];
                return (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {book && (
                        <div className="w-12 shrink-0">
                          <BookCover
                            src={book.cover}
                            title={book.title}
                            author={book.author}
                            category={book.category}
                            coverColor={book.coverColor}
                            size="sm"
                          />
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-medium">
                          Last read {rec.lastReadAt}
                        </span>
                        <h4
                          onClick={() => navigate(`/book/${rec.bookId}`)}
                          className="font-serif font-bold text-slate-900 text-sm truncate cursor-pointer hover:text-blue-700 transition-colors mt-0.5"
                        >
                          {book ? book.title : `Book #${rec.bookId}`}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">
                          {book ? book.author : ''}
                        </p>

                        {/* Progress meter */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${rec.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600">
                            {rec.progressPercent}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/read/${rec.bookId}`)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Holds & Reservations */}
      {activeTab === 'holds' && (
        <div>
          {(!currentUser.reservations || currentUser.reservations.length === 0) ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
                <BookmarkCheck className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-lg">
                No Active Reservations
              </h3>
              <p className="text-slate-600 text-sm mt-2 leading-relaxed">
                When a digital book is currently borrowed, you can place a reservation to reserve your place in line.
              </p>
              <button
                type="button"
                onClick={() => navigate('/books')}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Browse Library Collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {currentUser.reservations.map((rec) => {
                const book = borrowedBookMap[rec.bookId];
                const isReady = rec.status === 'ready';
                const isWaiting = rec.status === 'waiting';
                const isFulfilled = rec.status === 'fulfilled';
                const isCancelled = rec.status === 'cancelled';

                return (
                  <div
                    key={rec.id}
                    className={`bg-white rounded-2xl border p-5 sm:p-6 transition-shadow shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 ${
                      isReady
                        ? 'border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/20'
                        : isWaiting
                        ? 'border-amber-200 bg-white'
                        : 'border-slate-200/80 bg-slate-50/50 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {book && (
                        <div
                          onClick={() => navigate(`/book/${book.id}`)}
                          className="w-14 sm:w-16 shrink-0 cursor-pointer"
                        >
                          <BookCover
                            src={book.cover}
                            title={book.title}
                            author={book.author}
                            category={book.category}
                            coverColor={book.coverColor}
                            size="sm"
                          />
                        </div>
                      )}
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {isReady && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                              Your reservation is ready!
                            </span>
                          )}
                          {isWaiting && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300">
                              Reservation active • Queue #{rec.queuePosition || 1}
                            </span>
                          )}
                          {isFulfilled && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200">
                              Fulfilled & Borrowed
                            </span>
                          )}
                          {isCancelled && (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-200 text-slate-700">
                              Cancelled
                            </span>
                          )}

                          <span className="text-xs text-slate-400">
                            Reserved on {rec.reservedAt ? new Date(rec.reservedAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>

                        <h4
                          onClick={() => navigate(`/book/${rec.bookId}`)}
                          className="font-serif font-bold text-slate-900 text-base mt-1.5 cursor-pointer hover:text-blue-700 transition-colors"
                        >
                          {book ? book.title : `Book #${rec.bookId}`}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {book ? book.author : 'Community Collection'}
                        </p>

                        {isReady && (
                          <div className="mt-2 space-y-1.5">
                            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Your reservation is ready! You are next in line.</span>
                            </p>
                            <ClaimCountdown expiresAt={rec.expiresAt} />
                          </div>
                        )}
                        {isWaiting && (
                          <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>
                              You are #{rec.queuePosition || 1} in the queue ({Math.max(0, (rec.queuePosition || 1) - 1)} {Math.max(0, (rec.queuePosition || 1) - 1) === 1 ? 'member' : 'members'} ahead of you).
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                      {isReady && (
                        <button
                          type="button"
                          onClick={() => handleBorrowReserved(rec.bookId)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
                        >
                          <IdCard className="w-3.5 h-3.5" />
                          <span>Borrow Reserved Copy</span>
                        </button>
                      )}

                      {(isWaiting || isReady) && (
                        <button
                          type="button"
                          onClick={() => handleCancelReservation(rec.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel Reservation</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => navigate(`/book/${rec.bookId}`)}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
                        title="View Book"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
