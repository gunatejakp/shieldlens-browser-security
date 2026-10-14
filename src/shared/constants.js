/**
 * ShieldLens — Shared Constants & Configuration Definitions
 */

export const RISK_LEVELS = {
  LOW: {
    key: 'LOW',
    name: 'Likely Low Risk',
    badge: '🟢 LOW RISK',
    color: '#10b981', // Emerald
    bgColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
    minScore: 0,
    maxScore: 30
  },
  MEDIUM: {
    key: 'MEDIUM',
    name: 'Proceed with Caution',
    badge: '🟡 MEDIUM RISK',
    color: '#f59e0b', // Amber
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    minScore: 31,
    maxScore: 60
  },
  HIGH: {
    key: 'HIGH',
    name: 'Potentially Dangerous',
    badge: '🔴 HIGH RISK',
    color: '#ef4444', // Crimson
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    minScore: 61,
    maxScore: 100
  }
};

export const FILE_CATEGORIES = {
  EXECUTABLE: {
    id: 'EXECUTABLE',
    name: 'Executable / Program',
    icon: '💻',
    isHighRisk: true,
    extensions: ['.exe', '.msi', '.bat', '.cmd', '.scr', '.ps1', '.vbs', '.js', '.jar', '.apk', '.app', '.dmg', '.pkg', '.deb', '.rpm', '.sh', '.reg', '.hta', '.wsf'],
    mimeTypes: [
      'application/x-msdownload',
      'application/x-msdos-program',
      'application/x-executable',
      'application/x-sh',
      'application/x-bat',
      'application/x-dos-program',
      'application/octet-stream',
      'application/x-chrome-extension',
      'application/x-msi'
    ]
  },
  DOCUMENT: {
    id: 'DOCUMENT',
    name: 'Document',
    icon: '📄',
    isHighRisk: false,
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.rtf', '.odt', '.ods', '.odp', '.epub'],
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ]
  },
  IMAGE: {
    id: 'IMAGE',
    name: 'Image',
    icon: '🖼️',
    isHighRisk: false,
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico', '.tiff', '.heic'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp', 'image/bmp']
  },
  AUDIO: {
    id: 'AUDIO',
    name: 'Audio',
    icon: '🎵',
    isHighRisk: false,
    extensions: ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/mp4', 'audio/x-m4a']
  },
  VIDEO: {
    id: 'VIDEO',
    name: 'Video',
    icon: '🎬',
    isHighRisk: false,
    extensions: ['.mp4', '.avi', '.mkv', '.mov', '.webm', '.flv', '.wmv', '.m4v'],
    mimeTypes: ['video/mp4', 'video/x-msvideo', 'video/x-matroska', 'video/quicktime', 'video/webm']
  },
  ARCHIVE: {
    id: 'ARCHIVE',
    name: 'Archive / Compressed',
    icon: '📦',
    isHighRisk: false,
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.iso', '.xz', '.tgz'],
    mimeTypes: [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      'application/x-gtar'
    ]
  },
  OTHER: {
    id: 'OTHER',
    name: 'Generic / Unknown File',
    icon: '📁',
    isHighRisk: false,
    extensions: [],
    mimeTypes: []
  }
};

export const KNOWN_SHORTENERS = [
  'bit.ly',
  't.co',
  'tinyurl.com',
  'is.gd',
  'goo.gl',
  'ow.ly',
  'buff.ly',
  'adf.ly',
  'rebrand.ly',
  'cutt.ly',
  'shorturl.at',
  'rb.gy',
  'v.gd',
  'tiny.cc'
];

export const POPULAR_TARGET_DOMAINS = [
  'google.com',
  'paypal.com',
  'microsoft.com',
  'apple.com',
  'amazon.com',
  'github.com',
  'facebook.com',
  'twitter.com',
  'linkedin.com',
  'netflix.com',
  'dropbox.com',
  'chase.com',
  'wellsfargo.com',
  'bankofamerica.com',
  'binance.com',
  'coinbase.com'
];

export const DEFAULT_SETTINGS = {
  hoverGuardEnabled: true,
  fileGuardEnabled: true,
  downloadGuardEnabled: true,
  hoverDelayMs: 150,
  intentWindowMs: 5000,
  riskThresholdMedium: 30,
  riskThresholdHigh: 60,
  autoBlockHighRiskDownloads: false,
  showLowRiskTooltips: true,
  notificationsEnabled: true,
  whitelistedDomains: [],
  securityLogsMax: 200
};

export const EVENT_TYPES = {
  LINK_HOVER_ANALYZED: 'LINK_HOVER_ANALYZED',
  FILE_MISMATCH_DETECTED: 'FILE_MISMATCH_DETECTED',
  UNEXPECTED_DOWNLOAD_DETECTED: 'UNEXPECTED_DOWNLOAD_DETECTED',
  AUTOMATIC_DOWNLOAD_DETECTED: 'AUTOMATIC_DOWNLOAD_DETECTED',
  DOWNLOAD_CANCELLED: 'DOWNLOAD_CANCELLED',
  DOWNLOAD_ALLOWED: 'DOWNLOAD_ALLOWED'
};
