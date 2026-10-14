/**
 * ShieldLens — Popup Controller
 */

import { sendBackgroundMessage, MESSAGE_ACTIONS } from '../src/shared/messaging.js';
import { escapeHTML } from '../src/shared/validators.js';

document.addEventListener('DOMContentLoaded', async () => {
  const statusBadge = document.getElementById('status-badge');
  const statusText = document.getElementById('status-text');

  const toggleHover = document.getElementById('toggle-hover-guard');
  const toggleFile = document.getElementById('toggle-file-guard');
  const toggleDownload = document.getElementById('toggle-download-guard');

  const eventsCount = document.getElementById('events-count');
  const activityList = document.getElementById('activity-list');
  const btnClearFeed = document.getElementById('btn-clear-feed');

  const btnOpenTest = document.getElementById('btn-open-test');
  const btnOpenOptions = document.getElementById('btn-open-options');

  // Load real-time status from background
  await refreshStatus();

  // Toggle handlers
  toggleHover.addEventListener('change', (e) => toggleModule('hoverGuardEnabled', e.target.checked));
  toggleFile.addEventListener('change', (e) => toggleModule('fileGuardEnabled', e.target.checked));
  toggleDownload.addEventListener('change', (e) => toggleModule('downloadGuardEnabled', e.target.checked));

  // Clear feed
  btnClearFeed.addEventListener('click', async () => {
    await sendBackgroundMessage(MESSAGE_ACTIONS.CLEAR_SECURITY_LOGS);
    await refreshStatus();
  });

  // Open Test Playground
  btnOpenTest.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('test/test-playground.html') });
  });

  // Open Options Page
  btnOpenOptions.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  async function refreshStatus() {
    try {
      const response = await sendBackgroundMessage(MESSAGE_ACTIONS.GET_PROTECTION_STATUS);
      if (response && response.data) {
        const { settings, stats, recentLogs } = response.data;

        // Set switches
        toggleHover.checked = !!settings.hoverGuardEnabled;
        toggleFile.checked = !!settings.fileGuardEnabled;
        toggleDownload.checked = !!settings.downloadGuardEnabled;

        const allActive = settings.hoverGuardEnabled && settings.fileGuardEnabled && settings.downloadGuardEnabled;
        const someActive = settings.hoverGuardEnabled || settings.fileGuardEnabled || settings.downloadGuardEnabled;

        if (allActive) {
          statusBadge.className = 'status-badge badge-green';
          statusText.textContent = 'Protected';
        } else if (someActive) {
          statusBadge.className = 'status-badge badge-amber';
          statusText.textContent = 'Partial Guard';
        } else {
          statusBadge.className = 'status-badge';
          statusBadge.style.background = 'rgba(239, 68, 68, 0.15)';
          statusBadge.style.color = '#ef4444';
          statusText.textContent = 'Disabled';
        }

        // Set events count
        eventsCount.textContent = stats.todayCount || 0;

        // Render activity list
        renderActivityList(recentLogs || []);
      }
    } catch (err) {
      console.error('Failed to load status:', err);
    }
  }

  async function toggleModule(moduleKey, enabled) {
    await sendBackgroundMessage(MESSAGE_ACTIONS.TOGGLE_MODULE, { moduleKey, enabled });
    await refreshStatus();
  }

  function renderActivityList(logs) {
    if (logs.length === 0) {
      activityList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🛡️</div>
          <div>No security alerts detected today</div>
        </div>
      `;
      return;
    }

    activityList.innerHTML = logs.map(item => {
      const levelClass = (item.riskLevelKey || '').toLowerCase();
      const riskScore = item.riskScore !== undefined ? item.riskScore : 0;
      const targetStr = item.target ? escapeHTML(item.target.substring(0, 45)) : 'Unknown Target';
      
      return `
        <div class="activity-item ${levelClass}">
          <div class="activity-top">
            <span>${escapeHTML(item.type ? item.type.replace(/_/g, ' ') : 'EVENT')}</span>
            <span style="font-size: 10px; opacity: 0.8;">${item.dateString || ''} (${riskScore}/100)</span>
          </div>
          <div class="activity-target">${targetStr}</div>
        </div>
      `;
    }).join('');
  }
});
