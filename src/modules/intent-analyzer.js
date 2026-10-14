/**
 * ShieldLens — Feature 3 Module: Intent Analyzer & Background Download Guard
 * Correlates download events against privacy-preserving user gesture intent records.
 */

import { extractDomain } from '../shared/validators.js';
import { FILE_CATEGORIES } from '../shared/constants.js';

export const INTENT_CLASSIFICATIONS = {
  LIKELY_INTENTIONAL: {
    key: 'LIKELY_INTENTIONAL',
    label: 'Likely Intentional Download',
    badge: '🟢 INTENTIONAL',
    riskPoints: 0
  },
  UNEXPECTED_DOWNLOAD: {
    key: 'UNEXPECTED_DOWNLOAD',
    label: 'Unexpected Download',
    badge: '🔴 UNEXPECTED',
    riskPoints: 35
  },
  AUTOMATIC_DOWNLOAD: {
    key: 'AUTOMATIC_DOWNLOAD',
    label: 'Automatic / Drive-by Download',
    badge: '🔴 AUTOMATIC',
    riskPoints: 40
  }
};

/**
 * Analyzes download intent by correlating download metadata against recent user gesture intents.
 * @param {object} downloadItem — Download item from chrome.downloads API
 * @param {Array<object>} recentIntents — List of recent user click gestures from content scripts
 * @param {number} [intentWindowMs=5000] — Maximum time window in ms to correlate click with download
 * @returns {object} Intent analysis result
 */
export function analyzeDownloadIntent(downloadItem, recentIntents = [], intentWindowMs = 5000) {
  const downloadTime = Date.now();
  const downloadUrl = downloadItem.url || downloadItem.finalUrl || '';
  const downloadDomain = extractDomain(downloadUrl);
  const filename = downloadItem.filename || downloadItem.finalUrl || '';
  
  const extMatch = filename.toLowerCase().match(/\.([a-z0-9]+)$/);
  const fileExt = extMatch ? '.' + extMatch[1] : '';
  const isExecutable = FILE_CATEGORIES.EXECUTABLE.extensions.includes(fileExt);

  // Filter valid recent click gestures within time window
  const validIntents = (recentIntents || []).filter(intent => {
    return intent && (downloadTime - intent.timestamp) <= intentWindowMs;
  });

  // Scenario 1: No recent user gesture detected at all -> Automatic / Drive-by Download
  if (validIntents.length === 0) {
    const riskPoints = isExecutable ? 50 : 35;
    return {
      classification: INTENT_CLASSIFICATIONS.AUTOMATIC_DOWNLOAD,
      isUnexpected: true,
      isAutomatic: true,
      riskPoints,
      reason: `Download started automatically without any recent user click or gesture`,
      matchedIntent: null
    };
  }

  // Find best matching intent by target URL, domain, or explicit download action
  let bestMatch = null;
  let highestScore = 0;

  for (const intent of validIntents) {
    let matchScore = 0;
    const intentDomain = extractDomain(intent.href || intent.pageUrl);

    // Exact or domain match
    if (intent.href && downloadUrl && (intent.href === downloadUrl || intent.href.includes(downloadUrl) || downloadUrl.includes(intent.href))) {
      matchScore += 50;
    } else if (intentDomain && downloadDomain && intentDomain === downloadDomain) {
      matchScore += 25;
    }

    // Explicit download keyword in click text
    const text = (intent.text || '') + ' ' + (intent.ariaLabel || '') + ' ' + (intent.downloadAttr || '');
    if (/download|get|file|pdf|doc|zip|save/i.test(text)) {
      matchScore += 30;
    }

    // Direct link to file extension
    if (intent.href && /\.(pdf|zip|exe|doc|docx|csv|mp3|mp4)$/i.test(intent.href)) {
      matchScore += 20;
    }

    if (matchScore > highestScore) {
      highestScore = matchScore;
      bestMatch = intent;
    }
  }

  // Scenario 2: User clicked something, but click score is extremely weak (unrelated click like "Play Video")
  if (!bestMatch || highestScore < 20) {
    const riskPoints = isExecutable ? 45 : 30;
    const clickedTextSnippet = validIntents[0]?.text ? `"${validIntents[0].text.substring(0, 30)}"` : 'an unrelated element';
    return {
      classification: INTENT_CLASSIFICATIONS.UNEXPECTED_DOWNLOAD,
      isUnexpected: true,
      isAutomatic: false,
      riskPoints,
      reason: `Download started after clicking ${clickedTextSnippet}, but action was not clearly a download request`,
      matchedIntent: validIntents[0]
    };
  }

  // Scenario 3: Correlated intentional click
  return {
    classification: INTENT_CLASSIFICATIONS.LIKELY_INTENTIONAL,
    isUnexpected: false,
    isAutomatic: false,
    riskPoints: 0,
    reason: `Download correlates with user click on "${bestMatch.text || 'Download link'}"`,
    matchedIntent: bestMatch
  };
}
