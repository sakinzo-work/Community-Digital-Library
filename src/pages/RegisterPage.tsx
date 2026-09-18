/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { MembershipType, RegisterFormData } from '../types';
import {
  IdCard,
  User,
  Mail,
  Phone,
  BookOpen,
  CheckCircle,
  ArrowRight,
  Shield,
  Sparkles,
  Barcode,
  Library,
  Copy,
  Check,
  Key
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Computer & Information Technology',
  'Science & Mathematics',
  'Education',
  'Self Development & Psychology',
  'Arts & Humanities',
  'General Knowledge & Reference'
];

export const RegisterPage: React.FC = () => {
  const { navigate } = useRouter();
  const { register } = useAuth();

  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
    membershipType: 'Resident',
    phone: '',
    bio: '',
    favoriteCategories: ['Science & Nature', 'Technology & Computing']
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdCardNumber, setCreatedCardNumber] = useState<string | null>(null);
  const [copiedCard, setCopiedCard] = useState(false);

  const handleCategoryToggle = (cat: string) => {
    setFormData((prev) => {
      const exists = prev.favoriteCategories.includes(cat);
      if (exists) {
        return { ...prev, favoriteCategories: prev.favoriteCategories.filter((c) => c !== cat) };
      } else {
        return { ...prev, favoriteCategories: [...prev.favoriteCategories, cat] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await register(formData);
      if (res.success && res.user) {
        setCreatedCardNumber(res.user.libraryCardNumber);
      } else {
        setError(res.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCard = () => {
    if (createdCardNumber) {
      navigator.clipboard?.writeText(createdCardNumber);
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2000);
    }
  };

  // Card Issued Modal / Screen
  if (createdCardNumber) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              Registration Complete
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 mt-3">
              Welcome to the Community Digital Library!
            </h1>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              Your official digital library card has been generated. You can now borrow digital titles,
              read full books, and track reading lists.
            </p>
          </div>

          {/* Library Membership Card Preview */}
          <div className="max-w-md mx-auto rounded-2xl bg-linear-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 shadow-xl border border-blue-800/40 text-left relative overflow-hidden">
            {/* Background watermark */}
            <Library className="absolute -right-6 -bottom-6 w-36 h-36 text-white/5 pointer-events-none" />

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Library className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-sm tracking-tight text-white leading-none">
                    Community Digital Library
                  </h3>
                  <span className="text-[10px] text-blue-200">Official Member Card</span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/30 text-[11px] font-semibold text-blue-200">
                {formData.membershipType}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
                  Cardholder
                </span>
                <p className="font-serif text-lg font-bold text-white tracking-wide">
                  {formData.name}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">
                    Card Number
                  </span>
                  <p className="font-mono text-base font-bold text-amber-300 tracking-wider">
                    {createdCardNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCard}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="Copy Card Number"
                >
                  {copiedCard ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">{copiedCard ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Barcode visual */}
              <div className="pt-2 flex flex-col items-center">
                <div className="h-6 w-full flex items-center justify-center gap-1 opacity-60">
                  <div className="w-1 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-1.5 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-2 h-full bg-white" />
                  <div className="w-1 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-1 h-full bg-white" />
                  <div className="w-2 h-full bg-white" />
                  <div className="w-0.5 h-full bg-white" />
                  <div className="w-1 h-full bg-white" />
                </div>
                <span className="text-[9px] font-mono text-slate-400 tracking-widest mt-1">
                  {createdCardNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="goto-profile-btn"
              type="button"
              onClick={() => navigate('/profile')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-all shadow-xs"
            >
              <User className="w-4 h-4" />
              <span>Go to My Member Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="goto-books-btn"
              type="button"
              onClick={() => navigate('/books')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Catalogue</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
          <IdCard className="w-4 h-4" />
          <span>Community Library Membership</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
          Library Member Registration
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-xl mx-auto">
          Sign up for a free Community Digital Library card to save reading lists, track book loans,
          and unlock personalized study recommendations.
        </p>
      </div>

      {/* Registration Card Form */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-xs">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2">
            <span className="font-bold">&bull;</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Jordan Miller"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Email Address <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jordan@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Account Password <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Key className="w-4 h-4" />
              </div>
              <input
                id="reg-password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Choose a secure password (min 6 chars)"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Passwords are securely hashed using bcrypt in SQLite.</p>
          </div>

          {/* Membership Type & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="reg-type" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Membership Category <span className="text-rose-600">*</span>
              </label>
              <select
                id="reg-type"
                value={formData.membershipType}
                onChange={(e) => setFormData({ ...formData, membershipType: e.target.value as MembershipType })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
              >
                <option value="Resident">Community Resident (Standard)</option>
                <option value="Student">Student (School / College)</option>
                <option value="Educator">Educator / Teacher</option>
                <option value="Senior">Senior Member (60+)</option>
                <option value="General">General Patron</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Students and Educators receive extended 28-day digital lending limits.
              </p>
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="reg-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 000-0000"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Used for optional due-date SMS notifications.</p>
            </div>
          </div>

          {/* Member Bio / Research Interests */}
          <div>
            <label htmlFor="reg-bio" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Reading Goals or Bio (Optional)
            </label>
            <textarea
              id="reg-bio"
              rows={2}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="e.g. Studying computer science, interested in vintage history and classic science fiction..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
            />
          </div>

          {/* Favorite Subjects Chips */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Favorite Reading Categories
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Select subject areas to help us recommend tailored books to your profile.
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((cat) => {
                const selected = formData.favoriteCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryToggle(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selected
                        ? 'bg-blue-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {selected ? `✓ ${cat}` : `+ ${cat}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Library Membership Terms */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
            <span>
              By registering, you agree to Community Digital Library lending guidelines. Digital copies can be
              borrowed, sampled, or reserved online.
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <button
              id="submit-register-btn"
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm transition-all shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Generating Member Card...' : 'Complete Free Registration'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              Already a member? Sign in to your card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
