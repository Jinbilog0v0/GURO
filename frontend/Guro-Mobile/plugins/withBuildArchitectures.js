/**
 * Zero-dependency helper to update a property in Gradle properties array
 */
function updateGradleProperty(gradleProperties, name, value) {
  if (!Array.isArray(gradleProperties)) return gradleProperties;
  const oldPropIndex = gradleProperties.findIndex(
    (prop) => prop.type === 'property' && prop.key === name
  );
  if (oldPropIndex >= 0) {
    gradleProperties[oldPropIndex].value = value;
  } else {
    gradleProperties.push({
      type: 'property',
      key: name,
      value,
    });
  }
  return gradleProperties;
}

/**
 * Robustly load @expo/config-plugins helpers, falling back to safe zero-dependency
 * implementations if run in early pre-install phases on EAS build workers.
 */
function getPluginHelpers() {
  // 1. Try local project require
  try {
    const cp = require('@expo/config-plugins');
    if (cp && cp.withGradleProperties) {
      return {
        withGradleProperties: cp.withGradleProperties,
        updateProperty: cp.AndroidConfig?.BuildProperties?.updateAndroidBuildProperty || updateGradleProperty,
        createRunOncePlugin: cp.createRunOncePlugin,
      };
    }
  } catch {}

  // 2. Try requiring via parent module (EAS build worker plugin resolver)
  if (module.parent && typeof module.parent.require === 'function') {
    try {
      const cp = module.parent.require('@expo/config-plugins');
      if (cp && cp.withGradleProperties) {
        return {
          withGradleProperties: cp.withGradleProperties,
          updateProperty: cp.AndroidConfig?.BuildProperties?.updateAndroidBuildProperty || updateGradleProperty,
          createRunOncePlugin: cp.createRunOncePlugin,
        };
      }
    } catch {}
  }

  // 3. Try standard EAS worker global search paths
  const workerPaths = [
    '/usr/local/eas-build-worker/node_modules/@expo/config-plugins',
    '/usr/local/lib/node_modules/@expo/config-plugins',
  ];
  for (const p of workerPaths) {
    try {
      const cp = require(p);
      if (cp && cp.withGradleProperties) {
        return {
          withGradleProperties: cp.withGradleProperties,
          updateProperty: cp.AndroidConfig?.BuildProperties?.updateAndroidBuildProperty || updateGradleProperty,
          createRunOncePlugin: cp.createRunOncePlugin,
        };
      }
    } catch {}
  }

  // 4. Zero-dependency fallback: replicates Expo's withGradleProperties mod mechanism
  return {
    withGradleProperties: (config, action) => {
      config.mods = config.mods || {};
      config.mods.android = config.mods.android || {};
      const prevAction = config.mods.android.gradleProperties;
      config.mods.android.gradleProperties = async (propsConfig) => {
        let currentConfig = propsConfig;
        if (typeof prevAction === 'function') {
          currentConfig = await prevAction(currentConfig);
        }
        return action(currentConfig);
      };
      return config;
    },
    updateProperty: updateGradleProperty,
    createRunOncePlugin: (plugin, name, version) => {
      return (config, props) => plugin(config, props);
    },
  };
}

const PKG_NAME = 'with-build-architectures';
const PKG_VERSION = '1.0.0';

// Physical device architectures (excluding emulators: x86, x86_64)
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
  const { withGradleProperties, updateProperty } = getPluginHelpers();

  return withGradleProperties(config, (gradlePropsConfig) => {
    const { profile, architectures, isEmulatorExcluded } = resolveArchitectures(options);

    console.log(
      `[withBuildArchitectures] Profile: "${profile}" | Exclude emulators: ${isEmulatorExcluded} | Architectures: ${architectures}`
    );

    updateProperty(
      gradlePropsConfig.modResults,
      'reactNativeArchitectures',
      architectures
    );

    return gradlePropsConfig;
  });
}

const { createRunOncePlugin } = getPluginHelpers();
const exportedPlugin = createRunOncePlugin(withBuildArchitectures, PKG_NAME, PKG_VERSION);

module.exports = exportedPlugin;
module.exports.default = exportedPlugin;
module.exports.resolveArchitectures = resolveArchitectures;
module.exports.PREVIEW_ARCHS = PREVIEW_ARCHS;
module.exports.ALL_ARCHS = ALL_ARCHS;
