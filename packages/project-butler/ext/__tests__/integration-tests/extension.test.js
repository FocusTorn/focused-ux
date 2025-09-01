'use strict'
Object.defineProperty(exports, '__esModule', { value: true })

const tslib_1 = require('tslib')
const assert = tslib_1.__importStar(require('node:assert'))
const vscode = tslib_1.__importStar(require('vscode'))

suite('Extension Test Suite', () => {
	test('Extension should be present and active', () => {
		const ext = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler')

		assert.ok(ext, 'Extension should be found')
		assert.ok(ext.isActive, 'Extension should be active')
	})
	test('Should register all commands', async () => {
		const commands = await vscode.commands.getCommands(true)
		const expectedCommands = [
			'fux-project-butler.formatPackageJson',
			'fux-project-butler.updateTerminalPath',
			'fux-project-butler.createBackup',
			'fux-project-butler.enterPoetryShell',
		]

		for (const command of expectedCommands) {
			assert.ok(commands.includes(command), `Command ${command} should be registered`)
		}
	})
})
//# sourceMappingURL=extension.test.js.map
