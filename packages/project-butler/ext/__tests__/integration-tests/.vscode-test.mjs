import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolve extension root (two levels up from integration-tests)
const extensionRoot = path.resolve(__dirname, '..', '..')

// Import helper from built dist to avoid adding a package/devDep edge
const helperUrl = new URL('../../../../../libs/vscode-test-cli-config/dist/index.js', import.meta.url)
const { createVscodeTestConfig } = await import(helperUrl.href)

export default createVscodeTestConfig({
    packageName: 'fux-project-butler',
    // Must point to extension root
    extensionDevelopmentPath: extensionRoot,
    // Config file lives in integration-tests/, so workspace is local subfolder
    workspaceFolder: './mocked-workspace',
    // Point to compiled JS relative to this config file location
    files: './_out-tsc/suite/**/*.test.js',
    setupFiles: './_out-tsc/suite/index.js',
    skipExtensionDependencies: true,
})


