/**
 * ShieldLens — Content Script Intent Tracker
 * Captures user click gestures locally to establish intent context for Background Download Guard.
 */

import { sendBackgroundMessage, MESSAGE_ACTIONS } from '../shared/messaging.js';

export const IntentTracker = {
  init() {
    document.addEventListener('click', this.handleUserGesture.bind(this), true);
    document.addEventListener('auxclick', this.handleUserGesture.bind(this), true);
    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Enter' && (evt.target.tagName === 'A' || evt.target.tagName === 'BUTTON' || evt.target.getAttribute('role') === 'button')) {
        this.handleUserGesture(evt);
      }
    }, true);
  },

  handleUserGesture(evt) {
    const target = evt.target?.closest('a, button, [role="button"], input[type="submit"], input[type="button"], [download]');
    if (!target) return;

    const text = (target.innerText || target.value || target.title || '').trim().substring(0, 100);
    const ariaLabel = (target.getAttribute('aria-label') || '').trim();
    const downloadAttr = target.getAttribute('download') || null;
    const href = target.href || target.getAttribute('data-href') || null;
    const parentText = target.parentElement ? target.parentElement.innerText.trim().substring(0, 150) : '';

    const intentPayload = {
      text,
      ariaLabel,
      downloadAttr,
      href,
      surroundingText: parentText,
      pageUrl: window.location.href,
      timestamp: Date.now()
    };

    // Send intent gesture to background service worker memory buffer
    sendBackgroundMessage(MESSAGE_ACTIONS.RECORD_USER_INTENT, intentPayload).catch(() => {});
  }
};
