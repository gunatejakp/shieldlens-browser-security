/**
 * ShieldLens — Shared Validators, URL Parsers, and Sanitizers
 */

import { POPULAR_TARGET_DOMAINS } from './constants.js';

/**
 * Escapes unsafe HTML characters to prevent XSS vulnerabilities in injected UI.
 * @param {string} str 
 * @returns {string}
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validates if a string is a well-formed HTTP/HTTPS URL.
 * @param {string} urlString 
 * @returns {boolean}
 */
export function isValidURL(urlString) {
  if (!urlString || typeof urlString !== 'string') return false;
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

/**
 * Safely extracts hostname/domain from URL.
 * @param {string} urlString 
 * @returns {string}
 */
export function extractDomain(urlString) {
  if (!urlString) return '';
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.toLowerCase();
  } catch (e) {
    return '';
  }
}

/**
 * Checks if a hostname is an IPv4 or IPv6 address.
 * @param {string} hostname 
 * @returns {boolean}
 */
export function isIPAddress(hostname) {
  if (!hostname) return false;
  // IPv4 check
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    return parts.every(p => p >= 0 && p <= 255);
  }
  // IPv6 check
  const ipv6Regex = /^\[?[a-fA-F0-9:]+\]?$/;
  return hostname.includes(':') && ipv6Regex.test(hostname);
}

/**
 * Checks if hostname contains Internationalized Domain Name (Punycode `xn--`).
 * @param {string} hostname 
 * @returns {boolean}
 */
export function isPunycode(hostname) {
  if (!hostname) return false;
  return hostname.toLowerCase().includes('xn--');
}

/**
 * Counts subdomains level (excluding standard TLD).
 * @param {string} hostname 
 * @returns {number}
 */
export function countSubdomains(hostname) {
  if (!hostname || isIPAddress(hostname)) return 0;
  const parts = hostname.split('.');
  if (parts.length <= 2) return 0;
  return parts.length - 2;
}

/**
 * Calculates Levenshtein Distance between two strings for typosquatting checks.
 */
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Detects potential lookalike / typosquatting domain patterns against popular target domains.
 * @param {string} hostname 
 * @returns {{ isLookalike: boolean, targetDomain: string|null, reason: string|null }}
 */
export function detectLookalikeDomain(hostname) {
  if (!hostname || isIPAddress(hostname)) {
    return { isLookalike: false, targetDomain: null, reason: null };
  }

  const cleanHost = hostname.toLowerCase().replace(/^www\./, '');
  const parts = cleanHost.split('.');
  const secondLevel = parts.length >= 2 ? parts[parts.length - 2] : cleanHost;

  // Common character substitutions in phishing/typosquatting
  const substitutedHost = cleanHost
    .replace(/1/g, 'l')
    .replace(/0/g, 'o')
    .replace(/3/g, 'e')
    .replace(/5/g, 's')
    .replace(/vv/g, 'w');

  for (const target of POPULAR_TARGET_DOMAINS) {
    const targetName = target.split('.')[0];
    
    // Exact match is safe
    if (cleanHost === target || cleanHost.endsWith('.' + target)) {
      continue;
    }

    // Check for target brand inside subdomain string (e.g. paypal-security-login.com or login-google.com)
    if (cleanHost.includes(targetName) && !cleanHost.endsWith('.' + target)) {
      return {
        isLookalike: true,
        targetDomain: target,
        reason: `Domain name contains target brand "${targetName}" on untrusted host (${cleanHost})`
      };
    }

    // Check character substitution match (e.g., goog1e vs google)
    if (substitutedHost.includes(targetName)) {
      return {
        isLookalike: true,
        targetDomain: target,
        reason: `Possible character substitution mimicking "${target}"`
      };
    }

    // Check edit distance for typosquatting (1 edit distance on brand name)
    const dist = levenshteinDistance(secondLevel, targetName);
    if (dist === 1 && secondLevel.length >= 4) {
      return {
        isLookalike: true,
        targetDomain: target,
        reason: `High visual similarity / typosquatting pattern of "${target}"`
      };
    }
  }

  return { isLookalike: false, targetDomain: null, reason: null };
}

/**
 * Safely extracts redirect target parameters from query strings (e.g., ?url=http..., ?redirect=http...).
 * @param {string} urlString 
 * @returns {string|null}
 */
export function extractQueryRedirect(urlString) {
  if (!urlString) return null;
  try {
    const parsed = new URL(urlString);
    const redirectKeys = ['url', 'redirect', 'dest', 'destination', 'target', 'link', 'goto', 'r', 'u', 'next', 'q'];
    
    for (const key of redirectKeys) {
      const val = parsed.searchParams.get(key);
      if (val && isValidURL(val)) {
        return val;
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}
