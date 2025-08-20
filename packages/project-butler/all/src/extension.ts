import * as vscode from 'vscode'
import * as path from 'node:path'
import { Buffer } from 'node:buffer'
import { load as loadYaml } from 'js-yaml'

/**
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('F-UX: Project Maid All is now active!')

	try {
		// Register all commands
		const disposables = [
			vscode.commands.registerCommand('fux-project-maid-all.formatPackageJson', async (uri?: vscode.Uri) => {
				await formatPackageJson(uri)
			}),
			vscode.commands.registerCommand('fux-project-maid-all.updateTerminalPath', async (uri?: vscode.Uri) => {
				await updateTerminalPath(uri)
			}),
			vscode.commands.registerCommand('fux-project-maid-all.createBackup', async (uri?: vscode.Uri) => {
				await createBackup(uri)
			}),
			vscode.commands.registerCommand('fux-project-maid-all.enterPoetryShell', async (uri?: vscode.Uri) => {
				await enterPoetryShell(uri)
			})
		]

		context.subscriptions.push(...disposables)

		console.log('F-UX: Project Maid All commands registered successfully')
	}
	catch (error: any) {
		console.error('F-UX: Project Maid All failed to activate:', error.message)
		vscode.window.showErrorMessage(`Failed to activate Project Maid All: ${error.message}`)
	}
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
	console.log('F-UX: Project Maid All is now deactivated!')
}

/**
 * Format package.json using .FocusedUX configuration
 */
async function formatPackageJson(uri?: vscode.Uri): Promise<void> {
	try {
		// Get the URI from context menu or active editor
		let finalUri: string | undefined
		
		if (uri) {
			// Called from context menu
			finalUri = uri.fsPath
		}
		else {
			// Called from command palette
			finalUri = vscode.window.activeTextEditor?.document.uri.fsPath
		}

		if (!finalUri) {
			vscode.window.showErrorMessage('No package.json file selected or active.')
			return
		}
		if (!finalUri.endsWith('package.json')) {
			vscode.window.showErrorMessage('This command can only be run on a package.json file.')
			return
		}

		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

		if (!workspaceRoot) {
			vscode.window.showErrorMessage('Could not find workspace root. Cannot format package.json.')
			return
		}

		// Read the master order from .FocusedUX config
		const configPath = path.join(workspaceRoot, '.FocusedUX')
		let configContent: string

		try {
			const configBytes = await vscode.workspace.fs.readFile(vscode.Uri.file(configPath))

			configContent = Buffer.from(configBytes).toString()
		}
		catch (err: any) {
			vscode.window.showErrorMessage(`Could not read '.FocusedUX' file: ${err.message}`)
			return
		}

		let config: any

		try {
			config = loadYaml(configContent)
		}
		catch (err: any) {
			vscode.window.showErrorMessage(`Failed to parse YAML from '.FocusedUX': ${err.message}`)
			return
		}

		// Read from ProjectButler configuration
		const order = config?.ProjectButler?.['packageJson-order']

		if (!order || !Array.isArray(order)) {
			vscode.window.showErrorMessage('Configuration Error: \'ProjectButler.packageJson-order\' not found or invalid in \'.FocusedUX\'.')
			return
		}

		// Ensure 'name' is always first
		const masterOrder = order.includes('name') ? order : ['name', ...order]

		// Read and parse the package.json file
		let packageContent: string

		try {
			const packageBytes = await vscode.workspace.fs.readFile(vscode.Uri.file(finalUri))

			packageContent = Buffer.from(packageBytes).toString()
		}
		catch (err: any) {
			vscode.window.showErrorMessage(`Failed to read package.json: ${err.message}`)
			return
		}

		const packageData = JSON.parse(packageContent)
		const originalKeys = Object.keys(packageData)

		// Validate and collect unknown top-level keys
		const commentKeyRegex = /=.*=$/
		const unknownKeys: string[] = []

		for (const key of originalKeys) {
			if (commentKeyRegex.test(key)) {
				continue
			}

			if (!masterOrder.includes(key)) {
				unknownKeys.push(key)
			}
		}

		// Show warning for unknown keys
		if (unknownKeys.length > 0) {
			vscode.window.showWarningMessage(`Found top-level keys not in configuration: ${unknownKeys.join(', ')}. These will be placed at the end.`)
		}

		// Re-order the keys into a new object
		const orderedPackage: any = {}

		// First, add all keys that are in the configuration order
		for (const key of masterOrder) {
			if (Object.prototype.hasOwnProperty.call(packageData, key)) {
				orderedPackage[key] = packageData[key]
			}
		}

		// Then, add any unknown keys at the end
		for (const key of unknownKeys) {
			orderedPackage[key] = packageData[key]
		}

		// Add back any comment-like keys
		for (const key of originalKeys) {
			if (commentKeyRegex.test(key)) {
				orderedPackage[key] = packageData[key]
			}
		}

		// Convert back to formatted JSON and write to file
		const newJsonContent = `${JSON.stringify(orderedPackage, null, 4)}\n`

		try {
			await vscode.workspace.fs.writeFile(vscode.Uri.file(finalUri), Buffer.from(newJsonContent))
			vscode.window.showInformationMessage('Successfully formatted package.json')
		}
		catch (err: any) {
			vscode.window.showErrorMessage(`Failed to write updated package.json: ${err.message}`)
		}
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`Failed to format package.json: ${error.message}`)
	}
}

