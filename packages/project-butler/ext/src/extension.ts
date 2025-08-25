import * as vscode from 'vscode'
import {
	PackageJsonFormattingService,
	TerminalManagementService,
	BackupManagementService,
	PoetryShellService,
	ProjectMaidManagerService,
} from '@fux/project-butler-core'
import { FileSystemAdapter } from './adapters/FileSystem.adapter.js'
import { PathAdapter } from './adapters/Path.adapter.js'
import { YamlAdapter } from './adapters/Yaml.adapter.js'
import { WindowAdapter } from './adapters/Window.adapter.js'
import { WorkspaceAdapter } from './adapters/Workspace.adapter.js'

/**
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('F-UX: Project Maid is now active!')

	try {
		// Create adapters
		const fileSystem = new FileSystemAdapter()
		const path = new PathAdapter()
		const yaml = new YamlAdapter()
		const window = new WindowAdapter()
		const workspace = new WorkspaceAdapter()

		// Create core services with their dependencies
		const packageJsonFormattingService = new PackageJsonFormattingService(fileSystem, yaml)
		const terminalManagementService = new TerminalManagementService(fileSystem, path)
		const backupManagementService = new BackupManagementService(fileSystem, path)
		const poetryShellService = new PoetryShellService(fileSystem, path)
		const projectMaidManager = new ProjectMaidManagerService({
			packageJsonFormatting: packageJsonFormattingService,
			terminalManagement: terminalManagementService,
			backupManagement: backupManagementService,
			poetryShell: poetryShellService,
		})

		// Register all commands
		const disposables = [
			vscode.commands.registerCommand('fux-project-butler.formatPackageJson', async (uri?: vscode.Uri) => {
				await formatPackageJson(uri, projectMaidManager, window, workspace)
			}),
			vscode.commands.registerCommand('fux-project-butler.updateTerminalPath', async (uri?: vscode.Uri) => {
				await updateTerminalPath(uri, terminalManagementService, window)
			}),
			vscode.commands.registerCommand('fux-project-butler.createBackup', async (uri?: vscode.Uri) => {
				await createBackup(uri, backupManagementService, window)
			}),
			vscode.commands.registerCommand('fux-project-butler.enterPoetryShell', async (uri?: vscode.Uri) => {
				await enterPoetryShell(uri, poetryShellService, window)
			}),
		]

		context.subscriptions.push(...disposables)

		console.log('F-UX: Project Maid commands registered successfully')
	}
	catch (error: any) {
		console.error('F-UX: Project Maid failed to activate:', error.message)
		vscode.window.showErrorMessage(`Failed to activate Project Maid: ${error.message}`)
	}
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
	console.log('F-UX: Project Maid is now deactivated!')
}

/**
 * Format package.json using .FocusedUX configuration
 */
async function formatPackageJson(
	uri: vscode.Uri | undefined,
	projectMaidManager: ProjectMaidManagerService,
	window: WindowAdapter,
	workspace: WorkspaceAdapter,
): Promise<void> {
	try {
		// Get the URI from context menu or active editor
		let finalUri: string | undefined
		
		if (uri) {
			// Called from context menu
			finalUri = uri.fsPath
		}
		else {
			// Called from command palette
			finalUri = window.getActiveTextEditor()?.document.uri.fsPath
		}

		if (!finalUri) {
			await window.showErrorMessage('No package.json file selected or active.')
			return
		}
		if (!finalUri.endsWith('package.json')) {
			await window.showErrorMessage('This command can only be run on a package.json file.')
			return
		}

		const workspaceRoot = workspace.getWorkspaceRoot()

		if (!workspaceRoot) {
			await window.showErrorMessage('Could not find workspace root. Cannot format package.json.')
			return
		}

		await projectMaidManager.formatPackageJson(finalUri, workspaceRoot)
		await window.showInformationMessage('Successfully formatted package.json')
	}
	catch (error: any) {
		await window.showErrorMessage(`Failed to format package.json: ${error.message}`)
	}
}

/**
 * Update terminal path to the current file or folder location
 */
async function updateTerminalPath(
	uri: vscode.Uri | undefined,
	terminalManagementService: TerminalManagementService,
	window: WindowAdapter,
): Promise<void> {
	try {
		const finalUri = uri?.fsPath || window.getActiveTextEditor()?.document.uri.fsPath

		if (!finalUri) {
			await window.showErrorMessage('No file or folder context to update terminal path.')
			return
		}

		const terminalCommand = await terminalManagementService.updateTerminalPath(finalUri)
		
		try {
			const terminal = window.getActiveTerminal() || window.createTerminal('F-UX Terminal')
			terminal.sendText(terminalCommand.command)
			terminal.show()
		}
		catch (terminalError: any) {
			// In test environment, terminal creation might fail
			// Just show the command that would be executed
			await window.showInformationMessage(`Terminal command: ${terminalCommand.command}`)
		}
	}
	catch (error: any) {
		await window.showErrorMessage(`Error updating terminal path: ${error.message}`)
	}
}

/**
 * Create a backup of the selected file
 */
async function createBackup(
	uri: vscode.Uri | undefined,
	backupManagementService: BackupManagementService,
	window: WindowAdapter,
): Promise<void> {
	try {
		const finalUri = uri?.fsPath || window.getActiveTextEditor()?.document.uri.fsPath

		if (!finalUri) {
			await window.showErrorMessage('No file selected or open to back up.')
			return
		}

		const backupPath = await backupManagementService.createBackup(finalUri)
		const backupFileName = backupPath.split('/').pop() || backupPath.split('\\').pop()
		
		await window.showInformationMessage(`Backup created: ${backupFileName}`)
	}
	catch (error: any) {
		await window.showErrorMessage(`Error creating backup: ${error.message}`)
	}
}

/**
 * Enter Poetry shell in the current directory
 */
async function enterPoetryShell(
	uri: vscode.Uri | undefined,
	poetryShellService: PoetryShellService,
	window: WindowAdapter,
): Promise<void> {
	try {
		const finalUri = uri?.fsPath || window.getActiveTextEditor()?.document.uri.fsPath

		const terminalCommand = await poetryShellService.enterPoetryShell(finalUri)
		
		try {
			const terminal = window.createTerminal('Poetry Shell')
			terminal.sendText(terminalCommand.command)
			terminal.show()
		}
		catch (terminalError: any) {
			// In test environment, terminal creation might fail
			// Just show the command that would be executed
			await window.showInformationMessage(`Poetry shell command: ${terminalCommand.command}`)
		}
	}
	catch (error: any) {
		await window.showErrorMessage(`Error entering poetry shell: ${error.message}`)
	}
}
