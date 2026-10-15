const withBuildArchitectures = require('./withBuildArchitectures');
const { resolveArchitectures, PREVIEW_ARCHS, ALL_ARCHS } = withBuildArchitectures;

describe('withBuildArchitectures config plugin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.EAS_BUILD_PROFILE;
    delete process.env.BUILD_PROFILE;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('resolveArchitectures', () => {
    it('defaults to all 4 architectures when no profile is set (development mode)', () => {
      const result = resolveArchitectures();
      expect(result.profile).toBe('development');
      expect(result.isEmulatorExcluded).toBe(false);
      expect(result.architectures).toBe('armeabi-v7a,arm64-v8a,x86,x86_64');
      expect(result.architectures).toContain('x86');
      expect(result.architectures).toContain('x86_64');
    });

    it('excludes emulators when EAS_BUILD_PROFILE is "preview"', () => {
      process.env.EAS_BUILD_PROFILE = 'preview';
      const result = resolveArchitectures();
      expect(result.profile).toBe('preview');
      expect(result.isEmulatorExcluded).toBe(true);
      expect(result.architectures).toBe('arm64-v8a,armeabi-v7a');
      expect(result.architectures).not.toContain('x86');
      expect(result.architectures).not.toContain('x86_64');
    });

    it('excludes emulators when BUILD_PROFILE is "preview"', () => {
      process.env.BUILD_PROFILE = 'preview';
      const result = resolveArchitectures();
      expect(result.profile).toBe('preview');
      expect(result.isEmulatorExcluded).toBe(true);
      expect(result.architectures).toBe('arm64-v8a,armeabi-v7a');
    });

    it('includes all 4 architectures when EAS_BUILD_PROFILE is "development"', () => {
      process.env.EAS_BUILD_PROFILE = 'development';
      const result = resolveArchitectures();
      expect(result.profile).toBe('development');
      expect(result.isEmulatorExcluded).toBe(false);
      expect(result.architectures).toBe('armeabi-v7a,arm64-v8a,x86,x86_64');
    });

    it('includes all 4 architectures when BUILD_PROFILE is "development"', () => {
      process.env.BUILD_PROFILE = 'development';
      const result = resolveArchitectures();
      expect(result.profile).toBe('development');
      expect(result.isEmulatorExcluded).toBe(false);
      expect(result.architectures).toBe('armeabi-v7a,arm64-v8a,x86,x86_64');
    });

    it('supports custom architecture lists via plugin options', () => {
      const result = resolveArchitectures({
        profile: 'preview',
        previewArchs: ['arm64-v8a'],
      });
      expect(result.architectures).toBe('arm64-v8a');
    });
  });

  describe('plugin execution with Gradle properties', () => {
    it('sets reactNativeArchitectures to device-only ABIs for preview builds', async () => {
      process.env.EAS_BUILD_PROFILE = 'preview';

      const mockConfig = { name: 'GURO-App', slug: 'guro' };
      const configWithPlugin = withBuildArchitectures(mockConfig);

      const gradlePropsMod = configWithPlugin.mods.android.gradleProperties;
      expect(typeof gradlePropsMod).toBe('function');

      const initialProps = {
        modResults: [
          { type: 'property', key: 'android.useAndroidX', value: 'true' },
          { type: 'property', key: 'reactNativeArchitectures', value: 'old-value' },
        ],
      };

      const result = await gradlePropsMod(initialProps);
      const archProp = result.modResults.find(
        (p) => p.type === 'property' && p.key === 'reactNativeArchitectures'
      );

      expect(archProp).toBeDefined();
      expect(archProp.value).toBe('arm64-v8a,armeabi-v7a');
      expect(archProp.value).not.toContain('x86');

      // Preserves other properties
      const androidxProp = result.modResults.find(
        (p) => p.type === 'property' && p.key === 'android.useAndroidX'
      );
      expect(androidxProp.value).toBe('true');
    });

    it('sets reactNativeArchitectures to all 4 ABIs for development builds', async () => {
      process.env.EAS_BUILD_PROFILE = 'development';

      const mockConfig = { name: 'GURO-App', slug: 'guro' };
      const configWithPlugin = withBuildArchitectures(mockConfig);

      const gradlePropsMod = configWithPlugin.mods.android.gradleProperties;

      const initialProps = {
        modResults: [
          { type: 'property', key: 'android.useAndroidX', value: 'true' },
        ],
      };

      const result = await gradlePropsMod(initialProps);
      const archProp = result.modResults.find(
        (p) => p.type === 'property' && p.key === 'reactNativeArchitectures'
      );

      expect(archProp).toBeDefined();
      expect(archProp.value).toBe('armeabi-v7a,arm64-v8a,x86,x86_64');
    });
  });
});
