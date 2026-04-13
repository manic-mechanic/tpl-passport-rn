const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const sharedPackageRoot = path.resolve(projectRoot, '../tpl-passport-auth/packages/shared')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [sharedPackageRoot]

config.resolver.unstable_enableSymlinks = true

module.exports = config
