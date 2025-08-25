import * as assert from 'node:assert'
import * as vscode from 'vscode'

suite('Minimal Test', () => {
	test('Extension should be found and active', () => {
		// Try multiple possible extension IDs for development testing
		const possibleIds = [
			'NewRealityDesigns.fux-project-butler',
			'fux-project-butler',
			'project-butler'
		]
		
		let extension = null
		for (const id of possibleIds) {
			extension = vscode.extensions.getExtension(id)
			if (extension) {
				console.log(`Found extension with ID: ${id}`)
				break
			}
		}
		
		if (!extension) {
			// List all available extensions for debugging
			const allExtensions = vscode.extensions.all
			console.log('Available extensions:', allExtensions.map(ext => ext.id))
		}
		
		assert.ok(extension, `Extension should be found. Tried: ${possibleIds.join(', ')}`)
		assert.strictEqual(extension.isActive, true, 'Extension should be active')
	})

	test('Commands should be registered', async () => {
		const commands = await vscode.commands.getCommands()
		console.log('Available commands:', commands.filter(cmd => cmd.includes('fux') || cmd.includes('project')))
		
		const expectedCommands = [
			'fux-project-butler.formatPackageJson',
			'fux-project-butler.updateTerminalPath',
			'fux-project-butler.createBackup',
			'fux-project-butler.enterPoetryShell'
		]
		
		for (const expectedCmd of expectedCommands) {
			assert.ok(commands.includes(expectedCmd), `Command '${expectedCmd}' should be registered`)
		}
	})
})
