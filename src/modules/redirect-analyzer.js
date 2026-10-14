/**
 * ShieldLens — Feature 1 Module: Safe Redirect Analyzer
 * Safely inspects potential redirect chains without navigating user browser or executing page scripts.
 */

import { extractQueryRedirect, isValidURL, extractDomain } from '../shared/validators.js';

/**
 * Trace potential redirects safely.
 * @param {string} targetUrl 
 * @param {object} [options]
 * @returns {Promise<object>}
 */
export async function traceRedirects(targetUrl, options = { maxRedirects: 3, timeoutMs: 2500 }) {
  const chain = [targetUrl];
  let currentUrl = targetUrl;
  let redirectCount = 0;
  let isVerified = false;
  let note = '';

  // Step 1: Check static embedded redirect parameters first
  const staticQueryTarget = extractQueryRedirect(targetUrl);
  if (staticQueryTarget) {
    chain.push(staticQueryTarget);
    redirectCount++;
    currentUrl = staticQueryTarget;
  }

  // Step 2: Attempt safe HTTP HEAD request trace if valid HTTPS/HTTP URL
  if (isValidURL(currentUrl)) {
    try {
      let hops = 0;
      let urlToFetch = currentUrl;

      while (hops < options.maxRedirects) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);

        try {
          const response = await fetch(urlToFetch, {
            method: 'HEAD',
            redirect: 'manual', // Don't auto-follow redirects, inspect headers manually
            signal: controller.signal,
            headers: {
              'User-Agent': 'ShieldLens/1.0 Security Inspector'
            }
          });
          clearTimeout(timeoutId);

          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (location) {
              let nextUrl = location;
              if (!location.startsWith('http://') && !location.startsWith('https://')) {
                nextUrl = new URL(location, urlToFetch).href;
              }
              chain.push(nextUrl);
              redirectCount++;
              urlToFetch = nextUrl;
              hops++;
              continue;
            }
          }
          
          // Reached final non-redirect response
          currentUrl = urlToFetch;
          isVerified = true;
          break;
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          // If HEAD request fails or times out, safely mark as unverified
          break;
        }
      }
    } catch (e) {
      // Safe fallback
    }
  }

  if (redirectCount > 0 && !isVerified) {
    note = 'Redirect path detected; final destination estimated.';
  } else if (!isVerified) {
    note = 'Redirect path could not be fully verified.';
  } else {
    note = `Verified ${redirectCount} redirect(s).`;
  }

  const initialDomain = extractDomain(targetUrl);
  const finalDomain = extractDomain(chain[chain.length - 1]);
  const domainChanged = initialDomain !== finalDomain && initialDomain && finalDomain;

  return {
    initialUrl: targetUrl,
    finalUrl: chain[chain.length - 1],
    initialDomain,
    finalDomain,
    domainChanged,
    redirectCount,
    chain,
    isVerified,
    note
  };
}
