const { withGradleProperties, AndroidConfig, createRunOncePlugin } = require('@expo/config-plugins');

const PKG_NAME = 'with-build-architectures';
const PKG_VERSION = '1.0.0';

// Real device architectures (excluding emulators: x86, x86_64)
const PREVIEW_ARCHS = ['armeabi-v7a', 'arm64-v8a'];

// All 4 standard Android architectures (including Intel/AMD emulators: x86, x86_64)
const ALL_ARCHS = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];

/**
 * Determine the target Android architectures based on build profile:
 * - 'preview': Excludes emulators (x86, x86_64), only bundles physical device ARM architectures (armeabi-v7a, arm64-v8a)
 * - 'development' (or default): Bundles all 4 architectures so emulators and devices work seamlessly
 */
function resolveArchitectures(options = {}) {
  const profile = (
    process.env.EAS_BUILD_PROFILE ||
    process.env.BUILD_PROFILE ||
    options.profile ||
    ''
  ).toLowerCase().trim();

  if (profile === 'preview') {
    const list = options.previewArchs || PREVIEW_ARCHS;
    return {
      profile: 'preview',
      architectures: Array.isArray(list) ? list.join(',') : list,
      isEmulatorExcluded: true,
    };
  }

  const list = options.developmentArchs || ALL_ARCHS;
  return {
    profile: profile || 'development',
    architectures: Array.isArray(list) ? list.join(',') : list,
    isEmulatorExcluded: false,
  };
}

/**
 * Config plugin that configures `reactNativeArchitectures` in `gradle.properties`
 * based on the active EAS build profile.
 */
function withBuildArchitectures(config, options = {}) {
  return withGradleProperties(config, (gradlePropsConfig) => {
    const { profile, architectures, isEmulatorExcluded } = resolveArchitectures(options);

    console.log(
      `[withBuildArchitectures] Profile: "${profile}" | Exclude emulators: ${isEmulatorExcluded} | Architectures: ${architectures}`
    );

    AndroidConfig.BuildProperties.updateAndroidBuildProperty(
      gradlePropsConfig.modResults,
      'reactNativeArchitectures',
      architectures
    );

    return gradlePropsConfig;
  });
}

module.exports = createRunOncePlugin(withBuildArchitectures, PKG_NAME, PKG_VERSION);
module.exports.resolveArchitectures = resolveArchitectures;
module.exports.PREVIEW_ARCHS = PREVIEW_ARCHS;
module.exports.ALL_ARCHS = ALL_ARCHS;
