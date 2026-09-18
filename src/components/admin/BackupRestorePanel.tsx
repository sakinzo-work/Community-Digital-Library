/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  FileArchive,
  RefreshCw,
  Database,
  FileText,
  Clock,
  Layers,
  Check,
  XCircle,
  HardDrive
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStoredToken } from '../../services/apiClient';

interface BackupManifest {
  backupVersion: string;
  appName: string;
  exportedAt: string;
  database: {
    format: 'sqlite3';
    sha256: string;
    counts: {
      categories: number;
      books: number;
      users: number;
      uploaded_files: number;
      borrowings: number;
      reservations: number;
      bookmarks: number;
      reading_progress: number;
      reviews: number;
      notifications: number;
    };
  };
  assets: {
    pdfCount: number;
    coverCount: number;
    totalBytes: number;
  };
}

interface ValidationData {
  valid: boolean;
  manifest?: BackupManifest;
  errors?: string[];
  warnings?: string[];
}

interface BackupRestorePanelProps {
  onRestoreSuccess?: () => void;
}

export const BackupRestorePanel: React.FC<BackupRestorePanelProps> = ({ onRestoreSuccess }) => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // Validation State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Restore State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccessData, setRestoreSuccessData] = useState<{
    message: string;
    restoredAt?: string;
    manifest?: BackupManifest;
  } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  // Maximum allowed file size: 500 MB (matching backend ceiling)
  const MAX_BACKUP_SIZE_BYTES = 500 * 1024 * 1024;

  const getActiveAuthToken = (): string | null => {
    return token || getStoredToken();
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 1. Export Backup handler
  const handleExportBackup = async () => {
    setIsExporting(true);
    setExportMessage(null);

    try {
      const authToken = getActiveAuthToken();
      const headers: Record<string, string> = {
        Accept: 'application/zip, application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/admin/backup/export', {
        method: 'GET',
        headers
      });

      if (!res.ok) {
        let errorMsg = 'Backup creation failed.';
        try {
          const errJson = await res.json();
          if (errJson?.error) {
            errorMsg = errJson.error;
          }
        } catch {
          // ignore non-json error responses
        }
        setExportMessage({ type: 'error', text: errorMsg });
        return;
      }

      // Extract filename from Content-Disposition header if available
      const disposition = res.headers.get('content-disposition') || '';
      let filename = `community-library-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].trim();
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportMessage({ type: 'success', text: 'Backup created successfully.' });
    } catch {
      setExportMessage({ type: 'error', text: 'Backup creation failed.' });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. File Selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileError(null);
    setValidationResult(null);
    setValidationError(null);
    setRestoreSuccessData(null);
    setRestoreError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Client-side 500MB size check
    if (file.size > MAX_BACKUP_SIZE_BYTES) {
      setFileError('Backup file is too large. Maximum allowed size is 500 MB.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check extension
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setFileError('Invalid file format. Only .zip backup archives are allowed.');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  // 3. Dry-Run Validation handler
  const handleValidateBackup = async () => {
    if (!selectedFile) {
      setFileError('Please select a backup ZIP archive first.');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);
    setValidationError(null);
    setRestoreSuccessData(null);
    setRestoreError(null);

    try {
      const formData = new FormData();
      formData.append('backupZip', selectedFile);

      const authToken = getActiveAuthToken();
      const headers: Record<string, string> = {
        Accept: 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // POST /api/admin/backup/import?dryRun=true
      const res = await fetch('/api/admin/backup/import?dryRun=true', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setValidationResult({
          valid: true,
          manifest: data.validation?.manifest,
          warnings: data.validation?.warnings || []
        });
      } else {
        setValidationError('Backup validation failed.');
        setValidationResult({
          valid: false,
          manifest: data.validation?.manifest,
          errors: data.validation?.errors || [data.error || 'Backup validation failed.'],
          warnings: data.validation?.warnings || []
        });
      }
    } catch {
      setValidationError('Backup validation failed.');
      setValidationResult({
        valid: false,
        errors: ['Unable to contact server for backup validation.']
      });
    } finally {
      setIsValidating(false);
    }
  };

  // 4. Normal Restore handler (Called ONLY after explicit modal confirmation)
  const handleExecuteRestore = async () => {
    if (!selectedFile) return;

    setIsConfirmModalOpen(false);
    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccessData(null);

    try {
      const formData = new FormData();
      formData.append('backupZip', selectedFile);

      const authToken = getActiveAuthToken();
      const headers: Record<string, string> = {
        Accept: 'application/json'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // POST /api/admin/backup/import
      const res = await fetch('/api/admin/backup/import', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setRestoreSuccessData({
          message: data.message || 'Library restored successfully.',
          restoredAt: data.restoredAt,
          manifest: data.validation?.manifest
        });

        // Reset file selection
        setSelectedFile(null);
        setValidationResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Trigger dashboard data refresh callback
        if (onRestoreSuccess) {
          onRestoreSuccess();
        }
      } else {
        setRestoreError(data.error || 'Library restore failed.');
      }
    } catch {
      setRestoreError('Library restore failed. Please verify server connectivity.');
    } finally {
      setIsRestoring(false);
    }
  };

  const isAnyActionRunning = isExporting || isValidating || isRestoring;

  return (
    <div className="py-6 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-800/80 text-blue-200 border border-blue-700/60">
                Librarian Disaster Recovery
              </span>
              <span className="text-xs text-blue-300">SQLite + Digital Assets</span>
            </div>
            <h2 className="text-2xl font-bold font-serif">Library Backup & Restore</h2>
            <p className="text-sm text-blue-200 mt-1 max-w-2xl">
              Create a complete, consistent backup archive containing the entire SQLite database, patrons, catalogue,
              loans, reservations, and genuine PDF files. Restore or validate archives with automatic pre-flight verification.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="admin-export-backup-btn"
              onClick={handleExportBackup}
              disabled={isAnyActionRunning}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-md transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Create Backup
                </>
              )}
            </button>
          </div>
        </div>

        {/* Export Outcome Message */}
        {exportMessage && (
          <div
            className={`mt-4 p-3.5 rounded-xl flex items-center gap-2.5 text-sm ${
              exportMessage.type === 'success'
                ? 'bg-emerald-900/60 text-emerald-200 border border-emerald-700/60'
                : 'bg-rose-900/60 text-rose-200 border border-rose-700/60'
            }`}
          >
            {exportMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            )}
            <span>{exportMessage.text}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Section 1 (Export Details) & Section 2 (Import / Restore) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Backup Architecture Details (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-serif">
              <HardDrive className="w-4 h-4 text-blue-700" />
              Backup Specifications
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every backup generated by this console produces a standalone, self-contained ZIP archive that includes:
            </p>

            <ul className="space-y-2.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Consistent SQLite Snapshot:</span> Created via native{' '}
                  <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">VACUUM INTO</code>, merging all WAL pages without table locking.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">All 10 Tables:</span> Categories, books, users, uploaded files, borrowings, reservations, bookmarks, reading progress, reviews, and notifications.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Original Binary Assets:</span> Intact PDFs and cover artwork in their native format.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Cryptographic Integrity:</span> SHA-256 database checksum in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">manifest.json</code>.
                </div>
              </li>
            </ul>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Security Note:</span> Sensitive server secrets (such as JWT keys) are never included in backups. Patrons' bcrypt password hashes are safely preserved to allow login upon restore.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Restore & Validation Flow (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-700" />
                Restore Library from Backup
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Select a previously generated <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">.zip</code> backup archive.
                Perform a pre-flight validation check to inspect table records and PDF assets before applying changes.
              </p>
            </div>

            {/* Restore Success Banner */}
            {restoreSuccessData && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Library restored successfully.</span>
                </div>
                {restoreSuccessData.restoredAt && (
                  <p className="text-xs text-emerald-700">
                    Restored at: {new Date(restoreSuccessData.restoredAt).toLocaleString()}
                  </p>
                )}
                {restoreSuccessData.manifest?.database?.counts && (
                  <div className="pt-2 text-xs text-emerald-800 border-t border-emerald-200/60">
                    <span className="font-semibold">Restored Database Summary: </span>
                    {restoreSuccessData.manifest.database.counts.books} books,{' '}
                    {restoreSuccessData.manifest.database.counts.categories} categories,{' '}
                    {restoreSuccessData.manifest.database.counts.users} patrons,{' '}
                    {restoreSuccessData.manifest.database.counts.borrowings} loans.
                  </div>
                )}
              </div>
            )}

            {/* Restore Failure Banner */}
            {restoreError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span>Library restore failed.</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  {restoreError}
                </p>
                <p className="text-xs text-rose-700 mt-1">
                  No changes were intentionally applied by this request, or the server rollback mechanism was triggered if restoration had already started.
                </p>
              </div>
            )}

            {/* File Selection Zone */}
            <div className="space-y-3">
              <label htmlFor="admin-backup-file-input" className="block text-sm font-semibold text-slate-800">
                Select Backup ZIP
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  id="admin-backup-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={handleFileChange}
                  disabled={isAnyActionRunning}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-300 rounded-xl p-1 disabled:opacity-50"
                />

                <button
                  id="admin-validate-backup-btn"
                  type="button"
                  onClick={handleValidateBackup}
                  disabled={!selectedFile || isAnyActionRunning}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-all disabled:opacity-40 disabled:hover:bg-slate-900 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating Backup...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Validate Backup
                    </>
                  )}
                </button>
              </div>

              {/* Selected File Details */}
              {selectedFile && (
                <div className="flex items-center gap-3 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  <FileArchive className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-slate-900 truncate">{selectedFile.name}</span>
                  <span className="text-slate-400">({formatBytes(selectedFile.size)})</span>
                  <span className="ml-auto text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Ready to validate
                  </span>
                </div>
              )}

              {/* Client-side File Error */}
              {fileError && (
                <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {fileError}
                </p>
              )}
            </div>

            {/* Validation Outcome Display */}
            {validationResult && (
              <div
                className={`p-5 rounded-2xl border ${
                  validationResult.valid
                    ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                    : 'bg-rose-50/50 border-rose-200 text-slate-800'
                } space-y-4`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    {validationResult.valid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                    <h4 className="font-bold text-sm text-slate-900">
                      {validationResult.valid ? 'Backup validation successful' : 'Backup validation failed'}
                    </h4>
                  </div>
                  {validationResult.manifest?.exportedAt && (
                    <span className="text-xs text-slate-500">
                      Exported: {new Date(validationResult.manifest.exportedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Validation Checks Checklist */}
                {validationResult.valid ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-blue-700" />
                        Database Integrity:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-emerald-800 pl-5">
                        <span className="flex items-center gap-1">✓ SQLite integrity check passed</span>
                        <span className="flex items-center gap-1">✓ Foreign key check passed</span>
                        <span className="flex items-center gap-1">✓ Database SHA-256 verified</span>
                        <span className="flex items-center gap-1">✓ Schema structure matches v1.0</span>
                      </div>
                    </div>

                    {/* Table counts from manifest */}
                    {validationResult.manifest?.database?.counts && (
                      <div>
                        <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-blue-700" />
                          Validated Application Tables:
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-slate-700 bg-white/70 p-2.5 rounded-xl border border-slate-200/60">
                          {Object.entries(validationResult.manifest.database.counts).map(([table, count]) => (
                            <div key={table} className="text-center">
                              <span className="text-slate-400 block text-[10px] uppercase font-mono">{table}</span>
                              <span className="font-bold text-slate-900 text-sm">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Assets from manifest */}
                    {validationResult.manifest?.assets && (
                      <div>
                        <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-blue-700" />
                          Digital Assets & Binary Files:
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-emerald-800 pl-5">
                          <span className="flex items-center gap-1">
                            ✓ {validationResult.manifest.assets.pdfCount} genuine PDF documents verified (%PDF-)
                          </span>
                          <span className="flex items-center gap-1">
                            ✓ {validationResult.manifest.assets.coverCount} local cover images
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Warnings list if any */}
                    {validationResult.warnings && validationResult.warnings.length > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                        <div className="font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Warnings:
                        </div>
                        <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                          {validationResult.warnings.map((w, idx) => (
                            <li key={idx}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action: Restore button */}
                    <div className="pt-3 border-t border-emerald-200 flex justify-end">
                      <button
                        id="admin-open-restore-modal-btn"
                        type="button"
                        onClick={() => setIsConfirmModalOpen(true)}
                        disabled={isAnyActionRunning}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Restore This Backup
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Validation Errors List */
                  <div className="space-y-2 text-xs">
                    <div className="font-semibold text-rose-900">The backup could not be validated:</div>
                    <ul className="list-disc pl-5 space-y-1 text-rose-800">
                      {validationResult.errors?.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-slate-500 italic mt-2">
                      Live database and digital assets remain 100% untouched.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      {isConfirmModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="restore-confirm-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl p-6 sm:p-7 border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 id="restore-confirm-title" className="text-lg font-bold text-slate-900 font-serif">
                  Confirm Library Restoration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Destructive System Operation</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed">
              This will replace the current library database and uploaded files with the selected backup. The current
              system will be protected by the server's rollback mechanism, but this action changes live data. Continue?
            </p>

            {validationResult?.manifest?.database?.counts && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800">Target Backup Payload:</div>
                <div className="text-[11px] text-slate-500">
                  {validationResult.manifest.database.counts.books} books ·{' '}
                  {validationResult.manifest.database.counts.users} patrons ·{' '}
                  {validationResult.manifest.assets.pdfCount} digital PDF files
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isRestoring}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="admin-confirm-restore-btn"
                type="button"
                onClick={handleExecuteRestore}
                disabled={isRestoring}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Restoring Library...
                  </>
                ) : (
                  'Continue Restore'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
