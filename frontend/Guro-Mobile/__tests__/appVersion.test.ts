import {
  APP_VERSION,
  APP_BUILD_NUMBER,
  APP_VERSION_CODE,
  APP_NAME,
  getAppVersion,
  getFormattedAppVersion,
  getAppVersionFooter,
  getAppVersionMetadata,
} from '../src/constants/appVersion';

describe('App Version Hub', () => {
  it('should export the expected core version constants', () => {
    expect(APP_VERSION).toBe('1.0.3');
    expect(APP_BUILD_NUMBER).toBe('7');
    expect(APP_VERSION_CODE).toBe(13);
    expect(APP_NAME).toBe('GURO');
  });

  it('should return the current version string from getAppVersion()', () => {
    const version = getAppVersion();
    expect(typeof version).toBe('string');
    expect(version).toBeTruthy();
  });

  it('should correctly format version strings', () => {
    const formattedShort = getFormattedAppVersion();
    expect(formattedShort).toContain('v');
    expect(formattedShort).toContain(APP_VERSION);

    const formattedWithName = getFormattedAppVersion(true);
    expect(formattedWithName).toContain('GURO');
    expect(formattedWithName).toContain(APP_VERSION);

    const formattedWithBuild = getFormattedAppVersion(true, true);
    expect(formattedWithBuild).toContain(`Build ${APP_BUILD_NUMBER}`);
  });

  it('should generate standardized footer string', () => {
    const footer = getAppVersionFooter();
    expect(footer).toContain('GURO');
    expect(footer).toContain(APP_VERSION);
    expect(footer).toContain('Offline-first · SQLite powered');
  });

  it('should return complete metadata object', () => {
    const meta = getAppVersionMetadata();
    expect(meta.version).toBe(APP_VERSION);
    expect(meta.buildNumber).toBe(APP_BUILD_NUMBER);
    expect(meta.versionCode).toBe(APP_VERSION_CODE);
    expect(meta.appName).toBe(APP_NAME);
    expect(meta.tagline).toBeTruthy();
  });
});
