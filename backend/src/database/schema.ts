import { exec, queryOne } from './db';

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  bio TEXT,
  interests TEXT,
  library_card_number TEXT UNIQUE NOT NULL,
  membership_type TEXT NOT NULL DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category_id TEXT NOT NULL,
  description TEXT,
  publication_year INTEGER,
  pages INTEGER,
  language TEXT DEFAULT 'English',
  isbn TEXT UNIQUE,
  cover_path TEXT,
  pdf_path TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  publisher TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  chapters_json TEXT,
  rating REAL DEFAULT 0.0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reading_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  current_page INTEGER NOT NULL DEFAULT 1,
  total_pages INTEGER NOT NULL DEFAULT 1,
  progress_percentage REAL NOT NULL DEFAULT 0.0,
  last_read_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS borrowings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  borrowed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMPTZ NOT NULL,
  returned_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK(status IN ('active', 'returned', 'overdue')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  book_id TEXT NOT NULL,
  reserved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK(status IN ('waiting', 'ready', 'fulfilled', 'cancelled')),
  queue_position INTEGER NOT NULL,
  ready_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info'
    CHECK(type IN (
      'info',
      'reservation_ready',
      'reservation_expired',
      'due_reminder',
      'general'
    )),
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS uploaded_files (
  filename TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_books_category
  ON books(category_id);

CREATE INDEX IF NOT EXISTS idx_books_isbn
  ON books(isbn);

CREATE INDEX IF NOT EXISTS idx_books_available
  ON books(is_available);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user
  ON bookmarks(user_id);

CREATE INDEX IF NOT EXISTS idx_borrowings_user
  ON borrowings(user_id);

CREATE INDEX IF NOT EXISTS idx_borrowings_status
  ON borrowings(status);

CREATE INDEX IF NOT EXISTS idx_reading_progress_user
  ON reading_progress(user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_book
  ON reviews(book_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reservations_user_book_active
  ON reservations(user_id, book_id)
  WHERE status IN ('waiting', 'ready');

CREATE INDEX IF NOT EXISTS idx_reservations_user
  ON reservations(user_id);

CREATE INDEX IF NOT EXISTS idx_reservations_book
  ON reservations(book_id);

CREATE INDEX IF NOT EXISTS idx_reservations_status
  ON reservations(status);

CREATE INDEX IF NOT EXISTS idx_reservations_expires
  ON reservations(expires_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created
  ON notifications(created_at);
`;

export async function initDatabase(): Promise<void> {
  console.log('Initializing PostgreSQL database schema...');

  const existingUsersTable = await queryOne<{ exists: boolean }>(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'users'
    ) AS exists
  `);

  if (existingUsersTable?.exists) {
    console.log('PostgreSQL schema already exists. Skipping schema creation.');
    return;
  }

  await exec(SCHEMA_SQL);

  console.log('PostgreSQL database schema initialized successfully.');
}