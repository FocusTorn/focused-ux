import type { ExtensionContext, Disposable, TextEditorEdit } from 'vscode'
import * as vscode from 'vscode'
import { Position } from 'vscode'
import type {
	IClipboardService,
	IConsoleLoggerService,
	IImportGeneratorService,
} from '@fux/ghost-writer-core'
import { createDIContainer } from './injection.js'
import { constants } from './_config/constants.js'
import type { IWindow, IWorkspace } from './_interfaces/IVSCode.js'

export function activate(context: ExtensionContext): void {
	console.log(`[${constants.extension.name}] Activating...`)

	const container = createDIContainer(context)

	// Resolve services
	const clipboardService = container.resolve<IClipboardService>('clipboardService')
	const consoleLoggerService = container.resolve<IConsoleLoggerService>('consoleLoggerService')
	const importGeneratorService = container.resolve<IImportGeneratorService>('importGeneratorService')
	const window = container.resolve<IWindow>('window')
	const workspace = container.resolve<IWorkspace>('workspace')

	// Command Handlers
	const handleStoreCodeFragment = async (): Promise<void> => {
		const editor = window.activeTextEditor
		if (!editor) {
			window.showErrorMessage('No active text editor.')
			return
		}
		const selection = editor.selection
		const selectedText = editor.document.getText(selection)
		if (selectedText.trim()) {
			await clipboardService.store({
				text: selectedText,
				sourceFilePath: editor.document.fileName,
			})
			window.showInformationMessage(`Stored fragment: ${selectedText}`)
		}
		else {
			window.showErrorMessage('No text selected to store.')
		}
	}

	const handleInsertImportStatement = async (): Promise<void> => {
		const editor = window.activeTextEditor
		if (!editor) {
			window.showErrorMessage('No active text editor.')
			return
		}
		const fragment = await clipboardService.retrieve()
		if (!fragment) {
			window.showErrorMessage('No fragment stored in Ghost Writer clipboard.')
			return
		}
		const importStatement = importGeneratorService.generate(
			editor.document.fileName,
			fragment,
		)
		if (importStatement) {
			await editor.edit((editBuilder: TextEditorEdit) => {
				editBuilder.insert(editor.selection.active, importStatement)
			})
			await clipboardService.clear()
		}
	}

	const handleLogSelectedVariable = async (): Promise<void> => {
		const editor = window.activeTextEditor
		if (!editor) {
			window.showErrorMessage('No active text editor.')
			return
		}
		const config = workspace.getConfiguration(constants.extension.configKey)
		const includeClassName = config.get<boolean>(
			constants.configKeys.loggerIncludeClassName,
			true,
		)
		const includeFunctionName = config.get<boolean>(
			constants.configKeys.loggerIncludeFunctionName,
			true,
		)

		for (const selection of editor.selections) {
			const selectedVar = editor.document.getText(selection)
			if (!selectedVar.trim()) {
				continue
			}
			const result = consoleLoggerService.generate({
				documentContent: editor.document.getText(),
				fileName: editor.document.fileName,
				selectedVar,
				selectionLine: selection.active.line,
				includeClassName,
				includeFunctionName,
			})
			if (result) {
				await editor.edit((editBuilder: TextEditorEdit) => {
					const position = new Position(result.insertLine, 0)
					editBuilder.insert(position, result.logStatement)
				})
			}
		}
	}

	const disposables: Disposable[] = [
		vscode.commands.registerCommand(
			constants.commands.storeCodeFragment,
			handleStoreCodeFragment,
		),
		vscode.commands.registerCommand(
			constants.commands.insertImportStatement,
			handleInsertImportStatement,
		),
		vscode.commands.registerCommand(
			constants.commands.logSelectedVariable,
			handleLogSelectedVariable,
		),
	]

	context.subscriptions.push(...disposables)
	vscode.window.showInformationMessage('✅ Ghost Writer Loaded.')
	console.log(`[${constants.extension.name}] Activated.`)
}

export function deactivate(): void {}