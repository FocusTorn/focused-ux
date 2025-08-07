import type { IFileSystem, IProcess } from '@fux/shared'
import type { IProjectButlerService } from '../_interfaces/IProjectButlerService.js'
import type { ITerminalProvider } from '../_interfaces/ITerminal.js'
import type { IWindow } from '../_interfaces/IWindow.js'
import * as path from 'node:path'
import { load as loadYaml } from 'js-yaml'

export class ProjectButlerService implements IProjectButlerService {

	constructor(
		private readonly fileSystem: IFileSystem,
		private readonly window: IWindow,
		private readonly terminalProvider: ITerminalProvider,
		private readonly process: IProcess,
	) {}

	public async updateTerminalPath(uri?: string): Promise<void> {
		try {
			const finalUri = uri || this.window.activeTextEditorUri

			if (!finalUri) {
				this.window.showErrorMessage('No file or folder context to update terminal path.')
				return
			}

			const stats = await this.fileSystem.stat(finalUri)
			const pathToSend = stats.type === 'directory' ? finalUri : path.dirname(finalUri)
			const cdCommand = `cd "${pathToSend}"`
			const terminal = this.terminalProvider.activeTerminal || this.terminalProvider.createTerminal('F-UX Terminal')

			terminal.sendText(cdCommand)
			terminal.show()
		}
		catch (error: any) {
			this.window.showErrorMessage(`Error updating terminal path: ${error.message}`)
		}
	}

	public async createBackup(uri?: string): Promise<void> {
		try {
			const finalUri = uri || this.window.activeTextEditorUri

			if (!finalUri) {
				this.window.showErrorMessage('No file selected or open to back up.')
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
					await this.fileSystem.access(destinationPath)
					fileExists = true
					backupNumber++
				}
				catch (_error: any) {
					fileExists = false
				}
			} while (fileExists)

			await this.fileSystem.copyFile(sourcePath, destinationPath)
			this.window.showTimedInformationMessage(`Backup created: ${backupFileName}`)
		}
		catch (error: any) {
			this.window.showErrorMessage(`Error creating backup: ${error.message}`)
		}
	}

	public async enterPoetryShell(uri?: string): Promise<void> {
		try {
			const terminal = this.terminalProvider.createTerminal('Poetry Shell')
			let command: string
			const finalUri = uri || this.window.activeTextEditorUri

			if (finalUri) {
				const stats = await this.fileSystem.stat(finalUri)
				const pathToSend = stats.type === 'directory' ? finalUri : path.dirname(finalUri)

				command = `cd "${pathToSend}" && poetry shell`
			}
			else {
				command = 'poetry shell'
			}
			terminal.sendText(command)
			terminal.show()
		}
		catch (error: any) {
			this.window.showErrorMessage(`Failed to enter Poetry shell: ${error.message}`)
		}
	}

	public async formatPackageJson(uri?: string): Promise<void> {
		try {
			const finalUri = uri || this.window.activeTextEditorUri

			if (!finalUri) {
				this.window.showErrorMessage('No package.json file selected or active.')
				return
			}
			if (!finalUri.endsWith('package.json')) {
				this.window.showErrorMessage('This command can only be run on a package.json file.')
				return
			}

			const workspaceRoot = this.process.getWorkspaceRoot()

			if (!workspaceRoot) {
				this.window.showErrorMessage('Could not find workspace root. Cannot format package.json.')
				return
			}

			// Read the master order from .FocusedUX config
			const configPath = path.join(workspaceRoot, '.FocusedUX')
			let configContent: string

			try {
				configContent = await this.fileSystem.readFile(configPath)
			}
			catch (err: any) {
				this.window.showErrorMessage(`Could not read '.FocusedUX' file: ${err.message}`)
				return
			}

			let config: any

			try {
				config = loadYaml(configContent)
			}
			catch (err: any) {
				this.window.showErrorMessage(`Failed to parse YAML from '.FocusedUX': ${err.message}`)
				return
			}

			const order = config?.TerminalButler?.['packageJson-order']

			if (!order || !Array.isArray(order)) {
				this.window.showErrorMessage('Configuration Error: \'TerminalButler.packageJson-order\' not found or invalid in \'.FocusedUX\'.')
				return
			}

			// Ensure 'name' is always first
			const masterOrder = order.includes('name') ? order : ['name', ...order]

			// Read and parse the package.json file
			let packageContent: string

			try {
				packageContent = await this.fileSystem.readFile(finalUri)
			}
			catch (err: any) {
				this.window.showErrorMessage(`Failed to read package.json: ${err.message}`)
				return
			}

			const packageData = JSON.parse(packageContent)
			const originalKeys = Object.keys(packageData)

			// Validate that no unknown top-level keys exist
			const commentKeyRegex = /=.*=$/

			for (const key of originalKeys) {
				if (commentKeyRegex.test(key)) {
					continue
				}

				if (!masterOrder.includes(key)) {
					this.window.showErrorMessage(`Validation Failed: Found top-level key '${key}' which is not in the allowed ordering list defined in .FocusedUX.`)
					return
				}
			}

			// Re-order the keys into a new object
			const orderedPackage: any = {}

			for (const key of masterOrder) {
				if (Object.prototype.hasOwnProperty.call(packageData, key)) {
					orderedPackage[key] = packageData[key]
				}
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
				await this.fileSystem.writeFile(finalUri, new TextEncoder().encode(newJsonContent))
				this.window.showTimedInformationMessage('Successfully formatted package.json')
			}
			catch (err: any) {
				this.window.showErrorMessage(`Failed to write updated package.json: ${err.message}`)
			}
		}
		catch (error: any) {
			this.window.showErrorMessage(`Failed to format package.json: ${error.message}`)
		}
	}

}
