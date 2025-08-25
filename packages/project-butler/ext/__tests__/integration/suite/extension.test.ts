import * as assert from 'node:assert'
import * as vscode from 'vscode'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { after, before, test, suite } from 'mocha'

// Helper to add a delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

suite('Project Butler Extension Integration Tests', () => {
	let workspaceRoot: string
	let testFilePath: string
	let packageJsonPath: string
	let originalPackageJsonContent: string | undefined

	// Suite-level setup
	before(async function () {
		this.timeout(15000) // Increase timeout for setup
		console.log('Starting test suite setup...')

		// 1. Ensure extension is activated
		const extension = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler')
		assert.ok(extension, 'Extension not found.')
		await extension.activate()
		console.log('Extension activated.')

		// 2. Set up workspace paths
		assert.ok(vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0, 'Test workspace not available.')
		workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath
		testFilePath = path.join(workspaceRoot, 'test-file.txt')
		packageJsonPath = path.join(workspaceRoot, 'package.json')
		console.log(`Workspace root set to: ${workspaceRoot}`)

		// 3. Create mock .FocusedUX config
		const focusedUxContent = `
ProjectButler:
  packageJson-order:
    - name
    - version
    - description
    - scripts
    - dependencies
`
		fs.writeFileSync(path.join(workspaceRoot, '.FocusedUX'), focusedUxContent)

		// 4. Backup original package.json if it exists
		if (fs.existsSync(packageJsonPath)) {
			originalPackageJsonContent = fs.readFileSync(packageJsonPath, 'utf8')
		}
		// 5. Create a file to be used in tests
		fs.writeFileSync(testFilePath, 'Initial content for testing.')
		console.log('Test files created. Setup complete.')
	})

	// Suite-level teardown
	after(() => {
		console.log('Starting test suite teardown...')
		// Use rmSync with force option for robust cleanup
		fs.rmSync(path.join(workspaceRoot, '.FocusedUX'), { force: true, recursive: true })
		fs.rmSync(testFilePath, { force: true, recursive: true })
		fs.rmSync(`${testFilePath}.bak`, { force: true, recursive: true })

		if (originalPackageJsonContent) {
			fs.writeFileSync(packageJsonPath, originalPackageJsonContent)
		}
		else {
			fs.rmSync(packageJsonPath, { force: true, recursive: true })
		}
		console.log('Teardown complete.')
	})

	test('should activate successfully', () => {
		console.log('Running test: should activate successfully')
		const extension = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler')
		assert.ok(extension, 'Extension should be found.')
		assert.strictEqual(extension.isActive, true, 'Extension should be active.')
	})

	test('should register all commands', async () => {
		console.log('Running test: should register all commands')
		const commands = await vscode.commands.getCommands()
		const expectedCommands = [
			'fux-project-butler.formatPackageJson',
			'fux-project-butler.updateTerminalPath',
			'fux-project-butler.createBackup',
			'fux-project-butler.enterPoetryShell',
		]
		for (const cmd of expectedCommands) {
			assert.ok(commands.includes(cmd), `Command '${cmd}' should be registered.`)
		}
	})

	test('\'formatPackageJson\' command should correctly format package.json', async function () {
		this.timeout(5000) // Give this test more time
		console.log('Running test: \'formatPackageJson\' command...')
		const disorderedJson = {
			version: '1.0.0',
			scripts: { test: 'echo "test"' },
			name: 'test-project',
			dependencies: { lodash: '4.17.21' },
			description: 'A test project.',
		}
		fs.writeFileSync(packageJsonPath, JSON.stringify(disorderedJson, null, 2))

		const doc = await vscode.workspace.openTextDocument(packageJsonPath)
		await vscode.window.showTextDocument(doc)

		console.log('Executing formatPackageJson command...')
		await vscode.commands.executeCommand('fux-project-butler.formatPackageJson')

		console.log('Waiting for file system to update...')
		await sleep(2000) // Increased wait time for file I/O robustness

		const content = fs.readFileSync(packageJsonPath, 'utf8')
		const formattedJson = JSON.parse(content)
		const keys = Object.keys(formattedJson)
		const expectedOrder = ['name', 'version', 'description', 'scripts', 'dependencies']

		try {
			assert.deepStrictEqual(keys, expectedOrder)
			console.log('\'formatPackageJson\' test passed.')
		}
		catch (e) {
			console.error('🔥🔥🔥 Assertion Failed: package.json keys are not in the expected order.')
			console.error(`Expected: ${JSON.stringify(expectedOrder)}`)
			console.error(`Actual:   ${JSON.stringify(keys)}`)
			console.error(`File Content: \n${content}`)
			throw e
		}
	})

	test('\'createBackup\' command should create a backup file', async function () {
		this.timeout(5000)
		console.log('Running test: \'createBackup\' command...')
		const doc = await vscode.workspace.openTextDocument(testFilePath)
		await vscode.window.showTextDocument(doc)

		console.log('Executing createBackup command...')
		await vscode.commands.executeCommand('fux-project-butler.createBackup')

		console.log('Waiting for file system to update...')
		await sleep(1500)

		const backupPath = `${testFilePath}.bak`
		const backupExists = fs.existsSync(backupPath)
		try {
			assert.ok(backupExists, 'Backup file was not created.')
			console.log('\'createBackup\' test passed.')
		}
		catch (e) {
			console.error(`🔥🔥🔥 Assertion Failed: Backup file not found at ${backupPath}`)
			const dirContents = fs.readdirSync(workspaceRoot)
			console.error(`Workspace directory contents: ${dirContents.join(', ')}`)
			throw e
		}
	})

	test('\'updateTerminalPath\' command should execute without error', async () => {
		console.log('Running test: \'updateTerminalPath\' command...')
		await assert.doesNotReject(
			async () => vscode.commands.executeCommand('fux-project-butler.updateTerminalPath', vscode.Uri.file(testFilePath)),
			'\'updateTerminalPath\' command threw an unexpected error.',
		)
		console.log('\'updateTerminalPath\' test passed.')
	})

	test('\'enterPoetryShell\' command should execute without error', async () => {
		console.log('Running test: \'enterPoetryShell\' command...')
		await assert.doesNotReject(
			async () => vscode.commands.executeCommand('fux-project-butler.enterPoetryShell', vscode.Uri.file(testFilePath)),
			'\'enterPoetryShell\' command threw an unexpected error.',
		)
		console.log('\'enterPoetryShell\' test passed.')
	})
})
