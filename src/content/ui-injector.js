/**
 * ShieldLens — Shadow DOM UI Injector
 * Safely renders Isolated HoverGuard Tooltips (Anchored directly to links) and Download Security Modals.
 */

function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

class UIInjector {
  constructor() {
    this.hostElement = null;
    this.shadowRoot = null;
    this.tooltipElement = null;
    this.modalElement = null;
    this.activeHighlightedAnchor = null;
    this.originalAnchorStyles = {};
    this.initShadowDOM();
  }

  initShadowDOM() {
    if (document.getElementById('shieldlens-root-shadow-host')) {
      this.hostElement = document.getElementById('shieldlens-root-shadow-host');
      this.shadowRoot = this.hostElement.shadowRoot;
      return;
    }

    this.hostElement = document.createElement('div');
    this.hostElement.id = 'shieldlens-root-shadow-host';
    this.hostElement.style.cssText = 'position: absolute; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647; pointer-events: none;';

    this.shadowRoot = this.hostElement.attachShadow({ mode: 'closed' });

    const styleEl = document.createElement('style');
    styleEl.textContent = `
      :host {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      /* Floating HoverGuard Tooltip Anchored Directly to Link */
      .shieldlens-tooltip {
        position: fixed;
        z-index: 2147483647;
        width: 330px;
        background: #0f172a;
        color: #f8fafc;
        border-radius: 10px;
        padding: 14px;
        box-shadow: 0 12px 30px -5px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.12);
        font-size: 13px;
        line-height: 1.4;
        pointer-events: none;
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.15s ease, transform 0.15s ease;
        backdrop-filter: blur(12px);
      }
      .shieldlens-tooltip.active {
        opacity: 1;
        transform: translateY(0);
      }

      /* Indicator Arrow pointing directly to hovered link */
      .shieldlens-tooltip::before {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border: 7px solid transparent;
      }
      .shieldlens-tooltip.arrow-top::before {
        top: -14px;
        left: 24px;
        border-bottom-color: #0f172a;
      }
      .shieldlens-tooltip.arrow-bottom::before {
        bottom: -14px;
        left: 24px;
        border-top-color: #0f172a;
      }

      .tooltip-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 8px;
      }
      .tooltip-title {
        font-weight: 700;
        font-size: 11px;
        letter-spacing: 0.5px;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .risk-badge {
        font-size: 10px;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .tooltip-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .info-row {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .info-label {
        font-size: 10px;
        color: #64748b;
        font-weight: 700;
      }
      .info-val {
        font-size: 12px;
        color: #e2e8f0;
        word-break: break-all;
      }

      .reasons-list {
        margin-top: 4px;
        padding-left: 14px;
        color: #cbd5e1;
        font-size: 11px;
      }
      .reasons-list li {
        margin-bottom: 3px;
      }

      /* Alert Modal Dialog */
      .shieldlens-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(2, 6, 23, 0.75);
        backdrop-filter: blur(8px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .shieldlens-modal-overlay.active {
        opacity: 1;
      }

      .shieldlens-modal-card {
        width: 440px;
        max-width: 90vw;
        background: #0f172a;
        border: 1px solid rgba(239, 68, 68, 0.4);
        border-radius: 14px;
        padding: 24px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
        color: #f8fafc;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .modal-header {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .modal-icon {
        font-size: 28px;
      }
      .modal-title {
        font-size: 16px;
        font-weight: 700;
        color: #f8fafc;
      }
      .modal-subtitle {
        font-size: 11px;
        color: #94a3b8;
      }

      .modal-content-box {
        background: rgba(30, 41, 59, 0.6);
        border-radius: 8px;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 13px;
      }

      .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 8px;
      }
      .btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: all 0.15s ease;
      }
      .btn-stop {
        background: #ef4444;
        color: #ffffff;
      }
      .btn-stop:hover {
        background: #dc2626;
      }
      .btn-allow {
        background: #334155;
        color: #94a3b8;
      }
      .btn-allow:hover {
        background: #475569;
        color: #f8fafc;
      }
    `;

    this.shadowRoot.appendChild(styleEl);

    this.tooltipElement = document.createElement('div');
    this.tooltipElement.className = 'shieldlens-tooltip';
    this.shadowRoot.appendChild(this.tooltipElement);

    this.modalElement = document.createElement('div');
    this.modalElement.className = 'shieldlens-modal-overlay';
    this.shadowRoot.appendChild(this.modalElement);

    (document.head || document.documentElement).appendChild(this.hostElement);
  }

