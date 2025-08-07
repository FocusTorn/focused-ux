import type * as vscode from 'vscode'
import type { ITextDocument, IUri, IPosition } from '../../_interfaces/IVSCode.js'
import { UriAdapter } from './Uri.adapter.js'

export class TextDocumentAdapter implements ITextDocument {

	constructor(private document: vscode.TextDocument) {}

	get uri(): IUri {
		return new UriAdapter(this.document.uri)
	}

	getText(): string {
		return this.document.getText()
	}

	positionAt(offset: number): IPosition {
		const position = this.document.positionAt(offset)

		return {
			create: (_line: number, _character: number) => position,
		}
	}

	async save(): Promise<void> {
		await this.document.save()
	}

}
