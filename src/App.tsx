/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RouterProvider, useRouter } from './context/RouterContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { BooksPage } from './pages/BooksPage';
import { BookDetailsPage } from './pages/BookDetailsPage';
import { DigitalReaderPage } from './pages/DigitalReaderPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { AboutPage } from './pages/AboutPage';
import { ProfilePage } from './pages/ProfilePage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard, AdminDashboardPage } from './pages/AdminDashboard';
import { BookOpen } from 'lucide-react';

function AppContent() {
  const { path, navigate } = useRouter();

  // Full-screen dedicated reader mode for /read/:id
  if (path.startsWith('/read/')) {
    return <DigitalReaderPage />;
  }

  // Routing switch
  let CurrentPage: React.ReactNode;

  if (path === '/' || path === '') {
    CurrentPage = <HomePage />;
  } else if (path === '/books' || path.startsWith('/books?')) {
    CurrentPage = <BooksPage />;
  } else if (path.startsWith('/book/')) {
    CurrentPage = <BookDetailsPage />;
  } else if (path === '/categories' || path.startsWith('/categories?')) {
    CurrentPage = <CategoriesPage />;
  } else if (path === '/about' || path.startsWith('/about?')) {
    CurrentPage = <AboutPage />;
  } else if (path === '/profile' || path.startsWith('/profile?')) {
    CurrentPage = <ProfilePage />;
  } else if (path === '/register' || path.startsWith('/register?')) {
    CurrentPage = <RegisterPage />;
  } else if (path === '/login' || path.startsWith('/login?')) {
    CurrentPage = <LoginPage />;
  } else if (path === '/admin' || path.startsWith('/admin?')) {
    CurrentPage = <AdminDashboardPage />;
  } else {
    // 404 Fallback
    CurrentPage = (
      <div className="max-w-md mx-auto py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-slate-800">Page Not Found</h2>
        <p className="text-slate-500 text-sm mt-2">
          The requested section does not exist in the Community Digital Library portal.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 transition-colors shadow-xs"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <main className="flex-1">
        {CurrentPage}
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </RouterProvider>
  );
}

