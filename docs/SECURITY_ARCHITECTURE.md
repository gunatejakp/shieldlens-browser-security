# ShieldLens — Security Architecture & Threat Model

## Defensive Cybersecurity Principles

ShieldLens is engineered purely as a **defensive security visibility layer**. It operates under strict browser security constraints:

1. **NO EXECUTABLE CODE RUNNING**: ShieldLens never executes downloaded files, binaries, scripts, or installer payloads.
2. **NO SECURITY PROTECTION WEAKENING**: ShieldLens works alongside browser sandbox security protections and Microsoft Defender SmartScreen without altering browser security flags.
3. **ISOLATED SHADOW DOM UI**: All user interfaces injected into external websites (HoverGuard floating tooltips and Download Guard alert modals) use Shadow DOM elements to prevent CSS pollution and resist host-page script manipulation / XSS attacks.
4. **SECURE MESSAGE PASSING**: Content scripts and background service worker communicate using typed message schemas (`MESSAGE_ACTIONS`) with strict parameter validation.

---

## Threat Mitigation Matrix

| Threat / Risk Vector | ShieldLens Defensive Mechanism |
| :--- | :--- |
| **Phishing / Lookalike Spoofing** | `url-analyzer.js` checks Punycode (`xn--`), IP-based hostnames, and Levenshtein typosquatting distance against major target brands. |
| **Deceptive Redirect Shorteners** | `redirect-analyzer.js` executes non-navigating HTTP HEAD requests with AbortController timeouts to trace final destination domain transitions safely. |
| **Deceptive Executable Disguise** | `file-analyzer.js` checks context text ("Download Notes.pdf") vs actual extension (`.exe`), detecting double extension tricks like `Notes.pdf.exe`. |
| **Drive-by / Unauthorized Downloads** | `intent-analyzer.js` matches download events against recent user click gesture buffers; flags unprompted downloads as `AUTOMATIC` or `UNEXPECTED`. |

---
