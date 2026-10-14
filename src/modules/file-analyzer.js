/**
 * ShieldLens — Feature 2 Module: File Analyzer & FileGuard Verification
 * Verifies that promised/expected file types match actual downloaded files.
 */

import { FILE_CATEGORIES } from '../shared/constants.js';

/**
 * Gets file category object for a given filename or extension.
 * @param {string} filename 
 * @param {string} [mimeType] 
 * @returns {object} File Category metadata
 */
export function categorizeFile(filename, mimeType = null) {
  if (!filename && !mimeType) return FILE_CATEGORIES.OTHER;

  const extMatch = filename ? filename.toLowerCase().match(/\.([a-z0-9]+)$/) : null;
  const ext = extMatch ? '.' + extMatch[1] : '';

  for (const catKey of Object.keys(FILE_CATEGORIES)) {
    const category = FILE_CATEGORIES[catKey];
    if (category.extensions.includes(ext)) {
      return category;
    }
    if (mimeType && category.mimeTypes.includes(mimeType.toLowerCase())) {
      return category;
    }
  }

  return FILE_CATEGORIES.OTHER;
}

/**
 * Extracts expected file format hint from contextual DOM signals.
 * @param {object} context 
 * @param {string} [context.linkText]
 * @param {string} [context.buttonText]
 * @param {string} [context.surroundingText]
 * @param {string} [context.href]
 * @param {string} [context.ariaLabel]
 * @param {string} [context.downloadAttr]
 * @returns {{ expectedCategory: object|null, formatName: string|null, confidence: number, source: string|null }}
 */
export function inferExpectedFileType(context = {}) {
  if (!context) {
    return { expectedCategory: null, formatName: null, confidence: 0, source: null };
  }

  const textToScan = [
    context.downloadAttr,
    context.linkText,
    context.buttonText,
    context.ariaLabel,
    context.href,
    context.surroundingText
  ].filter(Boolean).join(' ').toLowerCase();

  if (!textToScan) {
    return { expectedCategory: null, formatName: null, confidence: 0, source: null };
  }

  // Check explicit extension patterns in text (e.g. Notes.pdf or Format: PDF)
  for (const catKey of Object.keys(FILE_CATEGORIES)) {
    const category = FILE_CATEGORIES[catKey];
    if (catKey === 'OTHER') continue;

    for (const ext of category.extensions) {
      const cleanExt = ext.replace('.', '');
      
      // High confidence check: filename with extension (e.g. Report.pdf)
      const filenameRegex = new RegExp(`[a-z0-9_-]+\\${ext}\\b`, 'i');
      if (filenameRegex.test(textToScan)) {
        return {
          expectedCategory: category,
          formatName: cleanExt.toUpperCase(),
          confidence: 0.9,
          source: `Explicit filename signal (${ext})`
        };
      }

      // Medium confidence check: words like "pdf document", "excel sheet", "mp3 audio"
      const formatWordRegex = new RegExp(`\\b(format|download|file|type)?\\s*:?\\s*${cleanExt}\\b`, 'i');
      if (formatWordRegex.test(textToScan)) {
        return {
          expectedCategory: category,
          formatName: cleanExt.toUpperCase(),
          confidence: 0.75,
          source: `Visible text format indicator (${cleanExt.toUpperCase()})`
        };
      }
    }
  }

  return { expectedCategory: null, formatName: null, confidence: 0, source: null };
}

/**
 * Checks for double extension trick (e.g., Notes.pdf.exe or Invoice.docx.bat).
 * @param {string} filename 
 * @returns {{ hasDoubleExtension: boolean, fakeExtension: string|null, realExtension: string|null }}
 */
export function checkDoubleExtension(filename) {
  if (!filename) return { hasDoubleExtension: false, fakeExtension: null, realExtension: null };

  const clean = filename.trim();
  const parts = clean.split('.');
  if (parts.length < 3) {
    return { hasDoubleExtension: false, fakeExtension: null, realExtension: null };
  }

  const realExt = '.' + parts[parts.length - 1].toLowerCase();
  const fakeExt = '.' + parts[parts.length - 2].toLowerCase();

  const isRealHighRisk = FILE_CATEGORIES.EXECUTABLE.extensions.includes(realExt);
  const isFakeDocOrMedia = FILE_CATEGORIES.DOCUMENT.extensions.includes(fakeExt) ||
                           FILE_CATEGORIES.IMAGE.extensions.includes(fakeExt) ||
                           FILE_CATEGORIES.AUDIO.extensions.includes(fakeExt) ||
                           FILE_CATEGORIES.VIDEO.extensions.includes(fakeExt);

  if (isRealHighRisk && isFakeDocOrMedia) {
    return {
      hasDoubleExtension: true,
      fakeExtension: fakeExt.replace('.', '').toUpperCase(),
      realExtension: realExt.replace('.', '').toUpperCase()
    };
  }

  return { hasDoubleExtension: false, fakeExtension: null, realExtension: null };
}

/**
 * Verifies actual downloaded file against expected file type.
 * @param {object} downloadItem — chrome.downloads.DownloadItem or metadata object
 * @param {object} [intentContext] — Recorded click intent context
 * @returns {object} FileGuard verification result
 */
export function verifyDownloadedFile(downloadItem, intentContext = null) {
  const filename = downloadItem.filename || downloadItem.finalUrl || '';
  const mimeType = downloadItem.mime || downloadItem.mimeType || null;

  const actualCategory = categorizeFile(filename, mimeType);
  const doubleExt = checkDoubleExtension(filename);

  // Determine expected file type
  const expectedHint = inferExpectedFileType(intentContext);
  const expectedCategory = expectedHint.expectedCategory;

  let isMismatch = false;
  let riskPoints = 0;
  let severity = 'LOW';
  let reason = '';

  // Check 1: Double extension trick is an immediate high risk mismatch
  if (doubleExt.hasDoubleExtension) {
    isMismatch = true;
    riskPoints = 45;
    severity = 'HIGH';
    reason = `Deceptive double extension detected: disguised as ${doubleExt.fakeExtension} but actually an executable (${doubleExt.realExtension})`;
  } 
  // Check 2: Expected vs Actual category mismatch
  else if (expectedCategory && expectedCategory.id !== actualCategory.id && expectedHint.confidence >= 0.6) {
    isMismatch = true;
    if (actualCategory.id === 'EXECUTABLE') {
      riskPoints = 40;
      severity = 'HIGH';
      reason = `Promised ${expectedHint.formatName || expectedCategory.name} file, but actual download is an Executable (${actualCategory.name})`;
    } else {
      riskPoints = 25;
      severity = 'MEDIUM';
      reason = `File category mismatch: Expected ${expectedHint.formatName || expectedCategory.name}, actual download is ${actualCategory.name}`;
    }
  }

  return {
    filename,
    actualCategory,
    expectedCategory,
    expectedFormat: expectedHint.formatName,
    doubleExtension: doubleExt,
    isMismatch,
    severity,
    riskPoints,
    reason
  };
}
