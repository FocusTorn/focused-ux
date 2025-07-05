import { window } from 'vscode'
import type { ExtensionContext, Disposable } from 'vscode'
import * as vscode from 'vscode'
import { createDIContainer } from './injection.js'
import type { GhostWriterModule } from './GhostWriter.module.js'
import { constants } from './_config/constants.js'

export function activate(context: ExtensionContext): void {
	window.showInformationMessage(`✅ Ghost Writer Loaded.`)

	console.log(`[${constants.extension.name}] Activating...`)

	const container = createDIContainer(context)

	const ghostWriterModule = container.resolve<GhostWriterModule>('ghostWriterModule')

	const disposables: Disposable[] = [
		vscode.commands.registerCommand(
			constants.commands.storeCodeFragment,
			() => ghostWriterModule.handleStoreCodeFragment(),
		),
		vscode.commands.registerCommand(
			constants.commands.insertImportStatement,
			() => ghostWriterModule.handleInsertImportStatement(),
		),
		vscode.commands.registerCommand(
			constants.commands.logSelectedVariable,
			() => ghostWriterModule.handleLogSelectedVariable(),
		),
	]

	context.subscriptions.push(...disposables)
	console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {}
