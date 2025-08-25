import * as path from 'node:path'
import { runTests } from '@vscode/test-electron'

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		const extensionDevelopmentPath = path.resolve(__dirname, '../../')

		// The path to test runner, compiled to JS
		const extensionTestsPath = path.resolve(__dirname, './dist/suite/index.js')

		// The path to the test workspace
		const testWorkspacePath = path.resolve(__dirname, './test-workspace')

		// Ensure test directories exist
		const fs = require('node:fs')

		if (!fs.existsSync(testWorkspacePath)) {
			fs.mkdirSync(testWorkspacePath, { recursive: true })
		}
		if (!fs.existsSync(path.resolve(__dirname, './test-user-data'))) {
			fs.mkdirSync(path.resolve(__dirname, './test-user-data'), { recursive: true })
		}
		if (!fs.existsSync(path.resolve(__dirname, './test-extensions'))) {
			fs.mkdirSync(path.resolve(__dirname, './test-extensions'), { recursive: true })
		}

		// Download VS Code, unzip it and run the integration test
		await runTests({
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [
				testWorkspacePath, // Open the test workspace
				'--disable-extensions',
				'--disable-workspace-trust',
				'--disable-telemetry',
				'--disable-updates',
				'--skip-welcome',
				'--skip-release-notes',
				'--disable-gpu',
				'--no-sandbox',
				'--disable-dev-shm-usage',
				'--disable-features=VSCodeWebNode',
				'--disable-authentication-providers',
				'--disable-git',
				`--user-data-dir=${path.resolve(__dirname, './test-user-data')}`,
				`--extensions-dir=${path.resolve(__dirname, './test-extensions')}`,
			],
		})
	}
	catch (err) {
		console.error('--------------------------------------------------')
		console.error('🔥🔥🔥 Integration Tests Failed 🔥🔥🔥')
		console.error('--------------------------------------------------')
		console.error('The test runner process exited with an error, which likely means one or more tests failed.')
		console.error('If the logs above do not show which tests failed, a critical error may have occurred during test setup.')
		console.error('\nRaw Error:', err)
		console.error('--------------------------------------------------')
		process.exit(1)
	}
}

main()
