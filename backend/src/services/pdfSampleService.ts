import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

/**
 * In-memory cache for generated 5-page sample PDFs.
 * Keyed by source filename or resolved file path.
 * Cached in memory so repeated page requests or multi-user sample browsing
 * responds instantly without re-processing.
 */
const sampleCache = new Map<string, Buffer>();

/**
 * Generates a 5-page sample from an authentic original PDF.
 *
 * @param source Either a Buffer of the original PDF, or an absolute/relative file path to the original PDF.
 * @param cacheKey Optional unique key for in-memory caching (e.g. filename).
 * @returns A Buffer containing the standalone 5-page PDF binary.
 */
export async function generatePdfSample(
  source: Buffer | string,
  cacheKey?: string
): Promise<Buffer> {
  const normalizedKey = cacheKey ? String(cacheKey).trim() : typeof source === 'string' ? path.basename(source) : null;

  if (normalizedKey && sampleCache.has(normalizedKey)) {
    return sampleCache.get(normalizedKey)!;
  }

  let originalBuffer: Buffer;
  if (typeof source === 'string') {
    originalBuffer = await fs.promises.readFile(source);
  } else {
    originalBuffer = source;
  }

  // Load the authentic real PDF using pdf-lib
  const sourcePdf = await PDFDocument.load(originalBuffer, {
    ignoreEncryption: true
  });

  const totalPages = sourcePdf.getPageCount();
  const samplePageCount = Math.min(5, totalPages);

  // Create an entirely new PDF document containing ONLY the first 5 pages (or fewer if total < 5)
  const samplePdf = await PDFDocument.create();

  if (samplePageCount > 0) {
    const pageIndices = Array.from({ length: samplePageCount }, (_, index) => index);
    const copiedPages = await samplePdf.copyPages(sourcePdf, pageIndices);
    copiedPages.forEach((page) => samplePdf.addPage(page));
  }

  // Set document metadata indicating it is an official sample edition
  samplePdf.setTitle(`${sourcePdf.getTitle() || 'Book'} (5-Page Preview Sample)`);
  samplePdf.setSubject('Official Community Digital Library Sample Preview');

  const sampleBytes = await samplePdf.save();
  const sampleBuffer = Buffer.from(sampleBytes);

  if (normalizedKey) {
    sampleCache.set(normalizedKey, sampleBuffer);
  }

  return sampleBuffer;
}

/**
 * Clear cached samples, optionally for a specific filename when an admin updates a book's PDF.
 */
export function clearSampleCache(key?: string): void {
  if (key) {
    sampleCache.delete(key);
  } else {
    sampleCache.clear();
  }
}
