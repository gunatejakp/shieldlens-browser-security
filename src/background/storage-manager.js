/**
 * ShieldLens — Storage Manager
 * Handles local-first persistent storage for settings, security logs, and whitelists.
 */

import { DEFAULT_SETTINGS } from '../shared/constants.js';

export const StorageManager = {
  /**
   * Retrieves current settings merged with defaults.
   * @returns {Promise<object>}
   */
  async getSettings() {
    return new Promise(resolve => {
      chrome.storage.local.get(['shieldlens_settings'], result => {
        const stored = result.shieldlens_settings || {};
        resolve({ ...DEFAULT_SETTINGS, ...stored });
      });
    });
  },

  /**
   * Updates settings partially or completely.
   * @param {object} newSettings 
   * @returns {Promise<object>}
   */
  async updateSettings(newSettings) {
    const current = await this.getSettings();
    const updated = { ...current, ...newSettings };
    return new Promise(resolve => {
      chrome.storage.local.set({ shieldlens_settings: updated }, () => {
        resolve(updated);
      });
    });
  },

  /**
   * Appends a new security event to local security logs.
   * @param {object} event 
   * @returns {Promise<Array<object>>}
   */
  async addSecurityLog(event) {
    const settings = await this.getSettings();
    return new Promise(resolve => {
      chrome.storage.local.get(['shieldlens_logs', 'shieldlens_stats'], result => {
        const logs = result.shieldlens_logs || [];
        logs.unshift(event);

        // Cap log size
        if (logs.length > settings.securityLogsMax) {
          logs.length = settings.securityLogsMax;
        }

        // Update daily stats
        const stats = result.shieldlens_stats || { todayCount: 0, lastDate: new Date().toDateString() };
        const todayStr = new Date().toDateString();
        if (stats.lastDate !== todayStr) {
          stats.todayCount = 1;
          stats.lastDate = todayStr;
        } else {
          stats.todayCount += 1;
        }

        chrome.storage.local.set({ shieldlens_logs: logs, shieldlens_stats: stats }, () => {
          resolve(logs);
        });
      });
    });
  },

  /**
   * Gets all security logs.
   * @returns {Promise<Array<object>>}
   */
  async getSecurityLogs() {
    return new Promise(resolve => {
      chrome.storage.local.get(['shieldlens_logs'], result => {
        resolve(result.shieldlens_logs || []);
      });
    });
  },

  /**
   * Clears all local security logs and resets daily stats.
   * @returns {Promise<boolean>}
   */
  async clearSecurityLogs() {
    return new Promise(resolve => {
      const stats = { todayCount: 0, lastDate: new Date().toDateString() };
      chrome.storage.local.set({ shieldlens_logs: [], shieldlens_stats: stats }, () => {
        resolve(true);
      });
    });
  },

  /**
   * Gets today's security stats.
   * @returns {Promise<{ todayCount: number }>}
   */
  async getStats() {
    return new Promise(resolve => {
      chrome.storage.local.get(['shieldlens_stats'], result => {
        const stats = result.shieldlens_stats || { todayCount: 0, lastDate: new Date().toDateString() };
        const todayStr = new Date().toDateString();
        if (stats.lastDate !== todayStr) {
          resolve({ todayCount: 0 });
        } else {
          resolve({ todayCount: stats.todayCount || 0 });
        }
      });
    });
  },

  /**
   * Checks if a domain is in the user whitelist.
   * @param {string} domain 
   * @returns {Promise<boolean>}
   */
  async isDomainWhitelisted(domain) {
    if (!domain) return false;
    const settings = await this.getSettings();
    const cleanDomain = domain.toLowerCase().trim();
    return (settings.whitelistedDomains || []).some(w => {
      const cleanW = w.toLowerCase().trim();
      return cleanDomain === cleanW || cleanDomain.endsWith('.' + cleanW);
    });
  }
};
