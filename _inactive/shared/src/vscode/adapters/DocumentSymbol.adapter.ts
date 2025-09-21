import type * as vscode from 'vscode'
import type { IDocumentSymbol, IRange } from '../../_interfaces/IVSCode.js'
import { RangeAdapter } from './Range.adapter.js'

export class DocumentSymbolAdapter implements IDocumentSymbol {

	constructor(private symbol: vscode.DocumentSymbol) {}

	get name(): string {
		return this.symbol.name
	}

	get range(): IRange {
		return new RangeAdapter(this.symbol.range)
	}

	get children(): IDocumentSymbol[] | undefined {
		return this.symbol.children?.map(child => new DocumentSymbolAdapter(child))
	}

	static fromVSCodeSymbols(symbols: vscode.DocumentSymbol[] | undefined): IDocumentSymbol[] | undefined {
		return symbols?.map(symbol => new DocumentSymbolAdapter(symbol))
	}

}
