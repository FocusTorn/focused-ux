import type { Uri } from 'vscode'
import * as vscode from 'vscode'
import * as path from 'node:path'

export async function hotswap(vsixUri: Uri): Promise<void> {
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

				progress.report({ message: 'Installation complete.' })
				await new Promise(resolve => setTimeout(resolve, 1500))
			},
		)

		const choice = await vscode.window.showInformationMessage(
			`✅ Hotswap complete: ${extensionBaseName} reinstalled. A reload is required.`,
			{ modal: true },
			'Reload Window',
		)

		if (choice === 'Reload Window') {
			await vscode.commands.executeCommand('workbench.action.reloadWindow')
		}
	}
	catch (error: any) {
		vscode.window.showErrorMessage(`Hotswap failed: ${error.message}`)
		console.error(error)
	}
}