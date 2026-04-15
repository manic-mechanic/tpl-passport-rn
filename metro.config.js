const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const sharedPackageRoot = path.resolve(projectRoot, '../tpl-passport-auth/packages/shared')

const config = getDefaultConfig(projectRoot)

// Watch files in the shared package so Metro picks up changes
config.watchFolders = [sharedPackageRoot]

// Prefer the react-native export condition over import/esm, preventing packages
// like zustand from resolving to their .mjs builds (which use import.meta and
// crash the web bundle).
config.resolver.unstable_conditionNames = ['react-native']

// Directly map the package name to its directory — more reliable than symlink following
config.resolver.extraNodeModules = {
  '@tpl-passport/shared': sharedPackageRoot,
}

module.exports = config
