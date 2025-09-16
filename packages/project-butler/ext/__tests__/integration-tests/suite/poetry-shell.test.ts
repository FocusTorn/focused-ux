import * as assert from 'node:assert'
import * as vscode from 'vscode'
import * as path from 'node:path'
import * as fs from 'node:fs'

suite('Poetry Shell Test Suite', () => {
	let testWorkspaceRoot = ''
	let testFilePath = ''
	 
	suiteSetup(() => {
		testWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
		assert.ok(testWorkspaceRoot, 'Test workspace should be available')
		testFilePath = path.join(testWorkspaceRoot, 'test-file.txt')
	})

	test('Should enter poetry shell via context menu', async () => { //>
		const fileUri = vscode.Uri.file(testFilePath)

		// Verify the command is registered
		const commands = await vscode.commands.getCommands()
		const poetryCommand = commands.find(cmd => cmd.includes('enterPoetryShell'))

		assert.ok(poetryCommand, 'Enter poetry shell command should be registered')
		
		// Execute the poetry shell command
		await vscode.commands.executeCommand('fux-project-butler.enterPoetryShell', fileUri)
		
		// Command should complete without error
		// Note: In test environment, terminal operations are mocked, so we just verify the command executes
	}) //<

	test('Should enter poetry shell via command palette (active editor)', async () => { //>
		const document = await vscode.workspace.openTextDocument(testFilePath)

		await vscode.window.showTextDocument(document)
		assert.ok(vscode.window.activeTextEditor, 'Should have an active text editor')
		assert.strictEqual(vscode.window.activeTextEditor.document.uri.fsPath, testFilePath, 'Active editor should be our test file')
		
		await vscode.commands.executeCommand('fux-project-butler.enterPoetryShell')

		// Command should complete without error
		// Note: In test environment, terminal operations are mocked, so we just verify the command executes
	}) //<

	test('Should enter poetry shell with directory URI', async () => { //>
		const directoryUri = vscode.Uri.file(testWorkspaceRoot)

		await vscode.commands.executeCommand('fux-project-butler.enterPoetryShell', directoryUri)
		
		// Command should complete without error
	}) //<

	test('Should handle poetry shell with no active file', async () => { //>
		await vscode.commands.executeCommand('workbench.action.closeAllEditors')
		
		// This command should work even without an active file as it can use workspace root
		await vscode.commands.executeCommand('fux-project-butler.enterPoetryShell')
		
		// Command should complete without error
	}) //<

	test('Should reject poetry shell command with non-existent file', async () => { //>
		const nonExistentPath = path.join(testWorkspaceRoot, 'non-existent-file.txt')
		const nonExistentUri = vscode.Uri.file(nonExistentPath)

		await assert.rejects(
			async () => {
				await vscode.commands.executeCommand('fux-project-butler.enterPoetryShell', nonExistentUri)
			},
			(err: any) => {
				// Should fail with a file system error
				assert.ok(err.code === 'ENOENT' || err.message.includes('does not exist') || err.message.includes('ENOENT'), `Expected file system error but got: ${err.message} (code: ${err.code})`)
				return true
			},
			'Command should have rejected with a file system error.',
		)
	}) //<

	test('Should handle poetry shell in directory without pyproject.toml', async () => { //>
		// Create a temporary directory without pyproject.toml
		const tempDir = path.join(testWorkspaceRoot, 'temp-poetry-test')

		if (!fs.existsSync(tempDir)) {
			fs.mkdirSync(tempDir, { recursive: true })
		}
		
		const tempDirUri = vscode.Uri.file(tempDir)
		
		// This should still work - the service should handle missing pyproject.toml gracefully
		await vscode.commands.executeCommand('fux-project-butler.enterPoetryShell', tempDirUri)
		
		// Command should complete without error
		
		// Cleanup
		if (fs.existsSync(tempDir)) {
			fs.rmdirSync(tempDir)
		}
	}) //<
})


