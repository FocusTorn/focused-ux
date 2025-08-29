import { createVscodeTestConfig } from '@fux/vscode-test-cli-config'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default createVscodeTestConfig({
    packageName: 'fux-dynamicons',
    extensionDevelopmentPath: __dirname,
    workspaceFolder: './__tests__/integration-tests/mocked-workspace',
    files: './__tests__/_out-tsc/**/*.test.js',
    setupFiles: './__tests__/_out-tsc/index.js',
})
