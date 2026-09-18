import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsDir = path.join(process.cwd(), 'uploads');
const coversDir = path.join(uploadsDir, 'covers');
const pdfsDir = path.join(uploadsDir, 'pdfs');

if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });
if (!fs.existsSync(pdfsDir)) fs.mkdirSync(pdfsDir, { recursive: true });

// Storage configuration for Book Covers
const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, coversDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const cleanBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 30);
    cb(null, `cover-${Date.now()}-${cleanBase}${ext}`);
  }
});

// Storage configuration for PDFs
const pdfStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, pdfsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
    const cleanBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 40);
    cb(null, `doc-${Date.now()}-${cleanBase}${ext}`);
  }
});

export const uploadCover = multer({
  storage: coverStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file format. Only JPEG, PNG, WEBP, and GIF are allowed.'));
    }
  }
});

export const uploadPdf = multer({
  storage: pdfStorage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only PDF documents are allowed.'));
    }
  }
});

// Storage configuration for Admin Backup ZIP archives
// Staged strictly in isolated /tmp/cdl_backup_staging to prevent direct writes into /database or /uploads
const backupStagingDir = path.join('/tmp', 'cdl_backup_staging');
if (!fs.existsSync(backupStagingDir)) {
  fs.mkdirSync(backupStagingDir, { recursive: true });
}

const backupStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, backupStagingDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.zip';
    const cleanBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 30);
    cb(null, `backup-${Date.now()}-${cleanBase}${ext}`);
  }
});

// Maximum allowed backup archive size: 500MB (safe ceiling for entire SQLite DB + multiple large PDFs/covers)
export const BACKUP_MAX_FILE_SIZE = 500 * 1024 * 1024;

export const uploadBackupZip = multer({
  storage: backupStorage,
  limits: { fileSize: BACKUP_MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const isZipExt = file.originalname.toLowerCase().endsWith('.zip');
    const isZipMime = [
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream'
    ].includes(file.mimetype);

    if (isZipExt && isZipMime) {
      cb(null, true);
    } else if (isZipExt) {
      // Some browser clients send varied mime types for ZIPs; extension must strictly be .zip
      cb(null, true);
    } else {
      cb(new Error('Invalid archive format. Only .zip backup archives are allowed.'));
    }
  }
});

