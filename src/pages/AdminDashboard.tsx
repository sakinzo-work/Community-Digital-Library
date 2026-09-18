/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FolderPlus,
  Users,
  Clock,
  Trash2,
  Edit2,
  Plus,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  FileText,
  Star,
  Loader2,
  BookmarkCheck,
  XCircle,
  Copy,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BookService, CategoryService } from '../services/bookService';
import { apiRequest } from '../services/apiClient';
import { Book, CategoryInfo, LibraryStats, BorrowRecord, ReservationRecord } from '../types';
import { BackupRestorePanel } from '../components/admin/BackupRestorePanel';

export const AdminDashboard: React.FC = () => {
  const { currentUser, isAdmin, token } = useAuth();

  const [activeTab, setActiveTab] = useState<'stats' | 'books' | 'categories' | 'borrowings' | 'reservations' | 'holds' | 'users' | 'backup'>('stats');
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [borrowings, setBorrowings] = useState<BorrowRecord[]>([]);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search and filter state for Admin Reservations table
  const [reservationSearchQuery, setReservationSearchQuery] = useState('');
  const [reservationStatusFilter, setReservationStatusFilter] = useState<'all' | 'waiting' | 'ready' | 'fulfilled' | 'cancelled'>('all');
  const [copiedReservationId, setCopiedReservationId] = useState<string | null>(null);

  // Modal / Form state for Add/Edit Book
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [bookFormData, setBookFormData] = useState<{
    title: string;
    author: string;
    categoryId: string;
    description: string;
    publicationYear: number;
    pages: number;
    language: string;
    isbn: string;
    coverPath: string;
    pdfPath: string | null;
    isAvailable: boolean;
    publisher: string;
    featured: boolean;
  }>({
    title: '',
    author: '',
    categoryId: '',
    description: '',
    publicationYear: new Date().getFullYear(),
    pages: 250,
    language: 'English',
    isbn: '',
    coverPath: '',
    pdfPath: '',
    isAvailable: true,
    publisher: '',
    featured: false
  });

  // Uploading state
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);

  // Category Modal and Form state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);

  // Search filter inside admin books table
  const [bookSearchQuery, setBookSearchQuery] = useState('');

  // Load all admin data from SQLite API
  const loadData = async () => {
    if (!isAdmin || !token) return;
    setIsLoading(true);
    try {
      const [statsData, booksData, catsData, borrowingsData, reservationsData] = await Promise.all([
        BookService.getAdminStats(),
        BookService.getBooks(),
        BookService.getCategories(),
        BookService.getBorrowings(true),
        BookService.getReservations(true)
      ]);

      setStats(statsData);
      setBooks(booksData);
      setCategories(catsData);
      setBorrowings(borrowingsData);
      setReservations(reservationsData);

      // Load registered users from /api/users
      try {
        const uData = await apiRequest<{ users: any[] }>('/api/users');
        setUsersList(uData.users || []);
      } catch (userErr) {
        console.warn('Could not load users list:', userErr);
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      setActionMessage({ type: 'error', text: 'Error connecting to SQLite backend database' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, token]);

  // Flash message helper
  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Guard against non-admins
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex p-4 rounded-full bg-red-50 text-red-600 mb-4">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Administrator Access Required</h1>
        <p className="text-stone-600 mb-6 max-w-md mx-auto">
          The administrative control panel is restricted to authorized librarians and staff members.
          Please sign in with an administrator account to continue.
        </p>
      </div>
    );
  }

  // Handle Cover Upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    const result = await BookService.uploadCover(file);
    setIsUploadingCover(false);
    if (result.success && result.url) {
      setBookFormData((prev) => ({ ...prev, coverPath: result.url! }));
      showMessage('success', 'Cover image uploaded and stored on server');
    } else {
      showMessage('error', result.error || 'Failed to upload cover image');
    }
  };

  // Handle PDF Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPdf(true);
    const result = await BookService.uploadPdf(file);
    setIsUploadingPdf(false);
    if (result.success && result.url) {
      setBookFormData((prev) => ({ ...prev, pdfPath: result.url! }));
      showMessage('success', 'PDF document uploaded and stored on server');
    } else {
      showMessage('error', result.error || 'Failed to upload PDF');
    }
    e.target.value = '';
  };

  // Handle Book Form Submit (Create or Update)
  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookFormData.title || !bookFormData.author || !bookFormData.categoryId) {
      showMessage('error', 'Title, author, and category are required');
      return;
    }

    const payload = {
      ...bookFormData,
      pdfPath: bookFormData.pdfPath && bookFormData.pdfPath.trim() !== '' ? bookFormData.pdfPath.trim() : null
    };

    if (editingBookId) {
      const res = await BookService.updateBook(editingBookId, payload);
      if (res.success) {
        showMessage('success', 'Book updated in SQLite database');
        setIsBookModalOpen(false);
        loadData();
      } else {
        showMessage('error', res.error || 'Failed to update book');
      }
    } else {
      const res = await BookService.createBook(payload);
      if (res.success) {
        showMessage('success', 'New book added to library database');
        setIsBookModalOpen(false);
        loadData();
      } else {
        showMessage('error', res.error || 'Failed to create book');
      }
    }
  };

  // Delete Book
  const handleDeleteBook = async (id: string, title: string) => {
    try {
      setDeletingBookId(id);
      const res = await BookService.deleteBook(id);
      if (res.success) {
        showMessage('success', `"${title}" removed from database`);
        await loadData();
      } else {
        showMessage('error', res.error || 'Failed to delete book');
      }
    } catch (err: any) {
      showMessage('error', err?.message || 'Failed to delete book');
    } finally {
      setDeletingBookId(null);
    }
  };

  // Open Edit Modal
  const openEditBookModal = (b: Book) => {
    setEditingBookId(b.id);
    setBookFormData({
      title: b.title,
      author: b.author,
      categoryId: b.categoryId || categories.find((c) => c.name.toLowerCase() === b.category.toLowerCase())?.id || '',
      description: b.description || '',
      publicationYear: b.year || 2024,
      pages: b.pages || 200,
      language: b.language || 'English',
      isbn: b.isbn || '',
      coverPath: b.coverUrl || b.cover || '',
      pdfPath: b.pdfPath || '',
      isAvailable: b.available,
      publisher: b.publisher || '',
      featured: b.featured || false
    });
    setIsBookModalOpen(true);
  };

  // Open Create Modal
  const openCreateBookModal = () => {
    setEditingBookId(null);
    setBookFormData({
      title: '',
      author: '',
      categoryId: categories[0]?.id || '',
      description: '',
      publicationYear: new Date().getFullYear(),
      pages: 250,
      language: 'English',
      isbn: '',
      coverPath: '',
      pdfPath: '',
      isAvailable: true,
      publisher: '',
      featured: false
    });
    setIsBookModalOpen(true);
  };

  // Open Create Category Modal
  const openCreateCategoryModal = () => {
    setEditingCategoryId(null);
    setNewCatName('');
    setNewCatDesc('');
    setIsCategoryModalOpen(true);
  };

  // Open Edit Category Modal
  const openEditCategoryModal = (c: CategoryInfo) => {
    setEditingCategoryId(c.id);
    setNewCatName(c.name);
    setNewCatDesc(c.description || '');
    setIsCategoryModalOpen(true);
  };

  // Save Category Handler (Add or Edit)
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showMessage('error', 'Category name is required');
      return;
    }

    try {
      setIsSavingCategory(true);
      if (editingCategoryId) {
        const res = await CategoryService.updateCategory(editingCategoryId, {
          name: newCatName.trim(),
          description: newCatDesc.trim()
        });

        if (res.success) {
          showMessage('success', `Category "${newCatName.trim()}" updated successfully`);
          setNewCatName('');
          setNewCatDesc('');
          setEditingCategoryId(null);
          setIsCategoryModalOpen(false);
          await loadData();
        } else {
          showMessage('error', res.error || 'Failed to update category');
        }
      } else {
        const res = await CategoryService.createCategory({
          name: newCatName.trim(),
          description: newCatDesc.trim() || undefined
        });

        if (res.success) {
          showMessage('success', `Category "${newCatName.trim()}" created successfully`);
          setNewCatName('');
          setNewCatDesc('');
          setIsCategoryModalOpen(false);
          await loadData();
        } else {
          showMessage('error', res.error || 'Failed to create category');
        }
      }
    } catch (err: any) {
      showMessage('error', err?.message || 'Network error saving category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Delete Category Handler
  const handleDeleteCategory = async (catId: string, catName: string) => {
    try {
      setDeletingCatId(catId);
      const res = await CategoryService.deleteCategory(catId);
      if (res.success) {
        showMessage('success', `Category "${catName}" deleted`);
        await loadData();
      } else {
        showMessage('error', res.error || 'Failed to delete category');
      }
    } catch (err: any) {
      showMessage('error', err?.message || 'Network error deleting category');
    } finally {
      setDeletingCatId(null);
    }
  };

  // Return Borrowed Book as Admin
  const handleAdminReturnBook = async (borrowingId: string) => {
    const res = await BookService.returnBook(borrowingId);
    if (res.success) {
      showMessage('success', 'Book marked as returned and collection stock restored');
      loadData();
    } else {
      showMessage('error', res.message);
    }
  };

  // Cancel Hold / Reservation as Admin
  const handleAdminCancelReservation = async (reservationId: string) => {
    try {
      const res = await BookService.cancelReservation(reservationId);
      if (res.success) {
        showMessage('success', res.message);
        loadData();
      } else {
        showMessage('error', res.message);
      }
    } catch (err: any) {
      showMessage('error', err.message || 'Failed to cancel reservation');
    }
  };

  // Filter books in admin table
  const filteredBooks = books.filter(
    (b) =>
      b.title.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
      b.isbn.toLowerCase().includes(bookSearchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              SQLite Database Active
            </span>
            <span className="text-xs text-slate-500">Logged in as {currentUser?.name} (Administrator)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-serif">
            Librarian Administration Console
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Real-time management for books, categories, patrons, loans, and digital files in SQLite.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={openCreateBookModal}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Add Book
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {actionMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm shadow-xs ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('stats')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'stats'
              ? 'border-blue-700 text-blue-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Statistics
        </button>
        <button
          onClick={() => setActiveTab('books')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'books'
              ? 'border-blue-700 text-blue-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Books ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'categories'
              ? 'border-blue-700 text-blue-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('borrowings')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'borrowings'
              ? 'border-blue-700 text-blue-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Borrowings ({borrowings.length})
        </button>
        <button
          id="admin-tab-reservations"
          onClick={() => setActiveTab('reservations')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'reservations' || activeTab === 'holds'
              ? 'border-blue-700 text-blue-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookmarkCheck className="w-4 h-4" />
          Reservations ({reservations.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'users'
              ? 'border-blue-700 text-blue-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Patrons & Users ({usersList.length})
        </button>
        <button
          id="admin-tab-backup"
          onClick={() => setActiveTab('backup')}
          className={`pb-3 text-sm font-medium flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
            activeTab === 'backup'
              ? 'border-blue-700 text-blue-800 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Backup & Restore
        </button>
      </div>

      {/* Tab 1: Stats Overview */}
      {activeTab === 'stats' && stats && (
        <div className="py-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Catalog</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 font-serif">{stats.totalBooks}</p>
              <p className="text-xs text-slate-500 mt-1">{stats.availableBooks} titles available for loan</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Loans</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 font-serif">{stats.activeBorrowings}</p>
              <p className="text-xs text-slate-500 mt-1">{stats.totalBorrowings} total historical checkouts</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Registered Patrons</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 font-serif">{stats.totalUsers}</p>
              <p className="text-xs text-slate-500 mt-1">Community library members</p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Subject Categories</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 font-serif">{stats.categoriesCount}</p>
              <p className="text-xs text-slate-500 mt-1">Curated shelves in SQLite</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-blue-700" />
                Category Distribution
              </h3>
              <div className="space-y-2">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b border-slate-100">
                    <span className="text-slate-700">{c.name}</span>
                    <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">{c.bookCount} books</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                System Health & Database
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Primary Storage Engine:</span>
                  <span className="font-mono text-xs font-semibold text-emerald-700">SQLite3 (`database/library.sqlite3`)</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Server Uploads:</span>
                  <span className="font-mono text-xs text-slate-800">`/uploads/covers` & `/uploads/pdfs`</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span>Authentication Engine:</span>
                  <span className="text-xs font-medium text-slate-800">JWT + Bcrypt (SQLite user roles)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Librarian Role:</span>
                  <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Active & Authorized</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Books Management */}
      {activeTab === 'books' && (
        <div className="py-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                placeholder="Filter by title, author, or ISBN..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>
            <button
              onClick={openCreateBookModal}
              className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Add Book
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Book</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Digital PDF</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Featured</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredBooks.map((b) => (
                    <tr key={b.id} className="hover:bg-stone-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {b.coverUrl || b.cover ? (
                            <img
                              src={b.coverUrl || b.cover}
                              alt=""
                              className="w-10 h-14 object-cover rounded shadow-xs border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-stone-100 rounded shadow-xs border border-stone-200 shrink-0 flex items-center justify-center text-stone-400">
                              <BookOpen className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-stone-900 line-clamp-1">{b.title}</p>
                            <p className="text-xs text-stone-500">{b.author} ({b.year || 'N/A'})</p>
                            <p className="text-xs text-stone-400 font-mono">ISBN: {b.isbn || 'None'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 text-xs rounded-full bg-stone-100 text-stone-800 font-medium">
                          {b.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {b.pdfPath ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <FileText className="w-3.5 h-3.5" />
                            PDF Available
                          </span>
                        ) : (
                          <span className="text-stone-400">Catalogue Only</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {b.available ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">
                            Available
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-800 rounded-full">
                            Borrowed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {b.featured ? (
                          <span className="text-amber-600 flex items-center gap-1 text-xs font-medium">
                            <Star className="w-3.5 h-3.5 fill-amber-500" /> Yes
                          </span>
                        ) : (
                          <span className="text-stone-400 text-xs">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditBookModal(b)}
                            className="p-1.5 text-stone-600 hover:text-amber-800 rounded hover:bg-stone-100 transition cursor-pointer"
                            title="Edit Book"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(b.id, b.title)}
                            disabled={deletingBookId === b.id}
                            className="p-1.5 text-stone-600 hover:text-red-700 rounded hover:bg-stone-100 transition disabled:opacity-50 cursor-pointer"
                            title="Delete Book"
                          >
                            {deletingBookId === b.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Categories Management */}
      {activeTab === 'categories' && (
        <div className="py-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <div>
              <h3 className="text-lg font-semibold text-stone-900">Categories Management</h3>
              <p className="text-xs text-stone-500">
                Manage digital library classifications, genres, and shelf disciplines in SQLite.
              </p>
            </div>
            <button
              id="admin-add-category-btn"
              data-testid="add-category-button"
              type="button"
              onClick={openCreateCategoryModal}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Add Category
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200 flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-stone-900">Current Categories in SQLite</h4>
                <p className="text-xs text-stone-500">{categories.length} total categories registered</p>
              </div>
            </div>
            {categories.length === 0 ? (
              <div className="p-12 text-center text-stone-500 text-sm flex flex-col items-center gap-3">
                <p>No categories found in SQLite database.</p>
                <button
                  type="button"
                  onClick={openCreateCategoryModal}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  + Add Category
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {categories.map((c) => (
                  <div key={c.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition">
                    <div className="pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-stone-900">{c.name}</h4>
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 rounded-full">
                          {c.bookCount} {c.bookCount === 1 ? 'book' : 'books'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-1">{c.description || 'No description provided'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditCategoryModal(c)}
                        className="p-1.5 text-stone-500 hover:text-amber-800 rounded hover:bg-stone-100 transition cursor-pointer"
                        title="Edit Category"
                        aria-label={`Edit ${c.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        disabled={deletingCatId === c.id}
                        className="p-1.5 text-stone-500 hover:text-red-700 rounded hover:bg-stone-100 transition disabled:opacity-40 cursor-pointer"
                        title={c.bookCount > 0 ? `Cannot delete: ${c.bookCount} books assigned` : "Delete Category"}
                        aria-label={`Delete ${c.name}`}
                      >
                        {deletingCatId === c.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Borrowings Management */}
      {activeTab === 'borrowings' && (
        <div className="py-6 space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200">
              <h3 className="font-semibold text-stone-900">All Library Borrowing Transactions</h3>
              <p className="text-xs text-stone-500">Live records from the SQLite `borrowings` table</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-700">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Book</th>
                    <th className="px-4 py-3">Patron</th>
                    <th className="px-4 py-3">Borrow Date</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {borrowings.map((br) => (
                    <tr key={br.id} className="hover:bg-stone-50 transition">
                      <td className="px-4 py-3 font-medium text-stone-900">{br.bookTitle}</td>
                      <td className="px-4 py-3 text-stone-600 font-mono text-xs">Loan #{br.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-stone-500 text-xs">{br.borrowedAt}</td>
                      <td className="px-4 py-3 text-stone-500 text-xs">{br.dueDate}</td>
                      <td className="px-4 py-3">
                        {br.status === 'borrowed' ? (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-800 rounded-full">
                            Active Loan
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full">
                            Returned ({br.returnedAt ? new Date(br.returnedAt).toLocaleDateString() : 'Yes'})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {br.status === 'borrowed' && (
                          <button
                            onClick={() => handleAdminReturnBook(br.id)}
                            className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium rounded transition cursor-pointer"
                          >
                            Mark Returned
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Users & Patrons */}
      {activeTab === 'users' && (
        <div className="py-6 space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-stone-900">Registered Library Patrons</h3>
                <p className="text-xs text-stone-500">Live community library member accounts from the SQLite `users` table</p>
              </div>
              <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                {usersList.length} Patron{usersList.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-700">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Patron Name</th>
                    <th className="px-4 py-3">Email Address</th>
                    <th className="px-4 py-3">Library Card</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Card Type</th>
                    <th className="px-4 py-3">Total Loans</th>
                    <th className="px-4 py-3">Bookmarks</th>
                    <th className="px-4 py-3">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {usersList.map((u) => {
                    const patronName = u.name || u.fullName || u.full_name || '—';
                    const libraryCard = u.library_card_number || u.libraryCardNumber || '—';
                    const memberType = u.membership_type || u.membershipType || 'Resident';
                    const totalLoans = u.total_borrowings ?? u.totalBorrowings ?? 0;
                    const totalBookmarks = u.total_bookmarks ?? u.totalBookmarks ?? 0;
                    const regDate = u.created_at || u.createdAt;

                    return (
                      <tr key={u.id} className="hover:bg-stone-50 transition">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-stone-900">{patronName}</p>
                          {u.phone && <p className="text-[11px] text-stone-400">{u.phone}</p>}
                        </td>
                        <td className="px-4 py-3 text-stone-600 font-mono text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 font-mono text-xs rounded bg-stone-100 border border-stone-200 text-stone-700 select-all">
                            {libraryCard}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-900 border border-purple-300'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-stone-600">{memberType}</td>
                        <td className="px-4 py-3 font-semibold text-stone-900">{totalLoans}</td>
                        <td className="px-4 py-3 text-stone-600">{totalBookmarks}</td>
                        <td className="px-4 py-3 text-xs text-stone-500">
                          {regDate ? new Date(regDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Admin Reservations Section */}
      {(activeTab === 'reservations' || activeTab === 'holds') && (
        <div id="admin-reservations-section" className="py-6 space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                Active Waiting
              </span>
              <p className="text-2xl font-bold text-amber-700 font-serif">
                {reservations.filter((r) => r.status === 'waiting').length}
              </p>
              <p className="text-xs text-stone-500 mt-1">Patrons in queue awaiting returned copies</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                Ready to Borrow
              </span>
              <p className="text-2xl font-bold text-emerald-700 font-serif">
                {reservations.filter((r) => r.status === 'ready').length}
              </p>
              <p className="text-xs text-stone-500 mt-1">Reservations ready for the next member to borrow</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                Fulfilled Holds
              </span>
              <p className="text-2xl font-bold text-blue-700 font-serif">
                {reservations.filter((r) => r.status === 'fulfilled').length}
              </p>
              <p className="text-xs text-stone-500 mt-1">Holds converted to active borrowings</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block mb-1">
                Total Reservations
              </span>
              <p className="text-2xl font-bold text-stone-800 font-serif">
                {reservations.length}
              </p>
              <p className="text-xs text-stone-500 mt-1">Total SQLite reservation history records</p>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-base flex items-center gap-2">
                  <BookmarkCheck className="w-5 h-5 text-amber-700" />
                  Admin Reservations Management
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Complete hold records, queue positions, member assignments, and lifecycle status from SQLite.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadData}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Refresh reservations from database"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync</span>
                </button>
                <span className="text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full">
                  {reservations.length} Record{reservations.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 bg-stone-50/70 border-b border-stone-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reservationSearchQuery}
                  onChange={(e) => setReservationSearchQuery(e.target.value)}
                  placeholder="Search by ID, member, book title, or email..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-amber-700"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1 sm:pb-0">
                {(['all', 'waiting', 'ready', 'fulfilled', 'cancelled'] as const).map((st) => {
                  const count = st === 'all'
                    ? reservations.length
                    : reservations.filter((r) => r.status === st).length;

                  const labels: Record<string, string> = {
                    all: 'All',
                    waiting: 'Waiting',
                    ready: 'Ready to Borrow',
                    fulfilled: 'Fulfilled',
                    cancelled: 'Cancelled'
                  };

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setReservationStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                        reservationStatusFilter === st
                          ? 'bg-amber-700 text-white shadow-xs'
                          : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {labels[st]} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            {reservations.length === 0 ? (
              <div className="p-12 text-center text-stone-500">
                <BookmarkCheck className="w-10 h-10 mx-auto text-stone-300 mb-3" />
                <p className="font-semibold text-stone-700">No Reservations in System</p>
                <p className="text-xs mt-1">When library patrons reserve checked-out titles, records will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-stone-700">
                  <thead className="bg-stone-50 text-xs uppercase font-semibold text-stone-500 border-b border-stone-200">
                    <tr>
                      <th className="px-4 py-3">Reservation ID</th>
                      <th className="px-4 py-3">Member (Name / Email)</th>
                      <th className="px-4 py-3">Book Title</th>
                      <th className="px-4 py-3">Reserved Date</th>
                      <th className="px-4 py-3">Queue Position</th>
                      <th className="px-4 py-3">Claim Window</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {reservations
                      .filter((r) => {
                        if (reservationStatusFilter !== 'all' && r.status !== reservationStatusFilter) {
                          return false;
                        }
                        if (reservationSearchQuery.trim()) {
                          const q = reservationSearchQuery.toLowerCase();
                          const idMatch = (r.id || '').toLowerCase().includes(q);
                          const titleMatch = (r.bookTitle || r.book_title || '').toLowerCase().includes(q);
                          const authorMatch = (r.bookAuthor || r.book_author || '').toLowerCase().includes(q);
                          const nameMatch = (r.userName || r.user_name || '').toLowerCase().includes(q);
                          const emailMatch = (r.userEmail || r.user_email || '').toLowerCase().includes(q);
                          const cardMatch = (r.libraryCardNumber || r.library_card_number || '').toLowerCase().includes(q);
                          return idMatch || titleMatch || authorMatch || nameMatch || emailMatch || cardMatch;
                        }
                        return true;
                      })
                      .map((r) => {
                        const isReady = r.status === 'ready';
                        const isWaiting = r.status === 'waiting';
                        const isFulfilled = r.status === 'fulfilled';
                        const isCancelled = r.status === 'cancelled';

                        return (
                          <tr key={r.id} className="hover:bg-stone-50/80 transition-colors">
                            {/* 1. Reservation ID */}
                            <td className="px-4 py-3 font-mono text-xs">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-800 text-[11px] font-mono select-all">
                                  {r.id}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(r.id);
                                    setCopiedReservationId(r.id);
                                    setTimeout(() => setCopiedReservationId(null), 1500);
                                  }}
                                  title="Copy Reservation ID"
                                  className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition cursor-pointer"
                                >
                                  {copiedReservationId === r.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>

                            {/* 2. Member (Name / Email) */}
                            <td className="px-4 py-3">
                              <p className="font-semibold text-stone-900">{r.userName || r.user_name || 'Member'}</p>
                              <p className="text-xs text-stone-500">{r.userEmail || r.user_email || '—'}</p>
                              {(r.libraryCardNumber || r.library_card_number) && (
                                <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded text-[10px] font-mono">
                                  Card #{r.libraryCardNumber || r.library_card_number}
                                </span>
                              )}
                            </td>

                            {/* 3. Book Title */}
                            <td className="px-4 py-3">
                              <p className="font-semibold text-stone-900">{r.bookTitle || r.book_title || `Book #${r.bookId}`}</p>
                              <p className="text-xs text-stone-500">{r.bookAuthor || r.book_author || 'Community Library Collection'}</p>
                            </td>

                            {/* 4. Reserved Date */}
                            <td className="px-4 py-3 text-xs text-stone-600 whitespace-nowrap">
                              {r.reservedAt ? (
                                <div>
                                  <p className="font-medium text-stone-800">
                                    {new Date(r.reservedAt).toLocaleDateString(undefined, {
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </p>
                                  <p className="text-[11px] text-stone-400">
                                    {new Date(r.reservedAt).toLocaleTimeString(undefined, {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              ) : (
                                '—'
                              )}
                            </td>

                            {/* 5. Queue Position */}
                            <td className="px-4 py-3 font-medium text-stone-800">
                              {isReady ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  #1 (Ready to Borrow)
                                </span>
                              ) : isWaiting ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                                  #{r.queuePosition} in Line
                                </span>
                              ) : isFulfilled ? (
                                <span className="text-xs text-stone-400">Fulfilled</span>
                              ) : (
                                <span className="text-xs text-stone-400">—</span>
                              )}
                            </td>

                            {/* 5.5 Claim Window */}
                            <td className="px-4 py-3 text-xs">
                              {isReady ? (
                                r.expiresAt ? (
                                  <div>
                                    <span className="font-mono text-emerald-800 font-semibold block">
                                      Expires: {new Date(r.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-[11px] text-stone-500">
                                      {new Date(r.expiresAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-stone-500 italic">24 Hours Active</span>
                                )
                              ) : (
                                <span className="text-stone-400">—</span>
                              )}
                            </td>

                            {/* 6. Status */}
                            <td className="px-4 py-3 whitespace-nowrap">
                              {isWaiting && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
                                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                                  Waiting
                                </span>
                              )}
                              {isReady && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                  Ready to Borrow
                                </span>
                              )}
                              {isFulfilled && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                                  Fulfilled
                                </span>
                              )}
                              {isCancelled && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-300">
                                  <XCircle className="w-3.5 h-3.5 text-stone-500" />
                                  Cancelled
                                </span>
                              )}
                            </td>

                            {/* 7. Actions */}
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              {(isWaiting || isReady) && (
                                <button
                                  type="button"
                                  onClick={() => handleAdminCancelReservation(r.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Cancel hold on behalf of patron"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Cancel Hold</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 8: Backup & Restore */}
      {activeTab === 'backup' && (
        <BackupRestorePanel onRestoreSuccess={loadData} />
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div
          id="add-category-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl p-6 border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h2 className="text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-700" />
                {editingCategoryId ? 'Edit Category' : '+ Add Category'}
              </h2>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-2xl font-light leading-none cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label htmlFor="category-name-input" className="block text-stone-700 font-medium text-sm mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="category-name-input"
                  name="name"
                  type="text"
                  required
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g., Philosophy & Ethics, Art & Architecture"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="category-desc-input" className="block text-stone-700 font-medium text-sm mb-1">
                  Description <span className="text-xs text-stone-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  id="category-desc-input"
                  name="description"
                  rows={3}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of this genre or discipline..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 font-medium text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory || !newCatName.trim()}
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-medium text-sm shadow-sm transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSavingCategory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingCategoryId ? 'Updating...' : 'Saving...'}
                    </>
                  ) : editingCategoryId ? (
                    'Save Changes'
                  ) : (
                    '+ Add Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Book Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl p-6 border border-stone-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-4">
              <h2 className="text-xl font-bold text-stone-900 font-serif">
                {editingBookId ? 'Edit Book in SQLite' : 'Add New Book to SQLite'}
              </h2>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-2xl font-light cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Book Title *</label>
                  <input
                    type="text"
                    required
                    value={bookFormData.title}
                    onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Author *</label>
                  <input
                    type="text"
                    required
                    value={bookFormData.author}
                    onChange={(e) => setBookFormData({ ...bookFormData, author: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Category *</label>
                  <select
                    required
                    value={bookFormData.categoryId}
                    onChange={(e) => setBookFormData({ ...bookFormData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600 bg-white"
                  >
                    <option value="">Select a Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">ISBN</label>
                  <input
                    type="text"
                    value={bookFormData.isbn}
                    onChange={(e) => setBookFormData({ ...bookFormData, isbn: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Description</label>
                <textarea
                  rows={3}
                  value={bookFormData.description}
                  onChange={(e) => setBookFormData({ ...bookFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Year</label>
                  <input
                    type="number"
                    value={bookFormData.publicationYear}
                    onChange={(e) => setBookFormData({ ...bookFormData, publicationYear: parseInt(e.target.value, 10) || 2024 })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Pages</label>
                  <input
                    type="number"
                    value={bookFormData.pages}
                    onChange={(e) => setBookFormData({ ...bookFormData, pages: parseInt(e.target.value, 10) || 100 })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Language</label>
                  <input
                    type="text"
                    value={bookFormData.language}
                    onChange={(e) => setBookFormData({ ...bookFormData, language: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-600"
                  />
                </div>
              </div>

              {/* Server File Upload: Cover Image */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-stone-800 font-semibold mb-1 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-700" />
                  Upload Book Cover Image (/uploads/covers/)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverUpload}
                  disabled={isUploadingCover}
                  className="text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-amber-700 file:text-white hover:file:bg-amber-800 cursor-pointer"
                />
                {isUploadingCover && <span className="text-xs text-amber-800 ml-2">Uploading image...</span>}
                {bookFormData.coverPath && (
                  <p className="text-xs text-emerald-700 mt-1 font-mono break-all">
                    Stored Path: {bookFormData.coverPath}
                  </p>
                )}
              </div>

              {/* Server File Upload: PDF File */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-stone-800 font-semibold mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-700" />
                  Upload Book PDF / eBook (/uploads/pdfs/)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  disabled={isUploadingPdf}
                  className="text-xs text-stone-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-white hover:file:bg-stone-900 cursor-pointer"
                />
                {isUploadingPdf && <span className="text-xs text-amber-800 ml-2">Uploading PDF document...</span>}
                {bookFormData.pdfPath ? (
                  <div className="flex items-center justify-between mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-800 font-mono break-all">
                      Stored Path: {bookFormData.pdfPath}
                    </p>
                    <button
                      type="button"
                      onClick={() => setBookFormData((prev) => ({ ...prev, pdfPath: '' }))}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold ml-2 shrink-0 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 mt-1">
                    No digital PDF attached yet. (Optional)
                  </p>
                )}
              </div>

              {/* Checkboxes */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-stone-700 font-medium">
                  <input
                    type="checkbox"
                    checked={bookFormData.isAvailable}
                    onChange={(e) => setBookFormData({ ...bookFormData, isAvailable: e.target.checked })}
                    className="w-4 h-4 text-amber-700 rounded border-stone-300 focus:ring-amber-600"
                  />
                  Available for checkout
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-stone-700 font-medium">
                  <input
                    type="checkbox"
                    checked={bookFormData.featured}
                    onChange={(e) => setBookFormData({ ...bookFormData, featured: e.target.checked })}
                    className="w-4 h-4 text-amber-700 rounded border-stone-300 focus:ring-amber-600"
                  />
                  Featured on Homepage
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 font-medium text-sm transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-medium text-sm shadow-sm transition cursor-pointer"
                >
                  {editingBookId ? 'Save Changes' : 'Create Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AdminDashboardPage: React.FC = AdminDashboard;
export default AdminDashboard;
