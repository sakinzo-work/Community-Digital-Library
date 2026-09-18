/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Book, CategoryInfo, LibraryStats, Review, BorrowRecord, ReservationRecord } from '../types';
import { apiRequest } from './apiClient';

export interface SearchFilterParams {
  query?: string;
  category?: string;
  availability?: 'all' | 'digital' | 'available';
  author?: string;
  sortBy?: 'title_asc' | 'title_desc' | 'author' | 'newest' | 'rating';
}

export const BookService = {
  /**
   * Retrieves books with search, filter, and sort from SQLite via REST API
   */
  async getBooks(params: SearchFilterParams = {}): Promise<Book[]> {
    const query = new URLSearchParams();
    if (params.query) query.set('search', params.query);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.availability === 'digital') query.set('available', 'digital');
    else if (params.availability === 'available') query.set('available', 'true');
    if (params.sortBy) {
      if (params.sortBy === 'newest') query.set('sort', 'year_desc');
      else if (params.sortBy === 'rating') query.set('sort', 'rating_desc');
      else query.set('sort', params.sortBy);
    }

    const data = await apiRequest<{ books: any[] }>(`/api/books?${query.toString()}`);
    return (data.books || []).map((b: any) => ({
      ...b,
      cover: b.coverUrl || b.cover || '',
      shortDescription: b.description ? b.description.slice(0, 140) + '...' : '',
      waitingCount: typeof b.waitingCount === 'number' ? b.waitingCount : 0
    }));
  },

  /**
   * Get single book details by ID from SQLite
   */
  async getBookById(id: string): Promise<Book | null> {
    try {
      const data = await apiRequest<{ book: any }>(`/api/books/${encodeURIComponent(id)}`);
      const b = data.book;
      if (!b) return null;

      return {
        ...b,
        cover: b.coverUrl || b.cover || '',
        shortDescription: b.description ? b.description.slice(0, 140) + '...' : '',
        waitingCount: typeof b.waitingCount === 'number' ? b.waitingCount : 0,
        userLoan: b.userLoan || null,
        userReservation: b.userReservation || null,
        content: b.chapters && b.chapters.length > 0 ? {
          tableOfContents: b.chapters.map((c: any) => c.title),
          chapters: b.chapters
        } : undefined
      };
    } catch (err: any) {
      if (err.status === 404) return null;
      throw err;
    }
  },

  /**
   * Get all categories from SQLite
   */
  async getCategories(): Promise<CategoryInfo[]> {
    const data = await apiRequest<{ categories: any[] }>('/api/categories');
    return (data.categories || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || '',
      iconName: cat.iconName || 'BookOpen',
      bookCount: cat.bookCount || 0,
      featuredAuthors: [],
      bgGradient: 'from-amber-500/10 to-orange-500/10'
    }));
  },

  /**
   * Get public library statistics for HomePage and public catalog
   */
  async getLibraryStats(): Promise<LibraryStats> {
    const data = await apiRequest<{ stats: any }>('/api/stats');
    return {
      totalBooks: data.stats?.totalBooks || 0,
      totalCategories: data.stats?.totalCategories || 0,
      availableToRead: data.stats?.availableToRead || 0,
      activeMembers: data.stats?.activeMembers || 0,
      totalReviews: data.stats?.totalReviews || 0
    };
  },

  /**
   * Get admin circulation & library statistics for AdminDashboard
   */
  async getAdminStats(): Promise<LibraryStats> {
    const data = await apiRequest<{ stats: any }>('/api/stats/admin');
    return {
      totalBooks: data.stats?.totalBooks || 0,
      totalCategories: data.stats?.totalCategories || 0,
      availableToRead: data.stats?.availableToRead || 0,
      availableBooks: data.stats?.availableToRead || 0,
      activeMembers: data.stats?.activeMembers || 0,
      totalUsers: data.stats?.activeMembers || 0,
      categoriesCount: data.stats?.totalCategories || 0,
      totalBorrowings: data.stats?.totalBorrowings || 0,
      activeBorrowings: data.stats?.activeBorrowings || 0,
      overdueBorrowings: data.stats?.overdueBorrowings || 0,
      totalReviews: data.stats?.totalReviews || 0
    };
  },

  /**
   * Alias for getLibraryStats
   */
  async getStats(): Promise<LibraryStats> {
    return this.getLibraryStats();
  },

  /**
   * Get featured books from SQLite
   */
  async getFeaturedBooks(): Promise<Book[]> {
    const all = await this.getBooks();
    return all.filter((b) => b.featured);
  },

  /**
   * Get unique authors from SQLite catalogue
   */
  async getAuthors(): Promise<string[]> {
    const all = await this.getBooks();
    const authors = new Set<string>();
    all.forEach((b) => {
      if (b.author) authors.add(b.author);
    });
    return Array.from(authors).sort();
  },

  /**
   * Get related books in same category
   */
  async getRelatedBooks(currentBookId: string, category: string, limit = 3): Promise<Book[]> {
    const all = await this.getBooks({ category });
    return all.filter((b) => b.id !== currentBookId).slice(0, limit);
  },

  /**
   * Get reviews for a book
   */
  async getBookReviews(bookId: string): Promise<Review[]> {
    try {
      const data = await apiRequest<{ reviews: any[] }>(`/api/books/${encodeURIComponent(bookId)}/reviews`);
      return data.reviews || [];
    } catch {
      return [];
    }
  },

  /**
   * Submit a review for a book
   */
  async addReview(bookId: string, rating: number, comment: string): Promise<{ success: boolean; message?: string }> {
    try {
      const data = await apiRequest<{ message: string }>(`/api/books/${encodeURIComponent(bookId)}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating, comment })
      });
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to submit review' };
    }
  },

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const data = await apiRequest<{ message: string }>(`/api/reviews/${encodeURIComponent(reviewId)}`, {
        method: 'DELETE'
      });
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to delete review' };
    }
  },

  /**
   * Borrow a book with SQLite transaction
   */
  async borrowBook(bookId: string): Promise<{ success: boolean; message: string; borrowing?: any }> {
    try {
      const data = await apiRequest<{ message: string; borrowing?: any }>(`/api/borrowings/${encodeURIComponent(bookId)}`, {
        method: 'POST'
      });
      return { success: true, message: data.message, borrowing: data.borrowing };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to borrow book' };
    }
  },

  /**
   * Return a borrowed book
   */
  async returnBook(borrowingId: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await apiRequest<{ message: string }>(`/api/borrowings/${encodeURIComponent(borrowingId)}/return`, {
        method: 'PUT'
      });
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to return book' };
    }
  },

  /**
   * Get active borrowings
   */
  async getBorrowings(all = false): Promise<BorrowRecord[]> {
    try {
      const data = await apiRequest<{ borrowings: any[] }>(`/api/borrowings${all ? '?all=true' : ''}`);
      return (data.borrowings || []).map((b: any) => ({
        id: b.id,
        bookId: b.bookId,
        bookTitle: b.bookTitle,
        bookAuthor: b.bookAuthor,
        bookCover: b.bookCover,
        borrowedAt: b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString() : '',
        dueDate: b.dueDate,
        returnedAt: b.returnedAt,
        status: b.status,
        isReturned: b.status === 'returned'
      }));
    } catch {
      return [];
    }
  },

  /**
   * Place a real hold/reservation for a book
   */
  async reserveBook(bookId: string): Promise<{ success: boolean; message: string; reservation?: ReservationRecord; queuePosition?: number }> {
    try {
      const data = await apiRequest<{ message: string; reservation?: ReservationRecord }>(
        `/api/reservations/${encodeURIComponent(bookId)}`,
        { method: 'POST' }
      );
      return {
        success: true,
        message: data.message,
        reservation: data.reservation,
        queuePosition: data.reservation?.queuePosition
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to place reservation' };
    }
  },

  /**
   * Cancel an existing reservation
   */
  async cancelReservation(reservationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const data = await apiRequest<{ message: string }>(`/api/reservations/${encodeURIComponent(reservationId)}`, {
        method: 'DELETE'
      });
      return { success: true, message: data.message || 'Reservation cancelled successfully' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to cancel reservation' };
    }
  },

  /**
   * Fetch reservations (members see own, admins pass all=true or call getAllReservationsAdmin)
   */
  async getReservations(all = false): Promise<ReservationRecord[]> {
    try {
      const endpoint = all ? '/api/reservations/all' : '/api/reservations';
      const data = await apiRequest<{ reservations: any[] }>(endpoint);
      return (data.reservations || []).map((r: any) => ({
        id: r.id || r.reservationId,
        userId: r.userId || r.user_id,
        userName: r.userName || r.user_name,
        userEmail: r.userEmail || r.user_email,
        libraryCardNumber: r.libraryCardNumber || r.library_card_number,
        bookId: r.bookId || r.book_id,
        bookTitle: r.bookTitle || r.book_title,
        bookAuthor: r.bookAuthor || r.book_author,
        bookCover: r.bookCover || r.book_cover,
        bookIsbn: r.bookIsbn || r.book_isbn,
        bookIsAvailable: r.bookIsAvailable ?? (r.book_is_available === 1),
        reservedAt: r.reservedAt || r.reserved_at,
        status: r.status,
        queuePosition: r.queuePosition ?? r.queue_position
      }));
    } catch {
      return [];
    }
  },

  /**
   * Admin: Fetch all reservations across all members and books
   */
  async getAllReservationsAdmin(): Promise<ReservationRecord[]> {
    return this.getReservations(true);
  },

  /**
   * Admin: Add new book
   */
  async createBook(bookData: any): Promise<{ success: boolean; book?: Book; error?: string }> {
    try {
      const data = await apiRequest<{ book: Book }>('/api/books', {
        method: 'POST',
        body: JSON.stringify(bookData)
      });
      return { success: true, book: data.book };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to add book' };
    }
  },

  /**
   * Admin: Update existing book
   */
  async updateBook(id: string, bookData: any): Promise<{ success: boolean; book?: Book; error?: string }> {
    try {
      const data = await apiRequest<{ book: Book }>(`/api/books/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(bookData)
      });
      return { success: true, book: data.book };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update book' };
    }
  },

  /**
   * Admin: Delete book
   */
  async deleteBook(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiRequest(`/api/books/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete book' };
    }
  },

  /**
   * Admin: Upload book cover image file
   */
  async uploadCover(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('cover', file);
      const data = await apiRequest<{ url: string }>('/api/upload/cover', {
        method: 'POST',
        body: formData
      });
      return { success: true, url: data.url };
    } catch (err: any) {
      return { success: false, error: err.message || 'Cover upload failed' };
    }
  },

  /**
   * Admin: Upload PDF document file
   */
  async uploadPdf(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const data = await apiRequest<{ url: string }>('/api/upload/pdf', {
        method: 'POST',
        body: formData
      });
      return { success: true, url: data.url };
    } catch (err: any) {
      return { success: false, error: err.message || 'PDF upload failed' };
    }
  },

  /**
   * Admin: Create category
   */
  async createCategory(data: { name: string; description?: string; iconName?: string }): Promise<{ success: boolean; category?: CategoryInfo; error?: string }> {
    return CategoryService.createCategory(data);
  },

  /**
   * Admin: Update category
   */
  async updateCategory(id: string, data: { name?: string; description?: string; iconName?: string }): Promise<{ success: boolean; category?: CategoryInfo; error?: string }> {
    return CategoryService.updateCategory(id, data);
  },

  /**
   * Admin: Delete category
   */
  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    return CategoryService.deleteCategory(id);
  }
};

export const CategoryService = {
  async getCategories(): Promise<CategoryInfo[]> {
    return BookService.getCategories();
  },

  async createCategory(data: {
    name: string;
    description?: string;
    iconName?: string;
  }): Promise<{ success: boolean; category?: CategoryInfo; error?: string }> {
    try {
      const resData = await apiRequest<{ category: CategoryInfo }>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return { success: true, category: resData.category };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error creating category' };
    }
  },

  async updateCategory(
    id: string,
    data: { name?: string; description?: string; iconName?: string }
  ): Promise<{ success: boolean; category?: CategoryInfo; error?: string }> {
    try {
      const resData = await apiRequest<{ category: CategoryInfo }>(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return { success: true, category: resData.category };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error updating category' };
    }
  },

  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiRequest(`/api/categories/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error deleting category' };
    }
  }
};
