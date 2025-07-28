import type { ExtensionContext, Disposable, Uri } from 'vscode'
import * as vscode from 'vscode'
import type { IProjectButlerService } from '@fux/project-butler-core'
import { createDIContainer } from './injection.js'
import { constants } from './_config/constants.js'
import { hotswap } from './hotswap.js'

export async function activate(context: ExtensionContext): Promise<void> {
	console.log(`[${constants.extension.name}] Activating...`)

	try {
		const container = await createDIContainer(context)
		const projectButlerService = container.resolve('projectButlerService') as IProjectButlerService

		const disposables: Disposable[] = [
			vscode.commands.registerCommand(constants.commands.updateTerminalPath, (uri?: Uri) =>
				projectButlerService.updateTerminalPath(uri?.fsPath)),

			vscode.commands.registerCommand(constants.commands.createBackup, (uri?: Uri) =>
				projectButlerService.createBackup(uri?.fsPath)),

			vscode.commands.registerCommand(constants.commands.enterPoetryShell, (uri?: Uri) =>
				projectButlerService.enterPoetryShell(uri?.fsPath)),

			vscode.commands.registerCommand(constants.commands.formatPackageJson, (uri?: Uri) =>
				projectButlerService.formatPackageJson(uri?.fsPath)),

			vscode.commands.registerCommand(constants.commands.hotswap, (uri?: Uri) => {
				if (!uri) {
					vscode.window.showErrorMessage('Hotswap command must be run from a VSIX file.')
					return Promise.resolve()
				}
				return hotswap(uri)
			}),
		]

		context.subscriptions.push(...disposables)
		console.log(`[${constants.extension.name}] Activated successfully.`)
	} catch (error) {
		console.error(`[${constants.extension.name}] Failed to activate:`, error)
		vscode.window.showErrorMessage(`Failed to activate ${constants.extension.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
	}
}

export function deactivate(): void {}
