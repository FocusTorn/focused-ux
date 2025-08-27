import * as assert from 'node:assert'
import * as vscode from 'vscode'
import * as path from 'node:path'
import * as fs from 'node:fs'

suite('Package.json Formatting Test Suite', () => {
	let testWorkspaceRoot = ''
	let packageJsonPath = ''
	let originalPackageJsonContent = ''
  
	suiteSetup(() => {
		testWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
		assert.ok(testWorkspaceRoot, 'Test workspace should be available')
		packageJsonPath = path.join(testWorkspaceRoot, 'package.json')
		
		// Store original content for cleanup
		if (fs.existsSync(packageJsonPath)) {
			originalPackageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
		}
	})

	suiteTeardown(() => {
		// Restore original package.json content
		if (originalPackageJsonContent) {
			fs.writeFileSync(packageJsonPath, originalPackageJsonContent)
		}
	})

	test('Should format package.json via context menu', async () => { //>
		const packageJsonUri = vscode.Uri.file(packageJsonPath)

		// Verify the command is registered
		const commands = await vscode.commands.getCommands()
		const formatCommand = commands.find(cmd => cmd.includes('formatPackageJson'))
		assert.ok(formatCommand, 'Format package.json command should be registered')
		
		// Execute the format command
		await vscode.commands.executeCommand('fux-project-butler.formatPackageJson', packageJsonUri)
		
		// Verify the package.json was formatted (should still exist and be valid JSON)
		assert.ok(fs.existsSync(packageJsonPath), 'Package.json should still exist after formatting')
		
		const formattedContent = fs.readFileSync(packageJsonPath, 'utf8')
		const parsed = JSON.parse(formattedContent)
		assert.ok(parsed.name, 'Formatted package.json should be valid JSON with name field')
	}) //<

	test('Should format package.json via command palette (active editor)', async () => { //>
		const document = await vscode.workspace.openTextDocument(packageJsonPath)

		await vscode.window.showTextDocument(document)
		assert.ok(vscode.window.activeTextEditor, 'Should have an active text editor')
		assert.strictEqual(vscode.window.activeTextEditor.document.uri.fsPath, packageJsonPath, 'Active editor should be package.json')
		
		await vscode.commands.executeCommand('fux-project-butler.formatPackageJson')

		// Verify the package.json was formatted
		assert.ok(fs.existsSync(packageJsonPath), 'Package.json should still exist after formatting')
		
		const formattedContent = fs.readFileSync(packageJsonPath, 'utf8')
		const parsed = JSON.parse(formattedContent)
		assert.ok(parsed.name, 'Formatted package.json should be valid JSON with name field')
	}) //<

	test('Should reject format command with no active file', async () => { //>
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		await assert.rejects(
			async () => {
				await vscode.commands.executeCommand('fux-project-butler.formatPackageJson')
			},
			(err: any) => {
				assert.strictEqual(err.message, 'No package.json file selected or active.')
				return true
			},
			'Command should have rejected with an error.',
		)
	}) //<

	test('Should reject format command with non-package.json file', async () => { //>
		const nonPackageJsonPath = path.join(testWorkspaceRoot, 'test-file.txt')
		const nonPackageJsonUri = vscode.Uri.file(nonPackageJsonPath)

		await assert.rejects(
			async () => {
				await vscode.commands.executeCommand('fux-project-butler.formatPackageJson', nonPackageJsonUri)
			},
			(err: any) => {
				assert.strictEqual(err.message, 'This command can only be run on a package.json file.')
				return true
			},
			'Command should have rejected with an error.',
		)
	}) //<

	test('Should reject format command with non-existent package.json', async () => { //>
		const nonExistentPath = path.join(testWorkspaceRoot, 'non-existent', 'package.json')
		const nonExistentUri = vscode.Uri.file(nonExistentPath)

		await assert.rejects(
			async () => {
				await vscode.commands.executeCommand('fux-project-butler.formatPackageJson', nonExistentUri)
			},
			(err: any) => {
				// Should fail with a file system error when trying to read the package.json
				assert.ok(err.message.includes('Failed to read package.json') || err.code === 'ENOENT' || err.message.includes('does not exist') || err.message.includes('ENOENT'), 
					`Expected file system error but got: ${err.message} (code: ${err.code})`)
				return true
			},
			'Command should have rejected with a file system error.',
		)
	}) //<
})
