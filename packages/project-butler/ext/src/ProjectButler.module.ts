import { inject, singleton } from 'tsyringe'
import type { IWindow } from '@fux/shared-services'
import type { IProjectButlerService } from '@fux/project-butler-core'
import type { Uri } from 'vscode'
import * as vscode from 'vscode'
import * as path from 'node:path'

@singleton()
export class ProjectButlerModule {

	constructor(
		@inject('IProjectButlerService') private readonly service: IProjectButlerService,
		@inject('IWindow') private readonly window: IWindow,
	) {}

	public async handleUpdateTerminalPath(uri?: Uri): Promise<void> {
		const finalUri = uri || this.window.activeTextEditor?.document.uri

		if (!finalUri) {
			this.window.showErrorMessage('No file or folder context to update terminal path.')
			return
		}
		await this.service.updateTerminalPath(finalUri)
	}

	public async handleEnterPoetryShell(uri?: Uri): Promise<void> {
		const finalUri = uri || this.window.activeTextEditor?.document.uri

		await this.service.enterPoetryShell(finalUri)
	}

	public async handleFormatPackageJson(uri?: Uri): Promise<void> {
		const finalUri = uri || this.window.activeTextEditor?.document.uri

		if (!finalUri) {
			this.window.showErrorMessage('No package.json file selected or active.')
			return
		}

		if (!finalUri.fsPath.endsWith('package.json')) {
			this.window.showErrorMessage('This command can only be run on a package.json file.')
			return
		}

		await this.service.formatPackageJson(finalUri)
	}

	public async handleCreateBackup(uri?: Uri): Promise<void> {
		const finalUri = uri || this.window.activeTextEditor?.document.uri

		if (!finalUri) {
			this.window.showErrorMessage('No file selected or open to back up.')
			return
		}
		await this.service.createBackup(finalUri)
	}

	public async handleHotswap(vsixUri?: Uri): Promise<void> {
		if (!vsixUri) {
			this.window.showErrorMessage('Hotswap: This command must be run from a VSIX file in the explorer.')
			return
		}

		const vsixFilename = path.basename(vsixUri.fsPath)

		// Filename format: publisher.name-version.vsix or name-version.vsix
		// We need to extract the publisher and name.
		// Example: NewRealityDesigns.project-butler-0.1.0-dev.12345.vsix
		// Example from script: project-butler-0.1.0-dev.12345.vsix
		const match = vsixFilename.match(/^(?:([\w-]+)\.)?([\w-]+)-\d+\.\d+\.\d+.*\.vsix$/)

		if (!match) {
			this.window.showErrorMessage(`Hotswap: Could not parse extension ID from filename: ${vsixFilename}`)
			return
		}

		// The publisher is optional in some vsix naming conventions, so we need to find it.
		// The most reliable way is to find an installed extension with the same base name.
		const extensionBaseName = match[2]
		const installed = vscode.extensions.all.find(ext => ext.id.endsWith(`.${extensionBaseName}`))

		if (!installed) {
			this.window.showWarningMessage(`Hotswap: No currently installed extension found for '${extensionBaseName}'. Will proceed with installation only.`)
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

			this.window.showInformationMessage(`✅ Hotswap complete: ${extensionBaseName} reinstalled.`)
		}
		catch (error: any) {
			this.window.showErrorMessage(`Hotswap failed: ${error.message}`)
			console.error(error)
		}
	}

}
