const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const sharedPackageRoot = path.resolve(projectRoot, '../tpl-passport-auth/packages/shared')

const config = getDefaultConfig(projectRoot)

// Watch files in the shared package so Metro picks up changes
config.watchFolders = [sharedPackageRoot]

// Directly map the package name to its directory — more reliable than symlink following
config.resolver.extraNodeModules = {
  '@tpl-passport/shared': sharedPackageRoot,
}

module.exports = config
