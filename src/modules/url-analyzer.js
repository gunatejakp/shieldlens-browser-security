/**
 * ShieldLens — Feature 1 Module: URL Analyzer
 * Performs comprehensive static security analysis of URLs before click.
 */

import { KNOWN_SHORTENERS } from '../shared/constants.js';
import {
  extractDomain,
  isIPAddress,
  isPunycode,
  countSubdomains,
  detectLookalikeDomain,
  extractQueryRedirect
} from '../shared/validators.js';

/**
 * Analyzes a URL and returns risk signals.
 * @param {string} rawUrl 
 * @param {string} [currentDomain] — Domain of the page hosting the link
 * @returns {object} Analysis result containing signals and risk score components
 */
export function analyzeURL(rawUrl, currentDomain = null) {
  const signals = [];
  let basePoints = 0;

  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      error: 'Invalid or missing URL',
      signals: [{ name: 'Invalid URL Format', points: 30, detail: 'The link string is improperly formatted' }],
      totalPoints: 30
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch (e) {
    return {
      isValid: false,
      error: 'Unparseable URL',
      signals: [{ name: 'Malformed URL', points: 40, detail: 'URL failed standard parsing' }],
      totalPoints: 40
    };
  }

  const protocol = parsedUrl.protocol.toLowerCase();
  const hostname = parsedUrl.hostname.toLowerCase();
  const path = parsedUrl.pathname;
  const search = parsedUrl.search;

  // Signal 1: Non-HTTPS Protocol
  if (protocol === 'http:') {
    signals.push({
      name: 'Unencrypted Protocol (HTTP)',
      points: 15,
      detail: 'Connection to this URL is not encrypted with SSL/TLS'
    });
    basePoints += 15;
  } else if (protocol !== 'https:') {
    signals.push({
      name: 'Non-Standard Protocol',
      points: 25,
      detail: `Uses non-web protocol (${protocol})`
    });
    basePoints += 25;
  }

  // Signal 2: IP Address as Hostname
  if (isIPAddress(hostname)) {
    signals.push({
      name: 'IP Address Hostname',
      points: 30,
      detail: `Uses direct IP address (${hostname}) instead of a verified domain name`
    });
    basePoints += 30;
  }

  // Signal 3: Punycode / IDN Domain
  if (isPunycode(hostname)) {
    signals.push({
      name: 'Punycode / IDN Domain',
      points: 25,
      detail: `Contains Internationalized Domain Name encoding (${hostname}) which can be used for visual spoofing`
    });
    basePoints += 25;
  }

  // Signal 4: Lookalike / Typosquatting Domain
  const lookalikeResult = detectLookalikeDomain(hostname);
  if (lookalikeResult.isLookalike) {
    signals.push({
      name: 'Lookalike / Typosquatting Domain',
      points: 35,
      detail: lookalikeResult.reason
    });
    basePoints += 35;
  }

  // Signal 5: Known URL Shortener
  const isShortener = KNOWN_SHORTENERS.some(shortener => hostname === shortener || hostname.endsWith('.' + shortener));
  if (isShortener) {
    signals.push({
      name: 'URL Shortener Service',
      points: 15,
      detail: `Uses known shortener service (${hostname}) which masks the final destination`
    });
    basePoints += 15;
  }

  // Signal 6: Excessive Subdomains
  const subCount = countSubdomains(hostname);
  if (subCount >= 3) {
    signals.push({
      name: 'Excessive Subdomains',
      points: 15,
      detail: `Hostname has ${subCount} subdomain levels, common in obfuscated links`
    });
    basePoints += 15;
  }

  // Signal 7: Suspicious URL Length
  if (rawUrl.length > 150) {
    signals.push({
      name: 'Suspiciously Long URL',
      points: 10,
      detail: `URL length is ${rawUrl.length} characters`
    });
    basePoints += 10;
  }

  // Signal 8: URL Obfuscation / Double Encoding
  if (/%25[0-9a-fA-F]{2}/.test(search) || /%25[0-9a-fA-F]{2}/.test(path)) {
    signals.push({
      name: 'URL Encoding Obfuscation',
      points: 20,
      detail: 'Contains double-percent encoded characters designed to hide payloads'
    });
    basePoints += 20;
  }

  // Signal 9: Embedded Redirect Parameters
  const queryRedirect = extractQueryRedirect(rawUrl);
  if (queryRedirect) {
    const targetDomain = extractDomain(queryRedirect);
    signals.push({
      name: 'Embedded Redirect Parameter',
      points: 15,
      detail: `Contains embedded target redirect parameter leading to ${targetDomain || 'another URL'}`
    });
    basePoints += 15;
  }

  // Signal 10: Excessive Path Depth
  const slashCount = (path.match(/\//g) || []).length;
  if (slashCount > 6) {
    signals.push({
      name: 'Deep Directory Path',
      points: 10,
      detail: `Directory depth is ${slashCount} levels`
    });
    basePoints += 10;
  }

  // Signal 11: Cross-Domain Transition (if hosting domain provided)
  if (currentDomain) {
    const linkDomain = extractDomain(rawUrl);
    if (linkDomain && currentDomain && linkDomain !== currentDomain && !currentDomain.endsWith('.' + linkDomain) && !linkDomain.endsWith('.' + currentDomain)) {
      signals.push({
        name: 'Domain Transition',
        points: 10,
        detail: `Leads away from current domain (${currentDomain}) to external domain (${linkDomain})`
      });
      basePoints += 10;
    }
  }

  return {
    isValid: true,
    url: rawUrl,
    domain: hostname,
    protocol,
    queryRedirect,
    isShortener,
    signals,
    totalPoints: basePoints
  };
}
