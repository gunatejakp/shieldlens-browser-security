# Microsoft Edge Add-ons Store Submission Package — SHIELDLENS

## Store Listing Metadata

- **Name**: ShieldLens — Browser Security & Download Guard
- **Short Name**: ShieldLens
- **Tagline**: Know Where You're Going. Know What You're Downloading. Stay in Control.
- **Category**: Security & Privacy
- **Supported Browsers**: Microsoft Edge (Chromium MV3), Google Chrome

---

## Short Description (max 132 chars)
Defensive security extension offering pre-click link analysis, expected vs actual file verification, and drive-by download guard.

---

## Detailed Description

ShieldLens is an enterprise-grade, privacy-first cybersecurity browser extension designed to give users visibility and defensive control over their web browsing and downloading activity.

### Core Security Modules:

1. **HoverGuard (Pre-Click Link & Redirect Inspector)**:
   - Evaluates links BEFORE you click.
   - Detects unencrypted HTTP, IP hostnames, Punycode/IDN visual spoofing, URL shorteners, embedded redirect parameters, and typosquatting domain patterns.
   - Traces safe HTTP HEAD redirect paths without executing web scripts or navigating your browser.

2. **FileGuard (Expected vs Actual File Verification)**:
   - Infers expected file format from visible webpage context (e.g., "Download AnnualReport.pdf").
   - Verifies actual download metadata upon download creation.
   - Alerts users instantly if a promised document or image turns out to be an executable or script format (`.exe`, `.msi`, `.bat`, `.ps1`), or uses deceptive double extensions (e.g., `Report.pdf.exe`).

3. **Background Download Guard (Drive-by & Unauthorized Download Detection)**:
   - Tracks privacy-preserving local user interaction gestures (clicks).
   - Detects downloads triggered automatically without user consent, or triggered from unrelated actions (e.g., clicking "Play Video" which starts a binary download).
   - Empowers users to stop, cancel, or allow downloads at will.

4. **Unified Security Risk Engine**:
   - Aggregates signals into an explainable 0–100 risk score and transparent risk classifications (🟢 LIKELY LOW RISK, 🟡 PROCEED WITH CAUTION, 🔴 POTENTIALLY DANGEROUS).

---

## Permission Justifications

| Permission | Purpose & Technical Justification |
| :--- | :--- |
| `storage` | Required to store user settings, trusted domain whitelists, and local security activity logs strictly on-device in `chrome.storage.local`. |
| `downloads` | Required to monitor `chrome.downloads.onCreated`, verify actual file extensions against expected format hints, and pause or cancel high-risk downloads upon explicit user command. |
| `activeTab` | Required to render isolated Shadow DOM security tooltips and alert modals inside the active tab context. |
| `notifications` | Required to display system notifications for background download alerts when the browser tab is minimized. |
| `<all_urls>` (Host) | Required for content script injection across web pages to monitor link hover gestures and run safe HTTP HEAD requests for redirect path inspection. |

---

## Reviewer Testing Instructions

1. Load the unpacked extension directory in Microsoft Edge via `edge://extensions` (Enable "Developer mode" -> "Load unpacked").
2. Open the built-in interactive security laboratory tab by opening `chrome-extension://<EXTENSION_ID>/test/test-playground.html` or clicking "Test Playground" in the popup menu.
3. Test HoverGuard by hovering mouse over the 8 sample link scenarios.
4. Test FileGuard by clicking the mock download buttons (PDF, JPG, MP3, ZIP vs Executable Mismatch & Double Extension).
5. Test Background Download Guard by testing the "Play Video" unexpected download button and the 3-second drive-by automatic download button.

---
