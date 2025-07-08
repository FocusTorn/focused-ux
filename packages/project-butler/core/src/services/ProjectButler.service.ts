import type { IFileSystem, IProcess } from '@fux/services'
import type { IProjectButlerService } from '../_interfaces/IProjectButlerService.js'
import type { ITerminalProvider } from '../_interfaces/ITerminal.js'
import type { IWindow } from '../_interfaces/IWindow.js'
import * as path from 'node:path'

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
			const pathToSend = stats.isDirectory() ? finalUri : path.dirname(finalUri)
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
				const pathToSend = stats.isDirectory() ? finalUri : path.dirname(finalUri)

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

			const scriptPath = path.join(workspaceRoot, '_scripts', 'js', 'format-package-json.js')
            
			const command = `node "${scriptPath}" "${finalUri}"`

			this.process.exec(command, { cwd: workspaceRoot }, (error, _stdout, stderr) => {
				if (error) {
					this.window.showErrorMessage(`Failed to format package.json: ${stderr || error.message}`)
				}
			})
		}
		catch (error: any) {
			this.window.showErrorMessage(`Failed to format package.json: ${error.message}`)
		}
	}

}
