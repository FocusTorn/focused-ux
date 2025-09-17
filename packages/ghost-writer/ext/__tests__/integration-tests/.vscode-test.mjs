// packages/ghost-writer/ext/__tests__/integration-tests/.vscode-test.mjs
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Resolve extension root (two levels up from integration-tests)
const extensionRoot = path.resolve(__dirname, '..', '..')

// Import helper from built dist to avoid adding a package/devDep edge
const helperUrl = new URL(
    '../../../../../libs/vscode-test-cli-config/dist/index.js',
    import.meta.url
)
const { createVscodeTestConfig } = await import(helperUrl.href)

export default createVscodeTestConfig({
    packageName: 'fux-ghost-writer',
    extensionDevelopmentPath: extensionRoot,
    workspaceFolder: './mocked-workspace',
    files: './_out-tsc/suite/**/*.integration.test.js',
    setupFiles: './_out-tsc/suite/index.js',
    skipExtensionDependencies: true,
    timeout: 30000, // 30 seconds timeout for integration tests
    // version: 'insiders' | 'stable'
})
