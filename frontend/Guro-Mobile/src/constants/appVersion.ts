import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import * as Updates from 'expo-updates';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * GURO CENTRAL APP VERSION HUB (Mobile Client)
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for the application version, build number, release
 * channel, and version formatting.
 *
 * All screens, diagnostics, footers, settings menus, and OTA update services
 * reference this hub instead of manually hardcoding version strings.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const APP_VERSION = '1.0.3';
export const APP_BUILD_NUMBER = '7';
export const APP_VERSION_CODE = 15;
export const APP_NAME = 'GURO';
export const APP_FULL_NAME = 'GURO: GUIDED UNIFIED RESOURCE OPTIMIZATION';
export const APP_TAGLINE = 'Offline-first · SQLite powered';

export interface AppVersionMetadata {
  version: string;
  buildNumber: string;
  versionCode: number;
  appName: string;
  runtimeVersion: string;
  channel: string;
  isEmbeddedLaunch: boolean;
  isDev: boolean;
  tagline: string;
}

/**
 * Returns the current active semantic version string.
 * Prefers the active runtime version from EAS Updates if running in a production bundle,
 * otherwise defaults to the centralized APP_VERSION.
 */
export function getAppVersion(): string {
  try {
    if (Updates.runtimeVersion && typeof Updates.runtimeVersion === 'string') {
      return Updates.runtimeVersion;
    }
  } catch {
    // Fallback if Updates native module is uninitialized or in test environment
  }
  return APP_VERSION;
}

/**
 * Formats the version string for UI display.
 * @example
 * getFormattedAppVersion() -> "v1.0.2"
 * getFormattedAppVersion(true) -> "GURO v1.0.2"
 * getFormattedAppVersion(false, true) -> "v1.0.2 (Build 6)"
 */
export function getFormattedAppVersion(includeName: boolean = false, includeBuild: boolean = false): string {
  const version = getAppVersion();
  const base = includeName ? `${APP_NAME} v${version}` : `v${version}`;
  return includeBuild ? `${base} (Build ${APP_BUILD_NUMBER})` : base;
}

/**
 * Generates the standardized branding footer used across authentication and settings screens.
 * @example "GURO v1.0.2 · Offline-first · SQLite powered"
 */
export function getAppVersionFooter(customTagline?: string): string {
  const tagline = customTagline || APP_TAGLINE;
  return `${APP_NAME} v${getAppVersion()} · ${tagline}`;
}

/**
 * Returns comprehensive version and build metadata for diagnostics and settings panels.
 */
export function getAppVersionMetadata(): AppVersionMetadata {
  let runtimeVersion = APP_VERSION;
  let channel = 'development';
  let isEmbeddedLaunch = true;

  try {
    if (Updates.runtimeVersion) runtimeVersion = Updates.runtimeVersion;
    if (Updates.channel) channel = Updates.channel;
    if (Updates.isEmbeddedLaunch !== undefined) isEmbeddedLaunch = Updates.isEmbeddedLaunch;
  } catch {
    // Safe fallback
  }

  return {
    version: APP_VERSION,
    buildNumber: APP_BUILD_NUMBER,
    versionCode: APP_VERSION_CODE,
    appName: APP_NAME,
    runtimeVersion,
    channel,
    isEmbeddedLaunch,
    isDev: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
    tagline: APP_TAGLINE,
  };
}

/**
 * Drop-in React Native component for effortlessly rendering the app version
 * anywhere on any screen without hardcoding text.
 */
interface AppVersionTextProps {
  style?: StyleProp<TextStyle>;
  variant?: 'footer' | 'badge' | 'full' | 'simple';
  customTagline?: string;
  testID?: string;
}

export function AppVersionText({
  style,
  variant = 'footer',
  customTagline,
  testID = 'app-version-text',
}: AppVersionTextProps) {
  let displayText = '';

  switch (variant) {
    case 'simple':
      displayText = `v${getAppVersion()}`;
      break;
    case 'badge':
      displayText = getFormattedAppVersion(true, false);
      break;
    case 'full':
      displayText = getFormattedAppVersion(true, true);
      break;
    case 'footer':
    default:
      displayText = getAppVersionFooter(customTagline);
      break;
  }

  return React.createElement(
    Text,
    {
      style,
      testID,
      accessibilityLabel: `App Version ${getAppVersion()}`,
    },
    displayText
  );
}

export default {
  version: APP_VERSION,
  buildNumber: APP_BUILD_NUMBER,
  versionCode: APP_VERSION_CODE,
  name: APP_NAME,
  fullName: APP_FULL_NAME,
  tagline: APP_TAGLINE,
  getAppVersion,
  getFormattedAppVersion,
  getAppVersionFooter,
  getAppVersionMetadata,
  AppVersionText,
};