  showHoverTooltip(data, anchorElement) {
    if (!this.tooltipElement || !anchorElement) return;

    const { domain, redirectAnalysis, risk } = data;
    const badgeColor = risk.level.color;
    const badgeText = risk.level.badge;

    this.highlightAnchor(anchorElement, badgeColor);

    let redirectHTML = '<span>Direct link</span>';
    if (redirectAnalysis && redirectAnalysis.redirectCount > 0) {
      redirectHTML = `<span style="color: #f59e0b;">${redirectAnalysis.redirectCount} redirect(s) detected (${escapeHTML(redirectAnalysis.finalDomain || 'External')})</span>`;
    }

    const reasonsHTML = risk.reasons.map(r => `<li>${escapeHTML(r)}</li>`).join('');

    this.tooltipElement.innerHTML = `
      <div class="tooltip-header">
        <div class="tooltip-title">🛡️ SHIELDLENS HOVERGUARD</div>
        <div class="risk-badge" style="background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor};">${badgeText}</div>
      </div>
      <div class="tooltip-body">
        <div class="info-row">
          <div class="info-label">DESTINATION DOMAIN:</div>
          <div class="info-val"><strong>${escapeHTML(domain)}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">REDIRECT PATH:</div>
          <div class="info-val">${redirectHTML}</div>
        </div>
        <div class="info-row">
          <div class="info-label">RISK FACTORS (${risk.score}/100):</div>
          <ul class="reasons-list">
            ${reasonsHTML}
          </ul>
        </div>
      </div>
    `;

    const rect = anchorElement.getBoundingClientRect();
    const tooltipWidth = 330;
    const tooltipHeight = 180;

    let posX = rect.left;
    if (posX + tooltipWidth > window.innerWidth - 12) posX = window.innerWidth - tooltipWidth - 12;
    if (posX < 12) posX = 12;

    let posY = rect.bottom + 8;
    let isAbove = false;
    if (posY + tooltipHeight > window.innerHeight - 12 && rect.top > tooltipHeight + 12) {
      posY = rect.top - tooltipHeight - 8;
      isAbove = true;
    }

    this.tooltipElement.classList.remove('arrow-top', 'arrow-bottom');
    if (isAbove) {
      this.tooltipElement.classList.add('arrow-bottom');
    } else {
      this.tooltipElement.classList.add('arrow-top');
    }

    this.tooltipElement.style.left = `${Math.max(10, posX)}px`;
    this.tooltipElement.style.top = `${Math.max(10, posY)}px`;
    this.tooltipElement.classList.add('active');
  }

  highlightAnchor(anchor, color) {
    this.clearAnchorHighlight();
    this.activeHighlightedAnchor = anchor;
    this.originalAnchorStyles = {
      outline: anchor.style.outline,
      boxShadow: anchor.style.boxShadow,
      borderRadius: anchor.style.borderRadius,
      transition: anchor.style.transition
    };

    anchor.style.transition = 'outline 0.15s ease, box-shadow 0.15s ease';
    anchor.style.outline = `2px solid ${color}`;
    anchor.style.boxShadow = `0 0 10px ${color}88`;
    if (!anchor.style.borderRadius) {
      anchor.style.borderRadius = '3px';
    }
  }

  clearAnchorHighlight() {
    if (this.activeHighlightedAnchor) {
      try {
        this.activeHighlightedAnchor.style.outline = this.originalAnchorStyles.outline || '';
        this.activeHighlightedAnchor.style.boxShadow = this.originalAnchorStyles.boxShadow || '';
        this.activeHighlightedAnchor.style.borderRadius = this.originalAnchorStyles.borderRadius || '';
        this.activeHighlightedAnchor.style.transition = this.originalAnchorStyles.transition || '';
      } catch (e) {}
      this.activeHighlightedAnchor = null;
    }
  }

  hideHoverTooltip() {
    this.clearAnchorHighlight();
    if (this.tooltipElement) {
      this.tooltipElement.classList.remove('active');
    }
  }

  showDownloadAlertModal(payload, onCancel, onAllow) {
    if (!this.modalElement) return;

    const { filename, risk, fileResult } = payload;
    const isMismatch = fileResult?.isMismatch;

    this.modalElement.innerHTML = `
      <div class="shieldlens-modal-card">
        <div class="modal-header">
          <div class="modal-icon">🛡️</div>
          <div>
            <div class="modal-title">${isMismatch ? '⚠️ FILE MISMATCH DETECTED' : '⚠️ UNEXPECTED DOWNLOAD DETECTED'}</div>
            <div class="modal-subtitle">ShieldLens Security Interception</div>
          </div>
        </div>
        <div class="modal-content-box">
          <div><strong>File:</strong> ${escapeHTML(filename)}</div>
          ${fileResult?.expectedFormat ? `<div><strong>Expected Format:</strong> ${escapeHTML(fileResult.expectedFormat)}</div>` : ''}
          ${fileResult?.actualCategory ? `<div><strong>Actual Category:</strong> ${escapeHTML(fileResult.actualCategory.name)}</div>` : ''}
          <div><strong>Risk Score:</strong> <span style="color: ${risk.level.color}; font-weight: 700;">${risk.score}/100 (${risk.level.name})</span></div>
          <ul class="reasons-list" style="margin-top: 6px;">
            ${risk.reasons.map(r => `<li>${escapeHTML(r)}</li>`).join('')}
          </ul>
        </div>
        <div class="modal-actions">
          <button class="btn btn-allow" id="btn-allow-dl">ALLOW DOWNLOAD</button>
          <button class="btn btn-stop" id="btn-stop-dl">STOP / REMOVE DOWNLOAD</button>
        </div>
      </div>
    `;

    this.modalElement.classList.add('active');

    const stopBtn = this.shadowRoot.getElementById('btn-stop-dl');
    const allowBtn = this.shadowRoot.getElementById('btn-allow-dl');

    stopBtn.onclick = () => {
      this.modalElement.classList.remove('active');
      if (onCancel) onCancel();
    };

    allowBtn.onclick = () => {
      this.modalElement.classList.remove('active');
      if (onAllow) onAllow();
    };
  }
}

export const uiInjector = new UIInjector();
