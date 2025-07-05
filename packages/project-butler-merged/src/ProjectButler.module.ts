import type { IWindow, ICommonUtilsService } from '@fux/shared-services'
import type { IProjectButlerService } from './_interfaces/IProjectButlerService.js'
import type { Uri } from 'vscode'
import * as vscode from 'vscode'
import * as path from 'node:path'

export class ProjectButlerModule {

	constructor(
		private readonly projectButlerService: IProjectButlerService,
		private readonly iWindow: IWindow,
		private readonly commonUtils: ICommonUtilsService,
	) {
		console.log('[ProjectButlerModule] Instantiated.')
	}

	public async handleUpdateTerminalPath(uri?: Uri): Promise<void> { //>
		console.log('[ProjectButlerModule] handleUpdateTerminalPath triggered.')
		try {
			const finalUri = uri || this.iWindow.activeTextEditor?.document.uri

			if (!finalUri) {
				console.error('[ProjectButlerModule] No file or folder context found.')
				this.iWindow.showErrorMessage('No file or folder context to update terminal path.')
				return
			}
			console.log(`[ProjectButlerModule] Calling service with URI: ${finalUri.fsPath}`)
			await this.projectButlerService.updateTerminalPath(finalUri)
		}
		catch (error) {
			this.commonUtils.errMsg('Failed to update terminal path.', error)
		}
	} //<

	public async handleEnterPoetryShell(uri?: Uri): Promise<void> { //>
		console.log('[ProjectButlerModule] handleEnterPoetryShell triggered.')
		try {
			const finalUri = uri || this.iWindow.activeTextEditor?.document.uri

			if (finalUri) {
				console.log(`[ProjectButlerModule] Calling service with URI: ${finalUri.fsPath}`)
			}
			else {
				console.log('[ProjectButlerModule] Calling service without a specific URI.')
			}
			await this.projectButlerService.enterPoetryShell(finalUri)
		}
		catch (error) {
			this.commonUtils.errMsg('Failed to enter poetry shell.', error)
		}
	} //<

	public async handleFormatPackageJson(uri?: Uri): Promise<void> { //>
		console.log('[ProjectButlerModule] handleFormatPackageJson triggered.')
		try {
			const finalUri = uri || this.iWindow.activeTextEditor?.document.uri

			if (!finalUri) {
				console.error('[ProjectButlerModule] No package.json file selected or active.')
				this.iWindow.showErrorMessage('No package.json file selected or active.')
				return
			}

			if (!finalUri.fsPath.endsWith('package.json')) {
				console.error(`[ProjectButlerModule] Not a package.json file: ${finalUri.fsPath}`)
				this.iWindow.showErrorMessage('This command can only be run on a package.json file.')
				return
			}

			console.log(`[ProjectButlerModule] Calling service with URI: ${finalUri.fsPath}`)
			await this.projectButlerService.formatPackageJson(finalUri)
		}
		catch (error) {
			this.commonUtils.errMsg('Failed to format package.json.', error)
		}
	} //<

	public async handleCreateBackup(uri?: Uri): Promise<void> { //>
		console.log('[ProjectButlerModule] handleCreateBackup triggered.')
		try {
			const finalUri = uri || this.iWindow.activeTextEditor?.document.uri

			if (!finalUri) {
				console.error('[ProjectButlerModule] No file selected or open to back up.')
				this.iWindow.showErrorMessage('No file selected or open to back up.')
				return
			}
			console.log(`[ProjectButlerModule] Calling service with URI: ${finalUri.fsPath}`)
			await this.projectButlerService.createBackup(finalUri)
		}
		catch (error) {
			this.commonUtils.errMsg('Failed to create backup.', error)
		}
	} //<

	public async handleHotswap(vsixUri?: Uri): Promise<void> { //>
		console.log('[ProjectButlerModule] handleHotswap triggered.')
		if (!vsixUri) {
			console.error('[ProjectButlerModule] Hotswap command run without a VSIX file URI.')
			this.iWindow.showErrorMessage('Hotswap: This command must be run from a VSIX file in the explorer.')
			return
		}
		console.log(`[ProjectButlerModule] Hotswapping VSIX: ${vsixUri.fsPath}`)

		const vsixFilename = path.basename(vsixUri.fsPath)
		const match = vsixFilename.match(/^(?:([\w-]+)\.)?([\w-]+)-\d+\.\d+\.\d+.*\.vsix$/)

		if (!match) {
			this.iWindow.showErrorMessage(`Hotswap: Could not parse extension ID from filename: ${vsixFilename}`)
			return
		}

		const extensionBaseName = match[2]
		const installed = vscode.extensions.all.find(ext => ext.id.endsWith(`.${extensionBaseName}`))

		if (!installed) {
			this.iWindow.showWarningMessage(`Hotswap: No currently installed extension found for '${extensionBaseName}'. Will proceed with installation only.`)
		}

		const targetExtensionId = installed ? installed.id : `unknown-publisher.${extensionBaseName}`

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

			this.iWindow.showInformationMessage(`✅ Hotswap complete: ${extensionBaseName} reinstalled.`)
		}
		catch (error: any) {
			this.iWindow.showErrorMessage(`Hotswap failed: ${error.message}`)
			console.error(error)
		}
	} //<

}
