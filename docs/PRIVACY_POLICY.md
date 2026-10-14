# ShieldLens — Official Privacy Policy

**Effective Date**: September 1, 2026

ShieldLens is committed to protecting your privacy, data security, and digital safety. This document explains how ShieldLens operates under a **Strictly Local-First Privacy Architecture**.

---

## 1. Zero External Telemetry & Zero Data Collection

ShieldLens **DOES NOT**:
- Collect your browsing history.
- Collect passwords, form input data, or personal messages.
- Collect personal identifiable information (PII) or IP addresses.
- Transmit URLs or file metadata to third-party or remote analysis servers.
- Use analytics, tracking scripts, or advertising SDKs.

---

## 2. Local-First Processing Architecture

All URL parsing, link hover analysis, redirect inspection, file format verification, and intent correlation are executed **100% locally on your computer** inside the browser extension's Service Worker and Content Scripts.

---

## 3. Transient Memory & Local Data Retention

- **User Click Gestures**: Short-term click gesture context recorded by `intent-tracker.js` is stored strictly in volatile memory and is automatically deleted after 5 to 10 seconds.
- **Security Logs**: Historical activity logs are stored locally on your device in `chrome.storage.local`. You can view, export, or purge all logs at any time from the Settings & Privacy page.

---

## 4. User Control & Data Purge

You maintain full control over your extension data:
- You can clear your local security event history at any time by clicking **"Purge All Local Security Logs"** in the extension settings.
- You can export your security logs as a JSON file for your own records.

---
