/**
 * ShieldLens — Security Events Module
 * Formats, sanitizes, and structures security log events.
 */

import { escapeHTML } from '../shared/validators.js';

/**
 * Creates a standardized Security Event record.
 * @param {string} type — EVENT_TYPES key
 * @param {object} details 
 * @returns {object} Standardized event object
 */
export function createSecurityEvent(type, details = {}) {
  return {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    type,
    timestamp: Date.now(),
    dateString: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    domain: details.domain || details.sourceDomain || 'Unknown Source',
    target: details.target || details.url || details.filename || 'Unknown Target',
    riskScore: details.riskScore !== undefined ? details.riskScore : 0,
    riskLevelKey: details.riskLevelKey || 'LOW',
    reasons: details.reasons || [],
    actionTaken: details.actionTaken || 'Monitored',
    userChoice: details.userChoice || null
  };
}

/**
 * Formats a security event object safely for DOM injection.
 * @param {object} event 
 * @returns {object} HTML-escaped presentation object
 */
export function formatEventForDisplay(event) {
  if (!event) return null;
  return {
    ...event,
    domainEscaped: escapeHTML(event.domain),
    targetEscaped: escapeHTML(event.target),
    reasonsEscaped: (event.reasons || []).map(r => escapeHTML(r)),
    actionTakenEscaped: escapeHTML(event.actionTaken)
  };
}
