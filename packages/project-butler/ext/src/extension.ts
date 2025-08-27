import * as vscode from 'vscode'
import {
	PackageJsonFormattingService,
	TerminalManagementService,
	BackupManagementService,
	PoetryShellService,
	ProjectButlerManagerService,
} from '@fux/project-butler-core'
import { FileSystemAdapter } from './adapters/FileSystem.adapter.js'
import { PathAdapter } from './adapters/Path.adapter.js'
import { YamlAdapter } from './adapters/Yaml.adapter.js'
import { WindowAdapter } from './adapters/Window.adapter.js'
import { WorkspaceAdapter } from './adapters/Workspace.adapter.js'
import process from 'node:process'

// --- Environment Check ---
// VS Code's test runner sets this environment variable.
const IS_TEST_ENVIRONMENT = process.env.VSCODE_TEST === '1'

/**
 * Called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
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
		const projectButlerManager = new ProjectButlerManagerService({
			packageJsonFormatting: packageJsonFormattingService,
			terminalManagement: terminalManagementService,
			backupManagement: backupManagementService,
			poetryShell: poetryShellService,
		})

		// Register all commands
		const disposables = [
			vscode.commands.registerCommand('fux-project-butler.formatPackageJson', async (uri?: vscode.Uri) => {
				await formatPackageJson(uri, projectButlerManager, window, workspace)
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
	}
	catch (error: any) {
		if (!IS_TEST_ENVIRONMENT) {
			vscode.window.showErrorMessage(`Failed to activate Project Butler: ${error.message}`)
		}
		console.error('F-UX: Project Butler failed to activate:', error.message)
	}
}

/**
 * Called when the extension is deactivated
 */
export function deactivate() {
	if (!IS_TEST_ENVIRONMENT) {
		console.log('F-UX: Project Butler is now deactivated!')
	}
}

/**
 * Format package.json using .FocusedUX configuration
 */
async function formatPackageJson(
	uri: vscode.Uri | undefined,
	projectButlerManager: ProjectButlerManagerService,
	window: WindowAdapter,
	workspace: WorkspaceAdapter,
): Promise<void> {
	try {
		const finalUri = uri?.fsPath || window.getActiveTextEditor()?.document.uri.fsPath

		if (!finalUri) {
			const message = 'No package.json file selected or active.'

			if (IS_TEST_ENVIRONMENT)
				throw new Error(message)
			await window.showErrorMessage(message)
			return
		}
		if (!finalUri.endsWith('package.json')) {
			const message = 'This command can only be run on a package.json file.'

			if (IS_TEST_ENVIRONMENT)
				throw new Error(message)
			await window.showErrorMessage(message)
			return
		}

		const workspaceRoot = workspace.getWorkspaceRoot()

		if (!workspaceRoot) {
			const message = 'Could not find workspace root. Cannot format package.json.'

			if (IS_TEST_ENVIRONMENT)
				throw new Error(message)
			await window.showErrorMessage(message)
			return
		}

		await projectButlerManager.formatPackageJson(finalUri, workspaceRoot)

		if (!IS_TEST_ENVIRONMENT) {
			await window.showInformationMessage('Successfully formatted package.json')
		}
	}
	catch (error: any) {
		if (IS_TEST_ENVIRONMENT) {
			throw error
		}
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
			const message = 'No file or folder context to update terminal path.'

			if (IS_TEST_ENVIRONMENT)
				throw new Error(message)
			await window.showErrorMessage(message)
			return
		}

		const terminalCommand = await terminalManagementService.updateTerminalPath(finalUri)

		if (!IS_TEST_ENVIRONMENT) {
			const terminal = window.getActiveTerminal() || window.createTerminal('F-UX Terminal')

			terminal.sendText(terminalCommand.command)
			terminal.show()
		}
	}
	catch (error: any) {
		if (IS_TEST_ENVIRONMENT) {
			throw error
		}
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
			const message = 'No file selected or open to back up.'

			if (IS_TEST_ENVIRONMENT)
				throw new Error(message)
			await window.showErrorMessage(message)
			return
		}

		const backupPath = await backupManagementService.createBackup(finalUri)

		if (!IS_TEST_ENVIRONMENT) {
			const backupFileName = backupPath.split('/').pop() || backupPath.split('\\').pop()

			await window.showInformationMessage(`Backup created: ${backupFileName}`)
		}
	}
	catch (error: any) {
		if (IS_TEST_ENVIRONMENT) {
			throw error
		}
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

		if (!IS_TEST_ENVIRONMENT) {
			const terminal = window.createTerminal('Poetry Shell')

			terminal.sendText(terminalCommand.command)
			terminal.show()
		}
	}
	catch (error: any) {
		if (IS_TEST_ENVIRONMENT) {
			throw error
		}
		await window.showErrorMessage(`Error entering poetry shell: ${error.message}`)
	}
}
