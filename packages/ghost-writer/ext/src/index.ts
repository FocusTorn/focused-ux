import type { ExtensionContext, Disposable, TextEditorEdit, WorkspaceConfiguration } from 'vscode'
import type {
	IClipboardService,
	IConsoleLoggerService,
	IImportGeneratorService,
} from '@fux/ghost-writer-core'
import { createDIContainer } from './injection.js'
import { constants } from './_config/constants.js'
import type { IWindow, IWorkspace, ICommands, IPosition } from '@fux/shared'

export function activate(context: ExtensionContext): void {
	console.log(`[${constants.extension.name}] Activating...`)

	const containerPromise = createDIContainer(context);

	(async () => {
		const container = await containerPromise
		// Resolve services
		const clipboardService = container.resolve<IClipboardService>('clipboardService')
		const consoleLoggerService = container.resolve<IConsoleLoggerService>('consoleLoggerService')
		const importGeneratorService = container.resolve<IImportGeneratorService>('importGeneratorService')
		const window = container.resolve<IWindow>('window')
		const workspace = container.resolve<IWorkspace>('workspace')
		const commands = container.resolve<ICommands>('commands')
		const position = container.resolve<IPosition>('position')

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
				await window.showTimedInformationMessage(`Stored fragment: ${selectedText}`)
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

			const config: WorkspaceConfiguration = workspace.getConfiguration(constants.extension.configKey)
			const includeClassName = config.get<boolean>(
				constants.configKeys.loggerIncludeClassName,
				true,
			) ?? true
			const includeFunctionName = config.get<boolean>(
				constants.configKeys.loggerIncludeFunctionName,
				true,
			) ?? true

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
						const positionInstance = position.create(result.insertLine, 0)

						editBuilder.insert(positionInstance, result.logStatement)
					})
				}
			}
		}

		const disposables: Disposable[] = [
			commands.registerCommand(
				constants.commands.storeCodeFragment,
				handleStoreCodeFragment,
			),
			commands.registerCommand(
				constants.commands.insertImportStatement,
				handleInsertImportStatement,
			),
			commands.registerCommand(
				constants.commands.logSelectedVariable,
				handleLogSelectedVariable,
			),
		]

		context.subscriptions.push(...disposables)

		// void window.showTimedInformationMessage('✅ Ghost Writer Loaded.')

		console.log(`[${constants.extension.name}] Activated.`)
	})()
}

export function deactivate(): void {}

// Export the injection module
export { createDIContainer } from './injection.js'
