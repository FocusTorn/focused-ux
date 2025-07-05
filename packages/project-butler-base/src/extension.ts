import type { ExtensionContext, Disposable, Uri } from 'vscode'
import * as vscode from 'vscode'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { exec } from 'node:child_process'

const EXT_ID_PREFIX = 'fux-project-butler-base'

const commands = {
	updateTerminalPath: `${EXT_ID_PREFIX}.updateTerminalPath`,
	createBackup: `${EXT_ID_PREFIX}.createBackup`,
	enterPoetryShell: `${EXT_ID_PREFIX}.enterPoetryShell`,
	formatPackageJson: `${EXT_ID_PREFIX}.formatPackageJson`,
	hotswap: `${EXT_ID_PREFIX}.hotswap`,
} as const

async function updateTerminalPath(uri?: Uri): Promise<void> {
	try {
		const finalUri = uri || vscode.window.activeTextEditor?.document.uri

		if (!finalUri) {
			vscode.window.showErrorMessage('No file or folder context to update terminal path.')
			return
		}

		const stats = await fs.stat(finalUri.fsPath)
		const pathToSend = stats.isDirectory() ? finalUri.fsPath : path.dirname(finalUri.fsPath)

		const cdCommand = `cd "${pathToSend}"`

		const terminal = vscode.window.activeTerminal || vscode.window.createTerminal()

		terminal.sendText(cdCommand)
		terminal.show()
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`Error updating terminal path: ${error.message}`)
		console.error(error)
	}
}

async function createBackup(uri?: Uri): Promise<void> {
	try {
		const finalUri = uri || vscode.window.activeTextEditor?.document.uri

		if (!finalUri) {
			vscode.window.showErrorMessage('No file selected or open to back up.')
			return
		}

		const sourcePath = finalUri.fsPath
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
				await fs.access(destinationPath)
				fileExists = true
				backupNumber++
			}
			catch (_error: any) {
				fileExists = false
			}
		} while (fileExists)

		await fs.copyFile(sourcePath, destinationPath)
		vscode.window.showInformationMessage(`Backup created: ${backupFileName}`)
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`Error creating backup: ${error.message}`)
		console.error(error)
	}
}

async function enterPoetryShell(uri?: Uri): Promise<void> {
	try {
		const terminal = vscode.window.createTerminal('Poetry Shell')
		let pathToSend: string | undefined
		let command: string

		const finalUri = uri || vscode.window.activeTextEditor?.document.uri

		if (finalUri) {
			const stats = await fs.stat(finalUri.fsPath)

			pathToSend = stats.isDirectory() ? finalUri.fsPath : path.dirname(finalUri.fsPath)
			command = `cd "${pathToSend}" && poetry shell`
		}
		else {
			command = 'poetry shell'
		}

		terminal.sendText(command)
		terminal.show()
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`Failed to enter Poetry shell: ${error.message}`)
		console.error(error)
	}
}

async function formatPackageJson(uri?: Uri): Promise<void> {
	try {
		const finalUri = uri || vscode.window.activeTextEditor?.document.uri

		if (!finalUri) {
			vscode.window.showErrorMessage('No package.json file selected or active.')
			return
		}

		if (!finalUri.fsPath.endsWith('package.json')) {
			vscode.window.showErrorMessage('This command can only be run on a package.json file.')
			return
		}

		const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

		if (!workspaceRoot) {
			vscode.window.showErrorMessage('Could not find workspace root. Cannot format package.json.')
			return
		}

		const scriptPath = path.join(workspaceRoot, '_scripts', 'js', 'format-package-json.js')
		const command = `node "${scriptPath}" "${finalUri.fsPath}"`

		exec(command, { cwd: workspaceRoot }, (error, stdout, stderr) => {
			if (error) {
				vscode.window.showErrorMessage(`Failed to format package.json: ${stderr || error.message}`)
				console.error(`exec error: ${error}`)
				return
			}
			console.log(`format-package-json script output: ${stdout}`)
		})
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`Failed to format package.json: ${error.message}`)
		console.error(error)
	}
}

async function hotswap(vsixUri?: Uri): Promise<void> {
	if (!vsixUri) {
		vscode.window.showErrorMessage(
			'Hotswap: This command must be run from a VSIX file in the explorer.',
		)
		return
	}

	const vsixFilename = path.basename(vsixUri.fsPath)
	const match = vsixFilename.match(/^(?:([\w-]+)\.)?([\w-]+)-\d+\.\d+\.\d+.*\.vsix$/)

	if (!match) {
		vscode.window.showErrorMessage(
			`Hotswap: Could not parse extension ID from filename: ${vsixFilename}`,
		)
		return
	}

	const extensionBaseName = match[2]
	const installed = vscode.extensions.all.find(ext => ext.id.endsWith(`.${extensionBaseName}`))

	if (!installed) {
		vscode.window.showWarningMessage(
			`Hotswap: No currently installed extension found for '${extensionBaseName}'. Will proceed with installation only.`,
		)
	}

	const targetExtensionId = installed ? installed.id : `NewRealityDesigns.${extensionBaseName}`

	try {
		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `Hotswapping ${extensionBaseName}`,
				cancellable: false,
			},
			async (progress) => {
				if (installed) {
					progress.report({ message: `Uninstalling ${targetExtensionId}...` })
					await vscode.commands.executeCommand(
						'workbench.extensions.uninstallExtension',
						targetExtensionId,
					)
				}

				progress.report({ message: `Installing from ${vsixFilename}...` })
				await vscode.commands.executeCommand('workbench.extensions.installExtension', vsixUri)

				progress.report({ message: 'Complete!' })
				await new Promise(resolve => setTimeout(resolve, 1500))
			},
		)

		vscode.window.showInformationMessage(`✅ Hotswap complete: ${extensionBaseName} reinstalled.`)
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`Hotswap failed: ${error.message}`)
		console.error(error)
	}
}

export function activate(context: ExtensionContext): void {
	console.log('[F-UX: Project Butler (Base)] Activating...')

	const disposables: Disposable[] = [
		vscode.commands.registerCommand(commands.updateTerminalPath, (uri?: Uri) =>
			updateTerminalPath(uri)),
		vscode.commands.registerCommand(commands.createBackup, (uri?: Uri) => createBackup(uri)),
		vscode.commands.registerCommand(commands.enterPoetryShell, (uri?: Uri) =>
			enterPoetryShell(uri)),
		vscode.commands.registerCommand(commands.formatPackageJson, (uri?: Uri) =>
			formatPackageJson(uri)),
		vscode.commands.registerCommand(commands.hotswap, (uri?: Uri) => hotswap(uri)),
	]

	context.subscriptions.push(...disposables)
	console.log('[F-UX: Project Butler (Base)] Activated.')
}

export function deactivate(): void {}
