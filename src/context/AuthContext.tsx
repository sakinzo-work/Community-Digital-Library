/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, RegisterFormData, BorrowRecord, ReservationRecord } from '../types';
import { apiRequest } from '../services/apiClient';

interface AuthContextType {
  currentUser: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  register: (data: RegisterFormData) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  toggleBookmark: (bookId: string) => Promise<boolean>;
  isBookmarked: (bookId: string) => boolean;
  recordReadingProgress: (bookId: string, progressPercent: number, currentPage?: number, totalPages?: number) => Promise<void>;
  updateReadingProgress: (bookId: string, currentPage: number, totalPages: number) => Promise<void>;
  borrowBook: (bookId: string) => Promise<{ success: boolean; message: string }>;
  returnBook: (borrowingId: string) => Promise<{ success: boolean; message: string }>;
  reserveBook: (bookId: string) => Promise<{ success: boolean; message: string; reservation?: ReservationRecord; queuePosition?: number }>;
  cancelReservation: (reservationId: string) => Promise<{ success: boolean; message: string }>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'cdl_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to fetch user data + bookmarks + borrowings from SQLite
  const fetchUserFullState = useCallback(async (jwtToken: string): Promise<UserProfile | null> => {
    try {
      // 1. Fetch current profile
      let meData: { user: any };
      try {
        meData = await apiRequest<{ user: any }>('/api/auth/me', {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
      } catch (authErr: any) {
        if (authErr.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
        return null;
      }

      const u = meData.user;
      if (!u) return null;

      // 2. Fetch user's bookmarks
      let savedBookIds: string[] = [];
      try {
        const bmkData = await apiRequest<{ bookmarks: any[] }>('/api/bookmarks', {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        savedBookIds = (bmkData.bookmarks || []).map((b: any) => b.id);
      } catch {
        savedBookIds = [];
      }

      // 3. Fetch user's borrowings
      let borrowedBooks: BorrowRecord[] = [];
      try {
        const brwData = await apiRequest<{ borrowings: any[] }>('/api/borrowings', {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        borrowedBooks = (brwData.borrowings || []).map((b: any) => ({
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
        borrowedBooks = [];
      }

      // 4. Fetch user's reservations
      let reservations: ReservationRecord[] = [];
      try {
        const resvData = await apiRequest<{ reservations: any[] }>('/api/reservations', {
          headers: { Authorization: `Bearer ${jwtToken}` }
        });
        reservations = (resvData.reservations || []).map((r: any) => ({
          id: r.id,
          userId: r.userId,
          userName: r.userName,
          userEmail: r.userEmail,
          libraryCardNumber: r.libraryCardNumber,
          bookId: r.bookId,
          bookTitle: r.bookTitle,
          bookAuthor: r.bookAuthor,
          bookCover: r.bookCover,
          bookIsbn: r.bookIsbn,
          bookIsAvailable: r.bookIsAvailable,
          reservedAt: r.reservedAt,
          status: r.status,
          queuePosition: r.queuePosition
        }));
      } catch {
        reservations = [];
      }

      const profile: UserProfile = {
        id: u.id,
        name: u.fullName || u.name,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone || '',
        role: u.role || 'user',
        bio: u.bio || 'Community Digital Library Member.',
        interests: Array.isArray(u.interests) ? u.interests : [],
        favoriteCategories: Array.isArray(u.interests) ? u.interests : ['Computer & Information Technology', 'Science & Mathematics'],
        libraryCardNumber: u.libraryCardNumber,
        membershipType: u.membershipType || 'General',
        memberSince: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '2026',
        savedBookIds,
        readingHistory: [],
        borrowedBooks,
        reservations
      };

      return profile;
    } catch (err) {
      console.warn('Could not complete user profile fetch:', err);
      return null;
    }
  }, []);

  // Initialize from token on mount
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (token) {
        const user = await fetchUserFullState(token);
        if (isMounted) {
          setCurrentUser(user);
        }
      }
      if (isMounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [token, fetchUserFullState]);

  const refreshUserData = async () => {
    if (token) {
      const user = await fetchUserFullState(token);
      setCurrentUser(user);
    }
  };

  const register = async (
    data: RegisterFormData
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    try {
      if (!data.password || data.password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters long' };
      }

      const resData = await apiRequest<{ token: string; user: any }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
          membershipType: data.membershipType,
          bio: data.bio,
          interests: data.favoriteCategories
        })
      });

      const newToken = resData.token;
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);

      const user = await fetchUserFullState(newToken);
      setCurrentUser(user);

      return { success: true, user: user || undefined };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; role?: string }> => {
    try {
      const cleanEmail = email.trim();
      if (!cleanEmail) {
        return { success: false, error: 'Email is required' };
      }
      if (!password) {
        return { success: false, error: 'Password is required' };
      }

      const resData = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: cleanEmail,
          password: password
        })
      });

      const newToken = resData.token;
      localStorage.setItem(TOKEN_KEY, newToken);
      setToken(newToken);

      const user = await fetchUserFullState(newToken);
      setCurrentUser(user);

      return { success: true, role: user?.role };
    } catch (err: any) {
      return { success: false, error: err.message || 'Invalid credentials' };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCurrentUser(null);
    apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => {});
  };

  const updateProfile = async (
    data: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      await apiRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: data.name || data.fullName,
          phone: data.phone,
          bio: data.bio,
          interests: data.favoriteCategories,
          membershipType: data.membershipType
        })
      });

      await refreshUserData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await apiRequest<{ message: string; token?: string }>('/api/users/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (res.token) {
        localStorage.setItem(TOKEN_KEY, res.token);
        setToken(res.token);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Password update failed' };
    }
  };

  const isBookmarked = (bookId: string): boolean => {
    if (!currentUser) return false;
    return currentUser.savedBookIds.includes(bookId);
  };

  const toggleBookmark = async (bookId: string): Promise<boolean> => {
    if (!token || !currentUser) return false;

    const alreadyBookmarked = currentUser.savedBookIds.includes(bookId);

    try {
      if (alreadyBookmarked) {
        await apiRequest(`/api/bookmarks/${encodeURIComponent(bookId)}`, {
          method: 'DELETE'
        });
        setCurrentUser((prev) =>
          prev ? { ...prev, savedBookIds: prev.savedBookIds.filter((id) => id !== bookId) } : null
        );
        return false;
      } else {
        await apiRequest(`/api/bookmarks/${encodeURIComponent(bookId)}`, {
          method: 'POST'
        });
        setCurrentUser((prev) =>
          prev ? { ...prev, savedBookIds: [...prev.savedBookIds, bookId] } : null
        );
        return true;
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
      return alreadyBookmarked;
    }
  };

  const recordReadingProgress = async (
    bookId: string,
    _progressPercent: number,
    currentPage = 1,
    totalPages = 1
  ): Promise<void> => {
    if (!token) return;
    try {
      await apiRequest(`/api/progress/${encodeURIComponent(bookId)}`, {
        method: 'PUT',
        body: JSON.stringify({ currentPage, totalPages })
      });
    } catch (err) {
      console.warn('Failed to sync reading progress:', err);
    }
  };

  const updateReadingProgress = async (
    bookId: string,
    currentPage: number,
    totalPages: number
  ): Promise<void> => {
    await recordReadingProgress(bookId, 0, currentPage, totalPages);
  };

  const borrowBook = async (bookId: string): Promise<{ success: boolean; message: string }> => {
    if (!token) {
      return { success: false, message: 'Please sign in or register to borrow library books.' };
    }

    try {
      const data = await apiRequest<{ message: string }>(`/api/borrowings/${encodeURIComponent(bookId)}`, {
        method: 'POST'
      });

      await refreshUserData();
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to borrow book' };
    }
  };

  const returnBook = async (borrowingId: string): Promise<{ success: boolean; message: string }> => {
    if (!token) {
      return { success: false, message: 'Authentication required.' };
    }

    try {
      const data = await apiRequest<{ message: string }>(`/api/borrowings/${encodeURIComponent(borrowingId)}/return`, {
        method: 'PUT'
      });

      await refreshUserData();
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to return book' };
    }
  };

  const reserveBook = async (
    bookId: string
  ): Promise<{ success: boolean; message: string; reservation?: ReservationRecord; queuePosition?: number }> => {
    if (!token) {
      return { success: false, message: 'Authentication required to reserve a book.' };
    }

    try {
      const data = await apiRequest<{ message: string; reservation?: ReservationRecord }>(
        `/api/reservations/${encodeURIComponent(bookId)}`,
        { method: 'POST' }
      );

      await refreshUserData();
      return {
        success: true,
        message: data.message,
        reservation: data.reservation,
        queuePosition: data.reservation?.queuePosition
      };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to place reservation' };
    }
  };

  const cancelReservation = async (
    reservationId: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!token) {
      return { success: false, message: 'Authentication required.' };
    }

    try {
      const data = await apiRequest<{ message: string }>(`/api/reservations/${encodeURIComponent(reservationId)}`, {
        method: 'DELETE'
      });

      await refreshUserData();
      return { success: true, message: data.message || 'Reservation cancelled successfully' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Failed to cancel reservation' };
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isLoading,
        isAdmin,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        toggleBookmark,
        isBookmarked,
        recordReadingProgress,
        updateReadingProgress,
        borrowBook,
        returnBook,
        reserveBook,
        cancelReservation,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