/**
 * Update terminal path to the current file or folder location
 */
async function updateTerminalPath(uri?: vscode.Uri): Promise<void> {
	try {
		const finalUri = uri?.fsPath || vscode.window.activeTextEditor?.document.uri.fsPath

		if (!finalUri) {
			vscode.window.showErrorMessage('No file or folder context to update terminal path.')
			return
		}

		const stats = await vscode.workspace.fs.stat(vscode.Uri.file(finalUri))
		const pathToSend = stats.type === vscode.FileType.Directory ? finalUri : path.dirname(finalUri)
		const cdCommand = `cd "${pathToSend}"`
		
		const terminal = vscode.window.activeTerminal || vscode.window.createTerminal('F-UX Terminal')
		terminal.sendText(cdCommand)
		terminal.show()
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`Error updating terminal path: ${error.message}`)
	}
}

/**
 * Create a backup of the selected file
 */
async function createBackup(uri?: vscode.Uri): Promise<void> {
	try {
		const finalUri = uri?.fsPath || vscode.window.activeTextEditor?.document.uri.fsPath

		if (!finalUri) {
			vscode.window.showErrorMessage('No file selected or open to back up.')
			return
		}

		const sourcePath = finalUri
		const baseName = path.basename(sourcePath)
		const directory = path.dirname(sourcePath)
		let backupNumber = 1
		let backupFileName: string
		let destinationPath: string
		let fileExists = false

		do {
			backupFileName = `${baseName}.bak${backupNumber > 1 ? backupNumber : ''}`
			destinationPath = path.join(directory, backupFileName)
			try {
				await vscode.workspace.fs.stat(vscode.Uri.file(destinationPath))
				fileExists = true
				backupNumber++
			}
			catch (_error: any) {
				fileExists = false
			}
		} while (fileExists)

		await vscode.workspace.fs.copy(
			vscode.Uri.file(sourcePath),
			vscode.Uri.file(destinationPath)
		)
		
		vscode.window.showInformationMessage(`Backup created: ${backupFileName}`)
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`Error creating backup: ${error.message}`)
	}
}

/**
 * Enter Poetry shell in the current directory
 */
async function enterPoetryShell(uri?: vscode.Uri): Promise<void> {
	try {
		const terminal = vscode.window.createTerminal('Poetry Shell')
		let command: string
		const finalUri = uri?.fsPath || vscode.window.activeTextEditor?.document.uri.fsPath

		if (finalUri) {
			const stats = await vscode.workspace.fs.stat(vscode.Uri.file(finalUri))
			const pathToSend = stats.type === vscode.FileType.Directory ? finalUri : path.dirname(finalUri)
			command = `cd "${pathToSend}" && poetry shell`
		}
		else {
			command = 'poetry shell'
		}
		
		terminal.sendText(command)
		terminal.show()
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`Error entering poetry shell: ${error.message}`)
	}
}
