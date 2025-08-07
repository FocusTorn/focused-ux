import * as vscode from 'vscode'
import type { ITextEditor, IEditBuilder, IRange } from '../../_interfaces/IVSCode.js'

export class TextEditorAdapter implements ITextEditor {

	constructor(private editor: vscode.TextEditor) {}

	async edit(editFunction: (editBuilder: IEditBuilder) => void): Promise<boolean> {
		return await this.editor.edit((editBuilder) => {
			const adapter = new EditBuilderAdapter(editBuilder)

			editFunction(adapter)
		})
	}

}

export class EditBuilderAdapter implements IEditBuilder {

	constructor(private editBuilder: vscode.TextEditorEdit) {}

	replace(range: IRange, text: string): void {
		// Convert our IRange to vscode.Range
		const vscodeRange = new vscode.Range(
			(range.start as any).create(0, 0),
			(range.end as any).create(0, 0),
		)

		this.editBuilder.replace(vscodeRange, text)
	}

}
