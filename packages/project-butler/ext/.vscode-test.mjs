import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Import helper from local built dist (built via test target dependsOn)
const helperUrl = new URL('../../../libs/vscode-test-cli-config/dist/index.js', import.meta.url)
const { createVscodeTestConfig } = await import(helperUrl.href)

export default createVscodeTestConfig({
	packageName: 'fux-project-butler',
	extensionDevelopmentPath: __dirname,
	workspaceFolder: './__tests__/integration-tests/mocked-workspace',
	files: './__tests__/_out-tsc/**/*.test.js',
	setupFiles: './__tests__/_out-tsc/index.js',
})
