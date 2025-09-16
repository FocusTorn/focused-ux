import * as vscode from 'vscode'

// Import all integration test suites
import './extension.test.js'
import './backup.test.js'
import './package-json-formatting.test.js'
import './terminal-management.test.js'
import './poetry-shell.test.js'

/**
 * Mocha root hooks to manage the integration test suite's lifecycle.
 */
export const mochaHooks = {
	/**
	 * Runs once before all tests.
	 */
	async beforeAll() {
		console.log('--- Global setup: Activating extension ---')

		const ext = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler')

		if (ext && !ext.isActive) {
			await ext.activate()
		}
		console.log('--- Extension activated ---')
	},

	/**
	 * Runs once after all tests.
	 */
	async afterAll() {
		console.log('--- Global teardown: Closing editors ---')
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		console.log('--- Teardown complete ---')
		// A small delay to ensure VS Code processes can settle before the test runner exits.
		await new Promise(resolve => setTimeout(resolve, 500))
	},
}


