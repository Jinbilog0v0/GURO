import {
  APP_VERSION,
  APP_BUILD_NUMBER,
  APP_NAME,
  getAppVersion,
  getFormattedAppVersion,
  getAppVersionFooter,
  getAppVersionMetadata,
} from '../appVersion';

describe('Web App Version Hub', () => {
  it('should export the expected core version constants', () => {
    expect(APP_VERSION).toBe('1.0.2');
    expect(APP_BUILD_NUMBER).toBe('6');
    expect(APP_NAME).toBe('GURO');
  });

  it('should return the current version string from getAppVersion()', () => {
    expect(getAppVersion()).toBe(APP_VERSION);
  });

  it('should correctly format version strings', () => {
    expect(getFormattedAppVersion()).toBe(`v${APP_VERSION}`);
    expect(getFormattedAppVersion(true)).toBe(`GURO v${APP_VERSION}`);
    expect(getFormattedAppVersion(true, true)).toBe(`GURO v${APP_VERSION} (Build ${APP_BUILD_NUMBER})`);
  });

  it('should generate standardized footer string', () => {
    const footer = getAppVersionFooter();
    expect(footer).toContain('GURO');
    expect(footer).toContain(APP_VERSION);
  });

  it('should return complete metadata object', () => {
    const meta = getAppVersionMetadata();
    expect(meta.version).toBe(APP_VERSION);
    expect(meta.buildNumber).toBe(APP_BUILD_NUMBER);
    expect(meta.appName).toBe(APP_NAME);
  });
});
