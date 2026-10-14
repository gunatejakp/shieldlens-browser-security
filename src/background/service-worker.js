/**
 * ShieldLens — Central Service Worker (MV3 Background)
 */

import { StorageManager } from './storage-manager.js';
import { DownloadMonitor } from './download-monitor.js';
import { analyzeURL } from '../modules/url-analyzer.js';
import { traceRedirects } from '../modules/redirect-analyzer.js';
import { calculateRisk } from '../modules/risk-engine.js';
import { MESSAGE_ACTIONS } from '../shared/messaging.js';
import { createSecurityEvent } from '../modules/security-events.js';
import { EVENT_TYPES } from '../shared/constants.js';

// Cache for recent HoverGuard link analyses to prevent redundant overhead
const hoverAnalysisCache = new Map();
const CACHE_MAX_SIZE = 100;

// Initialize Download Monitor on Service Worker boot
DownloadMonitor.init();

// Initialize extension state on installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await StorageManager.getSettings();
  }
});

// Central Message Handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, payload } = request || {};

  handleMessage(action, payload, sender)
    .then(response => sendResponse({ success: true, data: response }))
    .catch(err => sendResponse({ success: false, error: err.message }));

  return true; // Keep response channel open for async promises
});

/**
 * Handles incoming background message requests.
 */
async function handleMessage(action, payload = {}, sender = {}) {
  switch (action) {
    case MESSAGE_ACTIONS.ANALYZE_HOVER_LINK: {
      const { rawUrl, pageDomain } = payload;
      if (!rawUrl) throw new Error('Missing rawUrl parameter');

      // Check cache first
      const cacheKey = `${rawUrl}_${pageDomain || ''}`;
      if (hoverAnalysisCache.has(cacheKey)) {
        return hoverAnalysisCache.get(cacheKey);
      }

      // Check if domain is whitelisted
      const isWhitelisted = await StorageManager.isDomainWhitelisted(pageDomain);
      if (isWhitelisted) {
        const whiteResult = {
          url: rawUrl,
          risk: { score: 0, level: { key: 'LOW', name: 'Whitelisted Domain', badge: '🟢 WHITELISTED', color: '#10b981' }, reasons: ['Domain is in your trusted whitelist'] }
        };
        return whiteResult;
      }

      // Perform static URL analysis
      const urlAnalysis = analyzeURL(rawUrl, pageDomain);

      // Perform safe redirect analysis if URL is valid
      let redirectAnalysis = null;
      if (urlAnalysis.isValid) {
        redirectAnalysis = await traceRedirects(rawUrl);
      }

      // Run Unified Risk Engine
      const riskResult = calculateRisk({
        urlAnalysis,
        redirectAnalysis
      });

      const responseData = {
        url: rawUrl,
        domain: urlAnalysis.domain,
        urlAnalysis,
        redirectAnalysis,
        risk: riskResult
      };

      // Store in cache
      if (hoverAnalysisCache.size > CACHE_MAX_SIZE) {
        const firstKey = hoverAnalysisCache.keys().next().value;
        hoverAnalysisCache.delete(firstKey);
      }
      hoverAnalysisCache.set(cacheKey, responseData);

      // Log to security history if MEDIUM or HIGH risk
      if (riskResult.score >= 31) {
        const securityEvent = createSecurityEvent(EVENT_TYPES.LINK_HOVER_ANALYZED, {
          domain: pageDomain || urlAnalysis.domain,
          target: rawUrl,
          riskScore: riskResult.score,
          riskLevelKey: riskResult.level.key,
          reasons: riskResult.reasons,
          actionTaken: 'Hover Inspected'
        });
        await StorageManager.addSecurityLog(securityEvent);
      }

      return responseData;
    }

    case MESSAGE_ACTIONS.RECORD_USER_INTENT: {
      DownloadMonitor.recordIntent(payload);
      return { recorded: true };
    }

    case MESSAGE_ACTIONS.GET_PROTECTION_STATUS: {
      const settings = await StorageManager.getSettings();
      const stats = await StorageManager.getStats();
      const recentLogs = await StorageManager.getSecurityLogs();
      return {
        settings,
        stats,
        recentLogs: recentLogs.slice(0, 5)
      };
    }

    case MESSAGE_ACTIONS.TOGGLE_MODULE: {
      const { moduleKey, enabled } = payload;
      const updated = await StorageManager.updateSettings({ [moduleKey]: enabled });
      return updated;
    }

    case MESSAGE_ACTIONS.GET_SECURITY_LOGS: {
      return await StorageManager.getSecurityLogs();
    }

    case MESSAGE_ACTIONS.CLEAR_SECURITY_LOGS: {
      return await StorageManager.clearSecurityLogs();
    }

    case MESSAGE_ACTIONS.CANCEL_DOWNLOAD: {
      const { downloadId } = payload;
      const res = await DownloadMonitor.cancelDownload(downloadId);
      return { cancelled: res };
    }

    case MESSAGE_ACTIONS.ALLOW_DOWNLOAD: {
      const { downloadId } = payload;
      const res = await DownloadMonitor.allowDownload(downloadId);
      return { allowed: res };
    }

    case MESSAGE_ACTIONS.UPDATE_SETTINGS: {
      return await StorageManager.updateSettings(payload);
    }

    default:
      throw new Error(`Unknown message action: ${action}`);
  }
}
