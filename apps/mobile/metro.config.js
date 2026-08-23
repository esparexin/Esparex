const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve unique instances of peer dependencies
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === './index' ||
    moduleName === 'index' ||
    moduleName === './apps/mobile/index' ||
    moduleName.endsWith('/index') ||
    moduleName.endsWith('index.js')
  ) {
    if (context.originModulePath === workspaceRoot || context.originModulePath === `${workspaceRoot}/.` || context.originModulePath === projectRoot) {
      return {
        type: 'sourceFile',
        filePath: path.resolve(projectRoot, 'index.js'),
      };
    }
  }

  const redirectMap = {
    'react-native-safe-area-context': path.resolve(projectRoot, 'node_modules/react-native-safe-area-context'),
    'react-native-svg': path.resolve(projectRoot, 'node_modules/react-native-svg'),
    'react': path.resolve(workspaceRoot, 'node_modules/react'),
    'react-native': path.resolve(workspaceRoot, 'node_modules/react-native'),
  };

  if (redirectMap[moduleName]) {
    return context.resolveRequest(context, redirectMap[moduleName], platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: './global.css',
  configPath: path.resolve(__dirname, 'tailwind.config.js'),
});
