import type { IWindow, IWorkspace } from '@fux/shared-services'
import type { IClipboardService, IImportGeneratorService, IConsoleLoggerService } from '@fux/ghost-writer-core'
import { Position } from 'vscode'
import { constants } from './_config/constants.js'

export class GhostWriterModule {

	constructor(
		private readonly deps: {
			clipboardService: IClipboardService
			importGeneratorService: IImportGeneratorService
			consoleLoggerService: IConsoleLoggerService
			iWindow: IWindow
			iWorkspace: IWorkspace
		},
	) {}

	public async handleStoreCodeFragment(): Promise<void> {
		const editor = this.deps.iWindow.activeTextEditor

		if (!editor) {
			this.deps.iWindow.showErrorMessage('No active text editor.')
			return
		}

		const selection = editor.selection
		const selectedText = editor.document.getText(selection)

		if (selectedText.trim()) {
			await this.deps.clipboardService.store({
				text: selectedText,
				sourceFilePath: editor.document.fileName,
			})
			this.deps.iWindow.showInformationMessage(`Stored fragment: ${selectedText}`)
		}
		else {
			this.deps.iWindow.showErrorMessage('No text selected to store.')
		}
	}

	public async handleInsertImportStatement(): Promise<void> {
		const editor = this.deps.iWindow.activeTextEditor

		if (!editor) {
			this.deps.iWindow.showErrorMessage('No active text editor.')
			return
		}

		const fragment = await this.deps.clipboardService.retrieve()

		if (!fragment) {
			this.deps.iWindow.showErrorMessage('No fragment stored in Ghost Writer clipboard.')
			return
		}

		const importStatement = this.deps.importGeneratorService.generate(editor.document.fileName, fragment)

		if (importStatement) {
			await editor.edit((editBuilder) => {
				editBuilder.insert(editor.selection.active, importStatement)
			})
			// Clear the clipboard after successful insertion
			await this.deps.clipboardService.clear()
		}
		// Error messages are handled by the service layer
	}

	public async handleLogSelectedVariable(): Promise<void> {
		const editor = this.deps.iWindow.activeTextEditor

		if (!editor) {
			this.deps.iWindow.showErrorMessage('No active text editor.')
			return
		}

		const config = this.deps.iWorkspace.getConfiguration(constants.extension.configKey)
		const includeClassName = config.get<boolean>(constants.configKeys.loggerIncludeClassName, true)
		const includeFunctionName = config.get<boolean>(constants.configKeys.loggerIncludeFunctionName, true)

		for (const selection of editor.selections) {
			const selectedVar = editor.document.getText(selection)

			if (!selectedVar.trim()) {
				continue
			}

			const result = this.deps.consoleLoggerService.generate({
				documentContent: editor.document.getText(),
				fileName: editor.document.fileName,
				selectedVar,
				selectionLine: selection.active.line,
				includeClassName,
				includeFunctionName,
			})

			if (result) {
				await editor.edit((editBuilder) => {
					const position = new Position(result.insertLine, 0)

					editBuilder.insert(position, result.logStatement)
				})
			}
		}
	}

}
