/**
 * ShieldLens — Feature 1 Content Script: HoverGuard
 * Debounced link hover observer & UI tooltip trigger.
 */

import { sendBackgroundMessage, MESSAGE_ACTIONS } from '../shared/messaging.js';
import { uiInjector } from './ui-injector.js';

export const HoverGuard = {
  activeAnchor: null,
  hoverTimer: null,
  lastAnalyzedUrl: null,
  debounceMs: 150,

  init() {
    document.addEventListener('mouseover', this.handleMouseOver.bind(this), true);
    document.addEventListener('mouseout', this.handleMouseOut.bind(this), true);
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), true);
  },

  handleMouseOver(evt) {
    const anchor = evt.target?.closest('a[href], [role="link"][href]');
    if (!anchor) return;

    const href = anchor.href;
    if (!href || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('mailto:')) {
      return;
    }

    this.activeAnchor = anchor;
    clearTimeout(this.hoverTimer);

    // Debounce hover analysis
    this.hoverTimer = setTimeout(() => {
      if (this.activeAnchor === anchor) {
        this.triggerAnalysis(href, evt.clientX, evt.clientY);
      }
    }, this.debounceMs);
  },

  handleMouseMove(evt) {
    if (this.activeAnchor && uiInjector.tooltipElement?.classList.contains('active')) {
      // Reposition tooltip smoothly if mouse moves within target link
      const width = 320;
      const height = 180;
      let posX = evt.clientX + 15;
      let posY = evt.clientY + 15;

      if (posX + width > window.innerWidth) posX = evt.clientX - width - 15;
      if (posY + height > window.innerHeight) posY = evt.clientY - height - 15;

      uiInjector.tooltipElement.style.left = `${Math.max(10, posX)}px`;
      uiInjector.tooltipElement.style.top = `${Math.max(10, posY)}px`;
    }
  },

  handleMouseOut(evt) {
    const anchor = evt.target?.closest('a[href], [role="link"][href]');
    if (anchor && anchor === this.activeAnchor) {
      clearTimeout(this.hoverTimer);
      this.activeAnchor = null;
      uiInjector.hideHoverTooltip();
    }
  },

  async triggerAnalysis(rawUrl, mouseX, mouseY) {
    const pageDomain = window.location.hostname;
    try {
      const response = await sendBackgroundMessage(MESSAGE_ACTIONS.ANALYZE_HOVER_LINK, {
        rawUrl,
        pageDomain
      });

      if (response && response.data && this.activeAnchor) {
        uiInjector.showHoverTooltip(response.data, mouseX, mouseY);
      }
    } catch (err) {
      // Silently swallow errors (e.g. extension context invalidated during dev reload)
    }
  }
};
