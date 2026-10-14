/**
 * ShieldLens — Background Download Monitor
 * Intercepts chrome.downloads events, correlates click intent, verifies file match, and enforces risk policies.
 */

import { StorageManager } from './storage-manager.js';
import { verifyDownloadedFile } from '../modules/file-analyzer.js';
import { analyzeDownloadIntent } from '../modules/intent-analyzer.js';
import { calculateRisk } from '../modules/risk-engine.js';
import { createSecurityEvent } from '../modules/security-events.js';
import { EVENT_TYPES } from '../shared/constants.js';

// In-memory buffer of recent intents reported by content scripts across tabs
const recentIntentsBuffer = [];
const INTENT_BUFFER_MAX_AGE = 10000; // 10 seconds

export const DownloadMonitor = {
  /**
   * Registers a user click intent from a content script.
   * @param {object} intentData 
   */
  recordIntent(intentData) {
    if (!intentData) return;
    recentIntentsBuffer.push({
      ...intentData,
      timestamp: intentData.timestamp || Date.now()
    });

    // Prune stale intents
    const now = Date.now();
    while (recentIntentsBuffer.length > 0 && (now - recentIntentsBuffer[0].timestamp) > INTENT_BUFFER_MAX_AGE) {
      recentIntentsBuffer.shift();
    }
  },

  /**
   * Initializes chrome.downloads event listeners.
   */
  init() {
    if (!chrome?.downloads) return;

    chrome.downloads.onCreated.addListener(async (downloadItem) => {
      await this.handleDownloadCreated(downloadItem);
    });
  },

  /**
   * Main handler for newly created download items.
   * @param {object} downloadItem 
   */
  async handleDownloadCreated(downloadItem) {
    const settings = await StorageManager.getSettings();
    if (!settings.fileGuardEnabled && !settings.downloadGuardEnabled) {
      return;
    }

    // Filter out extensions' internal downloads or blob test downloads if whitelisted
    const downloadUrl = downloadItem.url || downloadItem.finalUrl || '';
    const referrer = downloadItem.referrer || '';
    
    // Step 1: Find best matching intent from buffer
    const intentResult = analyzeDownloadIntent(downloadItem, recentIntentsBuffer, settings.intentWindowMs);

    // Step 2: Perform FileGuard verification
    const fileResult = verifyDownloadedFile(downloadItem, intentResult.matchedIntent);

    // Step 3: Run through Unified Risk Engine
    const riskResult = calculateRisk({
      fileAnalysis: fileResult,
      intentAnalysis: intentResult
    });

    // Determine primary event type
    let eventType = EVENT_TYPES.LINK_HOVER_ANALYZED;
    if (fileResult.isMismatch) {
      eventType = EVENT_TYPES.FILE_MISMATCH_DETECTED;
    } else if (intentResult.isAutomatic) {
      eventType = EVENT_TYPES.AUTOMATIC_DOWNLOAD_DETECTED;
    } else if (intentResult.isUnexpected) {
      eventType = EVENT_TYPES.UNEXPECTED_DOWNLOAD_DETECTED;
    }

    // Only alert/log if risk score > 20 or mismatch/unexpected download
    if (riskResult.score > 20 || fileResult.isMismatch || intentResult.isUnexpected || intentResult.isAutomatic) {
      const securityEvent = createSecurityEvent(eventType, {
        domain: intentResult.matchedIntent?.pageUrl || downloadItem.referrer || downloadUrl,
        target: downloadItem.filename || downloadItem.finalUrl || 'Unknown File',
        riskScore: riskResult.score,
        riskLevelKey: riskResult.level.key,
        reasons: riskResult.reasons,
        actionTaken: settings.autoBlockHighRiskDownloads && riskResult.level.key === 'HIGH' ? 'Paused / Pending User Action' : 'Flagged'
      });

      await StorageManager.addSecurityLog(securityEvent);

      // Auto-pause high risk downloads if policy enabled
      if (settings.autoBlockHighRiskDownloads && riskResult.level.key === 'HIGH') {
        try {
          chrome.downloads.pause(downloadItem.id);
        } catch (e) {
          // Pause might fail if completed instantly
        }
      }

      // Notify active tab via message or system notification
      this.notifyUser(downloadItem, riskResult, fileResult, intentResult, securityEvent, settings);
    }
  },

  /**
   * Dispatches warning modal to active tab or chrome notification.
   */
  async notifyUser(downloadItem, riskResult, fileResult, intentResult, securityEvent, settings) {
    if (!settings.notificationsEnabled) return;

    // Send warning overlay payload to active tab content script
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab?.id) {
        chrome.tabs.sendMessage(activeTab.id, {
          action: 'SHOW_DOWNLOAD_ALERT_MODAL',
          payload: {
            downloadId: downloadItem.id,
            filename: downloadItem.filename || 'Downloaded File',
            risk: riskResult,
            fileResult,
            intentResult,
            event: securityEvent
          }
        });
      }
    } catch (err) {
      // Fallback to chrome.notifications if content script not reachable
      if (chrome.notifications && riskResult.level.key === 'HIGH') {
        chrome.notifications.create(`shieldlens_dl_${downloadItem.id}`, {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('assets/icons/icon128.png'),
          title: `🛡️ ShieldLens Alert: ${riskResult.level.name}`,
          message: `${fileResult.isMismatch ? fileResult.reason : intentResult.reason}\nFile: ${downloadItem.filename || 'Unknown'}`,
          priority: 2
        });
      }
    }
  },

  /**
   * Cancels an in-progress download by ID.
   * @param {number} downloadId 
   */
  async cancelDownload(downloadId) {
    if (!downloadId || !chrome?.downloads) return false;
    return new Promise(resolve => {
      chrome.downloads.cancel(downloadId, () => {
        chrome.downloads.erase({ id: downloadId }, () => {
          resolve(true);
        });
      });
    });
  },

  /**
   * Resumes an in-progress download by ID.
   * @param {number} downloadId 
   */
  async allowDownload(downloadId) {
    if (!downloadId || !chrome?.downloads) return false;
    return new Promise(resolve => {
      chrome.downloads.resume(downloadId, () => {
        resolve(true);
      });
    });
  }
};
