import type { Uri } from 'vscode'
import type { IWindowPB } from '@fux/shared'
import { ExtensionsAdapter, ProgressAdapter, ExtensionAPIAdapter } from '@fux/shared'
import * as path from 'node:path'

export async function hotswap(vsixUri: Uri, windowAdapter: IWindowPB): Promise<void> {
	const vsixFilename = path.basename(vsixUri.fsPath)
	const match = vsixFilename.match(/^(?:([\w-]+)\.)?([\w-]+)-\d+\.\d+\.\d+.*\.vsix$/)

	if (!match) {
		windowAdapter.showErrorMessage(
			`Hotswap: Could not parse extension ID from filename: ${vsixFilename}`,
		)
		return
	}

	const extensionBaseName = match[2]
	const extensionsAdapter = new ExtensionsAdapter()
	const installed = extensionsAdapter.all.find(ext => ext.id.endsWith(`.${extensionBaseName}`))

	if (!installed) {
		windowAdapter.showWarningMessage(
			`Hotswap: No currently installed extension found for '${extensionBaseName}'. Will proceed with installation only.`,
		)
	}

	const targetExtensionId = installed ? installed.id : `NewRealityDesigns.${extensionBaseName}`

	try {
		const extensionAPI = new ExtensionAPIAdapter()
		
		await ProgressAdapter.withProgress(
			{
				location: 15, // ProgressLocation.Notification
				title: `Hotswapping ${extensionBaseName}`,
				cancellable: false,
			},
			async (progress) => {
				if (installed) {
					progress.report({ message: `Uninstalling ${targetExtensionId}...` })
					await extensionAPI.executeCommand(
						'workbench.extensions.uninstallExtension',
						targetExtensionId,
					)
				}

				progress.report({ message: `Installing from ${vsixFilename}...` })
				await extensionAPI.executeCommand('workbench.extensions.installExtension', vsixUri)

				progress.report({ message: 'Installation complete.' })
				await new Promise(resolve => setTimeout(resolve, 1500))
			},
		)

		const choice = await windowAdapter.showInformationMessage(
			`✅ Hotswap complete: ${extensionBaseName} reinstalled. A reload is required.`,
			true,
			'Reload Window',
		)

		if (choice === 'Reload Window') {
			await extensionAPI.executeCommand('workbench.action.reloadWindow')
		}
	}
	catch (error: any) {
		windowAdapter.showErrorMessage(`Hotswap failed: ${error.message}`)
		console.error(error)
	}
}
