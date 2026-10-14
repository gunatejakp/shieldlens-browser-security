/**
 * ShieldLens — Secure Messaging Wrapper
 */

export const MESSAGE_ACTIONS = {
  ANALYZE_HOVER_LINK: 'ANALYZE_HOVER_LINK',
  RECORD_USER_INTENT: 'RECORD_USER_INTENT',
  GET_PROTECTION_STATUS: 'GET_PROTECTION_STATUS',
  TOGGLE_MODULE: 'TOGGLE_MODULE',
  GET_SECURITY_LOGS: 'GET_SECURITY_LOGS',
  CLEAR_SECURITY_LOGS: 'CLEAR_SECURITY_LOGS',
  CANCEL_DOWNLOAD: 'CANCEL_DOWNLOAD',
  ALLOW_DOWNLOAD: 'ALLOW_DOWNLOAD',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  ADD_WHITELIST_DOMAIN: 'ADD_WHITELIST_DOMAIN',
  REMOVE_WHITELIST_DOMAIN: 'REMOVE_WHITELIST_DOMAIN'
};

/**
 * Sends a message to the background service worker safely.
 * @param {string} action 
 * @param {object} payload 
 * @returns {Promise<any>}
 */
export async function sendBackgroundMessage(action, payload = {}) {
  if (!chrome?.runtime?.id) {
    throw new Error('Extension runtime context unavailable');
  }

  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(
        {
          action,
          payload,
          timestamp: Date.now()
        },
        response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        }
      );
    } catch (err) {
      reject(err);
    }
  });
}
