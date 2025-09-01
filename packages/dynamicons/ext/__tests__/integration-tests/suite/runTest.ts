import * as path from 'node:path'
import { exit } from 'node:process'

import {
	runTests,
	downloadAndUnzipVSCode,
	resolveCliArgsFromVSCodeExecutablePath,
	resolveCliPathFromVSCodeExecutablePath,
} from '@vscode/test-electron'

async function main() {
	try {
		// The folder containing the Extension Manifest package.json
		const extensionDevelopmentPath = path.resolve(__dirname, '../../../')

		// The path to test runner
		const extensionTestsPath = path.resolve(__dirname, './suite')

		const vscodeExecutablePath = await downloadAndUnzipVSCode('1.85.0')
		const _cliPath = resolveCliPathFromVSCodeExecutablePath(vscodeExecutablePath)
		const [_cli, ..._args] = resolveCliArgsFromVSCodeExecutablePath(vscodeExecutablePath)

		// Use cp.spawn / cp.exec for custom setup
		// const cp = require('child_process');
		// await new Promise((resolve, reject) => {
		//   cp.spawn(cli, [...args, '--install-extension', '<EXTENSION-ID-OR-PATH-TO-VSIX>'], { 
		//     cwd: extensionDevelopmentPath, 
		//     stdio: 'inherit' 
		//   }).on('error', reject).on('close', resolve);
		// });

		// Download VS Code, unzip it and run the integration test
		await runTests({
			vscodeExecutablePath,
			extensionDevelopmentPath,
			extensionTestsPath,
			launchArgs: [
				'--disable-extensions',
				'--disable-workspace-trust',
				'--disable-telemetry',
				'--disable-updates',
				'--disable-crash-reporter',
				'--disable-background-timer-throttling',
				'--disable-renderer-backgrounding',
				'--disable-backgrounding-occluded-windows',
				'--disable-features=TranslateUI',
				'--disable-ipc-flooding-protection',
				'--no-sandbox',
				'--disable-dev-shm-usage',
				'--disable-web-security',
				'--disable-features=VizDisplayCompositor',
			],
		})
	}
	catch (_err) {
		console.error('Failed to run tests')
		exit(1)
	}
}

main()
