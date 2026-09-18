export interface BookChapter {
  id: number;
  title: string;
  pages: string[];
}

export interface BookContent {
  tableOfContents: string[];
  chapters: BookChapter[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  categoryId?: string;
  description: string;
  shortDescription?: string;
  cover?: string;
  coverUrl?: string;
  coverColor?: string;
  year: number;
  pages: number;
  language: string;
  available: boolean;
  hasDigitalVersion: boolean;
  isbn: string;
  publisher: string;
  featured?: boolean;
  rating?: number;
  ratingCount?: number;
  reviewsCount?: number;
  pdfPath?: string;
  isBookmarked?: boolean;
  isBorrowed?: boolean;
  chapters?: BookChapter[];
  content?: BookContent;
  waitingCount?: number;
  userLoan?: BorrowRecord | null;
  userReservation?: ReservationRecord | null;
}

export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  iconName: string;
  bookCount: number;
  featuredAuthors?: string[];
  bgGradient?: string;
  icon?: string;
}

export interface LibraryStats {
  totalBooks: number;
  totalCategories: number;
  availableToRead: number;
  activeMembers: number;
  monthlyBorrows?: number;
  totalBorrowings?: number;
  activeBorrowings?: number;
  overdueBorrowings?: number;
  totalReviews?: number;
  availableBooks?: number;
  totalUsers?: number;
  categoriesCount?: number;
}

export type ReaderTheme = 'light' | 'sepia' | 'dark';
export type ReaderFontSize = 'sm' | 'base' | 'lg' | 'xl';
export type ReaderFontFamily = 'serif' | 'sans';

export type MembershipType = 'Resident' | 'Student' | 'Senior' | 'Educator' | 'General';

export interface ReadingProgressRecord {
  bookId: string;
  lastReadAt: string;
  progressPercent: number;
  currentPage?: number;
  totalPages?: number;
}

export interface BorrowRecord {
  id?: string;
  bookId: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCover?: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  status?: 'active' | 'returned' | 'overdue';
  isReturned?: boolean;
}

export interface ReservationRecord {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  libraryCardNumber?: string;
  bookId: string;
  bookTitle?: string;
  bookAuthor?: string;
  bookCover?: string;
  bookIsbn?: string;
  bookIsAvailable?: boolean;
  reservedAt: string;
  status: 'waiting' | 'ready' | 'fulfilled' | 'cancelled';
  queuePosition: number;
  readyAt?: string | null;
  expiresAt?: string | null;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'reservation_ready' | 'reservation_expired' | 'info' | 'due_reminder' | 'general';
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: 'user' | 'admin';
  libraryCardNumber: string;
  membershipType: MembershipType;
  memberSince?: string;
  createdAt?: string;
  phone?: string;
  bio?: string;
  favoriteCategories: string[];
  interests?: string[];
  readingProgress?: { bookId: string; currentPage: number; totalPages: number }[];
  savedBookIds: string[];
  readingHistory: ReadingProgressRecord[];
  borrowedBooks: BorrowRecord[];
  reservations: ReservationRecord[];
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  membershipType: MembershipType;
  phone?: string;
  bio?: string;
  favoriteCategories: string[];
}

