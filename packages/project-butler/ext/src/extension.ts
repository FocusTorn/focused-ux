import type { ExtensionContext, Disposable, Uri } from 'vscode'
import * as vscode from 'vscode'
import type { IProjectButlerService } from '@fux/project-butler-core'
import { createDIContainer } from './injection.js'
import { constants } from './_config/constants.js'
import { hotswap } from './hotswap.js'

export function activate(context: ExtensionContext): void {
	console.log(`[${constants.extension.name}] Activating...`)

	const containerPromise = createDIContainer(context);

	(async () => {
		const container = await containerPromise
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
		console.log(`[${constants.extension.name}] Activated.`)
	})()
}

export function deactivate(): void {}
