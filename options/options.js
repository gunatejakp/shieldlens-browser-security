/**
 * ShieldLens — Options Controller
 */

import { sendBackgroundMessage, MESSAGE_ACTIONS } from '../src/shared/messaging.js';
import { escapeHTML } from '../src/shared/validators.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Navigation Tabs
  const navItems = document.querySelectorAll('.nav-item');
  const tabPages = document.querySelectorAll('.tab-page');

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      navItems.forEach(i => i.classList.remove('active'));
      tabPages.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');

      if (tabId === 'tab-logs') {
        loadLogs();
      } else if (tabId === 'tab-whitelist') {
        loadWhitelist();
      }
    });
  });

  // Settings Controls
  const hoverDelaySlider = document.getElementById('hover-delay');
  const valHoverDelay = document.getElementById('val-hover-delay');

  const intentWindowSlider = document.getElementById('intent-window');
  const valIntentWindow = document.getElementById('val-intent-window');

  const chkAutoBlock = document.getElementById('chk-auto-block');
  const chkNotifications = document.getElementById('chk-notifications');

  // Whitelist Controls
  const inputWhitelistDomain = document.getElementById('input-whitelist-domain');
  const btnAddWhitelist = document.getElementById('btn-add-whitelist');
  const whitelistItems = document.getElementById('whitelist-items');

  // Danger & Log Controls
  const btnPurgeHistory = document.getElementById('btn-purge-history');
  const btnExportLogs = document.getElementById('btn-export-logs');
  const logsTbody = document.getElementById('logs-tbody');

  // Initial Settings Load
  await loadSettings();

  // Settings Event Handlers
  hoverDelaySlider.addEventListener('input', (e) => {
    valHoverDelay.textContent = e.target.value;
    saveSetting('hoverDelayMs', parseInt(e.target.value, 10));
  });

  intentWindowSlider.addEventListener('input', (e) => {
    valIntentWindow.textContent = e.target.value;
    saveSetting('intentWindowMs', parseInt(e.target.value, 10) * 1000);
  });

  chkAutoBlock.addEventListener('change', (e) => {
    saveSetting('autoBlockHighRiskDownloads', e.target.checked);
  });

  chkNotifications.addEventListener('change', (e) => {
    saveSetting('notificationsEnabled', e.target.checked);
  });

  // Whitelist Handlers
  btnAddWhitelist.addEventListener('click', async () => {
    const domain = (inputWhitelistDomain.value || '').trim().toLowerCase();
    if (!domain) return;

    const res = await sendBackgroundMessage(MESSAGE_ACTIONS.GET_PROTECTION_STATUS);
    const currentList = res.data?.settings?.whitelistedDomains || [];

    if (!currentList.includes(domain)) {
      currentList.push(domain);
      await saveSetting('whitelistedDomains', currentList);
      inputWhitelistDomain.value = '';
      await loadWhitelist();
    }
  });

  // Purge History Handler
  btnPurgeHistory.addEventListener('click', async () => {
    if (confirm('Are you sure you want to purge all local security logs? This action cannot be undone.')) {
      await sendBackgroundMessage(MESSAGE_ACTIONS.CLEAR_SECURITY_LOGS);
      alert('Local security logs successfully purged.');
      await loadLogs();
    }
  });

  // Export Logs Handler
  btnExportLogs.addEventListener('click', async () => {
    const res = await sendBackgroundMessage(MESSAGE_ACTIONS.GET_SECURITY_LOGS);
    const logs = res.data || [];
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShieldLens_Security_Logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  async function loadSettings() {
    const res = await sendBackgroundMessage(MESSAGE_ACTIONS.GET_PROTECTION_STATUS);
    if (res?.data?.settings) {
      const s = res.data.settings;
      hoverDelaySlider.value = s.hoverDelayMs || 150;
      valHoverDelay.textContent = s.hoverDelayMs || 150;

      intentWindowSlider.value = (s.intentWindowMs || 5000) / 1000;
      valIntentWindow.textContent = (s.intentWindowMs || 5000) / 1000;

      chkAutoBlock.checked = !!s.autoBlockHighRiskDownloads;
      chkNotifications.checked = !!s.notificationsEnabled;
    }
  }

  async function saveSetting(key, value) {
    await sendBackgroundMessage(MESSAGE_ACTIONS.UPDATE_SETTINGS, { [key]: value });
  }

  async function loadWhitelist() {
    const res = await sendBackgroundMessage(MESSAGE_ACTIONS.GET_PROTECTION_STATUS);
    const list = res.data?.settings?.whitelistedDomains || [];

    if (list.length === 0) {
      whitelistItems.innerHTML = '<li class="help-text">No whitelisted domains added yet.</li>';
      return;
    }

    whitelistItems.innerHTML = list.map(domain => `
      <li class="whitelist-item">
        <span>🛡️ <strong>${escapeHTML(domain)}</strong></span>
        <button class="btn btn-danger btn-remove-domain" data-domain="${escapeHTML(domain)}" style="padding: 4px 8px; font-size: 11px;">Remove</button>
      </li>
    `).join('');

    document.querySelectorAll('.btn-remove-domain').forEach(btn => {
      btn.addEventListener('click', async () => {
        const dom = btn.getAttribute('data-domain');
        const newList = list.filter(d => d !== dom);
        await saveSetting('whitelistedDomains', newList);
        await loadWhitelist();
      });
    });
  }

  async function loadLogs() {
    const res = await sendBackgroundMessage(MESSAGE_ACTIONS.GET_SECURITY_LOGS);
    const logs = res.data || [];

    if (logs.length === 0) {
      logsTbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">No security activity logged yet</td>
        </tr>
      `;
      return;
    }

    logsTbody.innerHTML = logs.map(evt => `
      <tr>
        <td>${evt.dateString || ''}</td>
        <td><strong>${escapeHTML(evt.type ? evt.type.replace(/_/g, ' ') : '')}</strong></td>
        <td>${escapeHTML(evt.domain || '')}</td>
        <td>${escapeHTML((evt.target || '').substring(0, 40))}</td>
        <td><span style="color: ${getRiskColor(evt.riskLevelKey)}; font-weight: 700;">${evt.riskScore}/100 (${evt.riskLevelKey})</span></td>
        <td>${escapeHTML(evt.actionTaken || 'Monitored')}</td>
      </tr>
    `).join('');
  }

  function getRiskColor(key) {
    if (key === 'HIGH') return '#ef4444';
    if (key === 'MEDIUM') return '#f59e0b';
    return '#10b981';
  }
});
