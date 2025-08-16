import type { ExtensionContext, Disposable, Uri } from 'vscode'
import { ExtensionContextAdapter, ExtensionAPIAdapter } from '@fux/shared'
import type { IProjectButlerService } from '@fux/project-butler-core'
import { createDIContainer } from './injection.js'
import { constants } from './_config/constants.js'
import { hotswap } from './hotswap.js'

export async function activate(context: ExtensionContext): Promise<void> {
	console.log(`[${constants.extension.name}] Activating...`)

	let container: any = null

	try {
		const extensionContext = new ExtensionContextAdapter(context)
		const extensionAPI = new ExtensionAPIAdapter()

		container = await createDIContainer(context)

		const projectButlerService = container.resolve('projectButlerService') as IProjectButlerService

		const disposables: Disposable[] = [
			extensionAPI.registerCommand(constants.commands.updateTerminalPath, (uri?: Uri) =>
				projectButlerService.updateTerminalPath(uri?.fsPath)),

			extensionAPI.registerCommand(constants.commands.createBackup, (uri?: Uri) =>
				projectButlerService.createBackup(uri?.fsPath)),

			extensionAPI.registerCommand(constants.commands.enterPoetryShell, (uri?: Uri) =>
				projectButlerService.enterPoetryShell(uri?.fsPath)),

			extensionAPI.registerCommand(constants.commands.formatPackageJson, (uri?: Uri) =>
				projectButlerService.formatPackageJson(uri?.fsPath)),

			extensionAPI.registerCommand(constants.commands.hotswap, (uri?: Uri) => {
				if (!uri) {
					// Use the container if available, otherwise fall back to console
					if (container) {
						const windowAdapter = container.resolve('window')
						windowAdapter.showErrorMessage('Hotswap command must be run from a VSIX file.')
					} else {
						console.error('Hotswap command must be run from a VSIX file.')
					}
					return Promise.resolve()
				}

				const windowAdapter = container.resolve('window')

				return hotswap(uri, windowAdapter)
			}),
		]

		extensionContext.subscriptions.push(...disposables)
		console.log(`[${constants.extension.name}] Activated successfully.`)
	}
	catch (error) {
		console.error(`[${constants.extension.name}] Failed to activate:`, error)

		// Try to show error message using container if available, otherwise fall back to console
		if (container) {
			try {
				const windowAdapter = container.resolve('window')
				windowAdapter.showErrorMessage(`Failed to activate ${constants.extension.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
			} catch (containerError) {
				console.error(`[${constants.extension.name}] Failed to show error message:`, containerError)
			}
		} else {
			console.error(`[${constants.extension.name}] Container creation failed, cannot show error message to user`)
		}
	}
}

export function deactivate(): void {}
