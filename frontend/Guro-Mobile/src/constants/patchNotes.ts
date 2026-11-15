/**
 * GURO — Patch Notes & Version History Hub
 * Single source of truth for version changelogs, OTA patch notes, and release highlights.
 */

export interface PatchNoteItem {
  version: string;
  date: string;
  title: string;
  badge?: string;
  badgeVariant?: 'success' | 'primary' | 'secondary' | 'warning';
  highlights: string[];
  fixes?: string[];
}

export const PATCH_NOTES_HISTORY: PatchNoteItem[] = [
  {
    version: '1.0.5',
    date: 'November 2026',
    title: 'In-App OTA Updates, Version Hub & Patch Notes',
    badge: 'LATEST RELEASE',
    badgeVariant: 'success',
    highlights: [
      '🔄 In-App Over-The-Air (OTA) updates engine with zero-downtime hot reload.',
      '✨ Global update modal with release highlights and instant upgrade button.',
      '📋 Dedicated "What\'s New & Updates" release notes screen with full changelog history.',
      '🔍 Real-time EAS update check button and installed build metadata inspector.',
    ],
    fixes: [
      'Added startup 4-second non-blocking update check guard.',
      'Integrated unread update badges across Settings and Teacher dashboards.',
    ],
  },
  {
    version: '1.0.4',
    date: 'November 2026',
    title: 'UI/UX Dark Mode, Chat Responsiveness & Security Challenges',
    badge: 'STABLE',
    badgeVariant: 'primary',
    highlights: [
      '🌓 WCAG AA Compliant Light & Dark mode themes with instant theme switcher in Settings.',
      '💬 Smooth mobile keyboard responsiveness in Teacher & Parent chat pages with safe-area insets.',
      '🛡️ Security verification challenge & safety countdown timers for destructive actions (Delete, Purge, Wipe).',
      '📱 Dynamic 100dvh viewport and anti-zoom touch targets across consultations and student spaces.',
    ],
    fixes: [
      'Eliminated Android keyboard double-pass lag by immediately handling onFocus tab visibility.',
      'Prevented accidental classroom and user deletions with exact confirmation token validation.',
      'Enhanced touch target compliance to 44x44px minimum across all mobile buttons.',
    ],
  },
  {
    version: '1.0.3',
    date: 'November 2026',
    title: 'Onboarding Coach Marks & Teacher Daily Attendance SF2',
    badge: 'STABLE',
    badgeVariant: 'primary',
    highlights: [
      '✨ Interactive student feature tour with visual coach marks and spotlight highlights.',
      '📋 Teacher Daily Attendance Roll Call console with DepEd SF2 export capabilities.',
      '🆔 Strict 12-digit DepEd Learner Reference Number (LRN) validation for student accounts.',
      '👥 Bulk student roster master list import and automated section enrollment.',
    ],
    fixes: [
      'Optimized SQLite Write-Ahead Logging (WAL) concurrency during bulk student syncing.',
      'Resolved parent progress card layout clipping on narrow mobile screens.',
    ],
  },
  {
    version: '1.0.2',
    date: 'November 2026',
    title: 'Diagnostic Reports & Progress Analytics',
    badge: 'STABLE',
    badgeVariant: 'secondary',
    highlights: [
      '📊 In-depth Student Diagnostic Reports with radar chart mastery visualizer.',
      '📁 Local file system diagnostic export and historical session report viewer.',
      '⏱️ Timed assessment mode with anti-tamper tracking and auto-submission on expiration.',
    ],
    fixes: [
      'Refined assessment scoring calculations for mixed-format item banks.',
      'Improved offline SQLite sync queue recovery after network interruptions.',
    ],
  },
  {
    version: '1.0.1',
    date: 'October 2026',
    title: 'Interactive Item Bank & Voice Support',
    badge: 'STABLE',
    badgeVariant: 'secondary',
    highlights: [
      '🧩 Matching pairs and interactive gamified question types.',
      '🔊 Text-to-speech pronunciation support for Filipino and English vocabulary items.',
      '🎨 Custom avatar emojis and student personalization options.',
    ],
    fixes: [
      'Fixed audio playback interrupt issues during fast question transitions.',
      'Enhanced offline database query indexing for faster quiz generation.',
    ],
  },
  {
    version: '1.0.0',
    date: 'October 2026',
    title: 'Initial Production Release',
    badge: 'INITIAL',
    badgeVariant: 'secondary',
    highlights: [
      '⚡ Complete offline-first learning system powered by SQLite local database.',
      '🔄 EAS Over-The-Air (OTA) zero-downtime update engine with runtimeVersion locking.',
      '📚 DepEd MELC-aligned curriculum content for Grades 1 to 3 across English, Math, and Filipino.',
      '🤝 Dedicated Parent and Teacher consultation workspaces.',
    ],
    fixes: [
      'Initial release release optimizations and battery preservation fixes.',
    ],
  },
];

export default PATCH_NOTES_HISTORY;
