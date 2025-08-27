import * as assert from 'node:assert'
import * as vscode from 'vscode'

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.')

	test('Extension should be present', () => {
		const ext = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler')

		assert.ok(ext, 'Extension should be found')
		// console.log('Extension found:', ext?.id)
	})

	// test('Should activate', async () => {
	// 	assert.fail('This test is designed to fail to confirm the test suite is running.')

	// 	const ext = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler')

	// 	if (!ext) {
	// 		throw new Error('Extension not found')
	// 	}
    
	// 	await ext?.activate()
	// 	assert.ok(ext?.isActive, 'Extension should be active after activation')
	// 	console.log('Extension activated successfully')
	// })

	test('Should register all commands', async () => {
		const commands = await vscode.commands.getCommands()

		// console.log('Available commands:', commands.filter(cmd => cmd.includes('fux-project-butler')))
    
		// Check that our extension commands are registered
		const expectedCommands = [
			'fux-project-butler.formatPackageJson',
			'fux-project-butler.updateTerminalPath',
			'fux-project-butler.createBackup',
			'fux-project-butler.enterPoetryShell',
		]

		for (const command of expectedCommands) {
			assert.ok(commands.includes(command), `Command ${command} should be registered`)
		}
    
		// console.log('All expected commands are registered')
	})
})



// import * as assert from 'node:assert'
// import * as vscode from 'vscode'

// suite('Extension Test Suite', () => {
// 	vscode.window.showInformationMessage('Start all tests.')

// 	test('Extension should be present', () => {
// 		const ext = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler')

// 		assert.ok(ext, 'Extension should be found')
// 		console.log('Extension found:', ext?.id)
// 	})

// 	test('Should activate', async () => {
// 		const ext = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler')

// 		if (!ext) {
// 			throw new Error('Extension not found')
// 		}
    
// 		await ext.activate()
// 		assert.ok(ext.isActive, 'Extension should be active after activation')
// 		console.log('Extension activated successfully')
// 	})

// 	test('Should register all commands', async () => {
// 		const commands = await vscode.commands.getCommands()

// 		console.log('Available commands:', commands.filter(cmd => cmd.includes('fux-project-butler')))
    
// 		// Check that our extension commands are registered
// 		const expectedCommands = [
// 			'fux-project-butler.formatPackageJson',
// 			'fux-project-butler.updateTerminalPath',
// 			'fux-project-butler.createBackup',
// 			'fux-project-butler.enterPoetryShell',
// 		]

// 		for (const command of expectedCommands) {
// 			assert.ok(commands.includes(command), `Command ${command} should be registered`)
// 		}
    
// 		console.log('All expected commands are registered')
// 	})
// })
