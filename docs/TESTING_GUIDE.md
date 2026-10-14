# ShieldLens — Reviewer & Testing Guide

This guide walks reviewers and developers through verifying all 18 security scenarios built into ShieldLens.

---

## Quick Start — Launching the Test Suite

1. Open Microsoft Edge or Google Chrome.
2. Navigate to `edge://extensions` or `chrome://extensions`.
3. Enable **Developer Mode**.
4. Click **Load Unpacked** and select the directory: `e:\Project\shieldlens`.
5. Click the **ShieldLens** extension icon in your browser toolbar.
6. Click **🧪 Test Playground** in the popup dashboard.

---

## 18 Scenario Verification Matrix

### HoverGuard Link Analysis (Tests 1 - 8)
- **Test 1 (Normal HTTPS)**: Hover link `https://example.com/safe-article` -> Tooltip displays 🟢 LIKELY LOW RISK (Score 0).
- **Test 2 (Unencrypted HTTP)**: Hover link `http://example.com/login` -> Tooltip displays 🟡 MEDIUM RISK (HTTP warning, +15 pts).
- **Test 3 (Long URL)**: Hover link with >150 characters -> Tooltip displays 🟡 MEDIUM RISK (Length warning, +10 pts).
- **Test 4 (URL Shortener)**: Hover link `https://bit.ly/...` -> Tooltip displays 🟡 MEDIUM RISK (Shortener warning, +15 pts).
- **Test 5 (Multiple Redirects)**: Hover link with embedded `?url=` redirect -> Tooltip displays 🟡 MEDIUM RISK (Redirect parameters, +15 pts).
- **Test 6 (Punycode / IDN)**: Hover link `http://xn--80ak6aa92e.com` -> Tooltip displays 🔴 HIGH RISK (Punycode warning, +25 pts).
- **Test 7 (Lookalike Domain)**: Hover link `http://paypa1-security-update.com` -> Tooltip displays 🔴 HIGH RISK (Typosquatting brand warning, +35 pts).
- **Test 8 (IP Hostname)**: Hover link `http://192.168.1.1/admin` -> Tooltip displays 🔴 HIGH RISK (Direct IP host warning, +30 pts).

### FileGuard Expected vs Actual Verification (Tests 9 - 16)
- **Test 9 (PDF Match)**: Click "Download AnnualReport.pdf" -> File matches PDF format (🟢 MATCH).
- **Test 10 (JPG Match)**: Click "Download Photo.jpg" -> File matches JPG format (🟢 MATCH).
- **Test 11 (MP3 Match)**: Click "Download Track.mp3" -> File matches MP3 format (🟢 MATCH).
- **Test 12 (MP4 Match)**: Click "Download Presentation.mp4" -> File matches MP4 format (🟢 MATCH).
- **Test 13 (ZIP Match)**: Click "Download ProjectBackup.zip" -> File matches ZIP format (🟢 MATCH).
- **Test 14 (File Mismatch)**: Click "Download LectureNotes.pdf" -> Actual is `.exe`. Triggers 🔴 FILE MISMATCH ALERT modal modal.
- **Test 15 (Double Extension)**: Click "Download StudyGuide.pdf.exe" -> Triggers 🔴 DECEPTIVE DOUBLE EXTENSION ALERT modal.
- **Test 16 (Category Mismatch)**: Click "Download ProfilePic.jpg" -> Actual is `.zip`. Triggers 🟡 CATEGORY MISMATCH alert.

### Background Download Guard (Tests 17 - 18)
- **Test 17 (Unexpected Download)**: Click "Play HD Video" -> Starts `.exe` binary download. Triggers 🔴 UNEXPECTED DOWNLOAD ALERT modal.
- **Test 18 (Automatic Drive-by)**: Click "Trigger Drive-by Download in 3s" -> Timer fires without user click. Triggers 🔴 AUTOMATIC DRIVE-BY DOWNLOAD ALERT modal.

---
