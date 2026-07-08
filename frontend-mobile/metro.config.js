const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// Monorepo npm workspaces: observa a raiz e resolve nos dois node_modules
config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// A raiz tem react@18 (hoisted do frontend-web), mas o react-native 0.81
// exige exatamente o react@19 deste pacote. Sem este pin, o bundle mistura
// as duas cópias e o app crasha na inicialização (ReactSharedInternals.S).
const reactDir = path.resolve(projectRoot, 'node_modules/react')
const REACT_MODULES = {
  'react': path.join(reactDir, 'index.js'),
  'react/jsx-runtime': path.join(reactDir, 'jsx-runtime.js'),
  'react/jsx-dev-runtime': path.join(reactDir, 'jsx-dev-runtime.js'),
  'react/compiler-runtime': path.join(reactDir, 'compiler-runtime.js'),
}

const defaultResolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (REACT_MODULES[moduleName]) {
    return { filePath: REACT_MODULES[moduleName], type: 'sourceFile' }
  }
  if (defaultResolveRequest) return defaultResolveRequest(context, moduleName, platform)
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
