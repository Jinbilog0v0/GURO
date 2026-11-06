import React from 'react';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GURO CENTRAL APP VERSION HUB (Web Portal)
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for web application release versioning, metadata,
 * and display helpers.
 *
 * All administration screens, settings modals, dashboards, and footers
 * reference this hub instead of manually typing or changing version strings.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const APP_VERSION = '1.0.3';
export const APP_BUILD_NUMBER = '7';
export const APP_NAME = 'GURO';
export const APP_FULL_NAME = 'GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION';
export const APP_TAGLINE = 'Guided Unified Resource Optimization';

export interface WebAppVersionMetadata {
  version: string;
  buildNumber: string;
  appName: string;
  fullName: string;
  tagline: string;
  isProduction: boolean;
  releaseYear: number;
}

/**
 * Returns current application semantic version.
 */
export function getAppVersion(): string {
  return APP_VERSION;
}

/**
 * Formats version string with optional prefix and build number.
 * @example
 * getFormattedAppVersion() -> "v1.0.2"
 * getFormattedAppVersion(true) -> "GURO v1.0.2"
 */
export function getFormattedAppVersion(includeName: boolean = false, includeBuild: boolean = false): string {
  const base = includeName ? `${APP_NAME} v${APP_VERSION}` : `v${APP_VERSION}`;
  return includeBuild ? `${base} (Build ${APP_BUILD_NUMBER})` : base;
}

/**
 * Returns standard footer branding string.
 * @example "GURO v1.0.2 • Guided Unified Resource Optimization"
 */
export function getAppVersionFooter(customTagline?: string): string {
  const tagline = customTagline || APP_TAGLINE;
  return `${APP_NAME} v${APP_VERSION} • ${tagline}`;
}

/**
 * Returns complete version metadata.
 */
export function getAppVersionMetadata(): WebAppVersionMetadata {
  let isProduction = false;
  try {
    if (typeof process !== 'undefined' && process.env) {
      isProduction = process.env.NODE_ENV === 'production';
    }
  } catch {
    // Safe fallback
  }

  return {
    version: APP_VERSION,
    buildNumber: APP_BUILD_NUMBER,
    appName: APP_NAME,
    fullName: APP_FULL_NAME,
    tagline: APP_TAGLINE,
    isProduction,
    releaseYear: 2026,
  };
}

/**
 * Drop-in React component for rendering the version tag or footer in web interfaces.
 */
export interface AppVersionBadgeProps {
  className?: string;
  variant?: 'subtle' | 'pill' | 'footer' | 'simple';
  showBuild?: boolean;
}

export const AppVersionBadge: React.FC<AppVersionBadgeProps> = ({
  className = '',
  variant = 'pill',
  showBuild = false,
}) => {
  if (variant === 'simple') {
    return React.createElement('span', { className }, `v${APP_VERSION}`);
  }

  if (variant === 'footer') {
    return React.createElement(
      'span',
      { className: `text-[11px] text-[var(--text-muted)] ${className}` },
      getAppVersionFooter()
    );
  }

  if (variant === 'subtle') {
    return React.createElement(
      'span',
      { className: `text-xs font-mono font-bold text-[var(--text-muted)] ${className}` },
      getFormattedAppVersion(true, showBuild)
    );
  }

  return React.createElement(
    'span',
    {
      className: `inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#11428E]/10 text-[#11428E] dark:text-sky-300 border border-[#11428E]/20 font-mono ${className}`,
      title: `Release ${APP_FULL_NAME}`,
    },
    getFormattedAppVersion(false, showBuild)
  );
};

export default {
  version: APP_VERSION,
  buildNumber: APP_BUILD_NUMBER,
  name: APP_NAME,
  fullName: APP_FULL_NAME,
  tagline: APP_TAGLINE,
  getAppVersion,
  getFormattedAppVersion,
  getAppVersionFooter,
  getAppVersionMetadata,
  AppVersionBadge,
};
