import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const helperUrl = new URL(
    '../../../../../libs/vscode-test-cli-config/dist/index.js',
    import.meta.url
)
const { createVscodeTestConfig } = await import(helperUrl.href)

export default createVscodeTestConfig({
    packageName: 'fux-note-hub',
    extensionDevelopmentPath: path.resolve(__dirname, '../..'),
    workspaceFolder: './mocked-workspace',
    files: '../_out-tsc/**/*.test.js',
    setupFiles: '../_out-tsc/index.js',
})
