'use strict'
Object.defineProperty(exports, '__esModule', { value: true })

const tslib_1 = require('tslib')
const assert = tslib_1.__importStar(require('node:assert'))
const vscode = tslib_1.__importStar(require('vscode'))

suite('Dynamicons Extension Integration Tests', () => {
	// Increase timeout for extension activation
	suiteSetup(async function () {
		this.timeout(10000) // 10 seconds for setup
	})
	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('NewRealityDesigns.fux-dynamicons')

		console.log('Available extensions:', vscode.extensions.all.map(ext => ext.id))
		console.log('Looking for extension: NewRealityDesigns.fux-dynamicons')
		console.log('Found extension:', extension)
		assert.ok(extension, 'Extension should be present')
	})
	test('Extension should be activated', async function () {
		this.timeout(10000) // 10 seconds for activation

		const extension = vscode.extensions.getExtension('NewRealityDesigns.fux-dynamicons')

		if (extension) {
			// Force activation since the extension uses onStartupFinished
			await extension.activate()
			assert.ok(extension.isActive, 'Extension should be activated')
		}
	})
	test('Should have basic commands available after activation', async () => {
		// First ensure extension is activated
		const extension = vscode.extensions.getExtension('NewRealityDesigns.fux-dynamicons')

		if (extension && !extension.isActive) {
			await extension.activate()
		}
		// Wait a bit for commands to be registered
		await new Promise(resolve => setTimeout(resolve, 1000))

		const commands = await vscode.commands.getCommands()
		const dynamiconsCommands = commands.filter(cmd => cmd.includes('dynamicons'))

		console.log('All commands:', commands)
		console.log('Dynamicons commands found:', dynamiconsCommands)
		assert.ok(dynamiconsCommands.length > 0, 'Should have at least one Dynamicons command')
	})
	test('Should have specific Dynamicons commands after activation', async () => {
		// First ensure extension is activated
		const extension = vscode.extensions.getExtension('NewRealityDesigns.fux-dynamicons')

		if (extension && !extension.isActive) {
			await extension.activate()
		}
		// Wait a bit for commands to be registered
		await new Promise(resolve => setTimeout(resolve, 1000))

		const commands = await vscode.commands.getCommands()
		const expectedCommands = [
			'dynamicons.activateIconTheme',
			'dynamicons.assignIcon',
			'dynamicons.revertIcon',
			'dynamicons.toggleExplorerArrows',
			'dynamicons.showUserFileIconAssignments',
			'dynamicons.showUserFolderIconAssignments',
			'dynamicons.refreshIconTheme',
		]
		const foundCommands = expectedCommands.filter(cmd => commands.includes(cmd))

		console.log('Expected commands:', expectedCommands)
		console.log('Found commands:', foundCommands)
		assert.ok(foundCommands.length > 0, `Should have at least one Dynamicons command. Found: ${foundCommands.join(', ')}`)
	})
})
//# sourceMappingURL=extension.test.js.map
