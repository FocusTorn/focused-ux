import type { ExtensionContext, Disposable, Uri } from 'vscode'
import * as vscode from 'vscode'
import { createDIContainer } from './injection.js'
import type { ProjectButlerModule } from './ProjectButler.module.js'
import { constants } from './_config/constants.js'

export function activate(context: ExtensionContext): void {
	console.log(`[${constants.extension.name}] Activating...`)

	const container = createDIContainer(context)

	const projectButlerModule = container.resolve<ProjectButlerModule>('projectButlerModule')

	const disposables: Disposable[] = [
		vscode.commands.registerCommand(constants.commands.updateTerminalPath, (uri?: Uri) =>
			projectButlerModule.handleUpdateTerminalPath(uri)),
		vscode.commands.registerCommand(constants.commands.enterPoetryShell, (uri?: Uri) =>
			projectButlerModule.handleEnterPoetryShell(uri)),
		vscode.commands.registerCommand(constants.commands.formatPackageJson, (uri?: Uri) =>
			projectButlerModule.handleFormatPackageJson(uri)),
		vscode.commands.registerCommand(constants.commands.createBackup, (uri?: Uri) =>
			projectButlerModule.handleCreateBackup(uri)),
		vscode.commands.registerCommand(constants.commands.hotswap, (uri?: Uri) =>
			projectButlerModule.handleHotswap(uri)),
	]

	context.subscriptions.push(...disposables)
	console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {}