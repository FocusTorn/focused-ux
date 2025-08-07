import * as vscode from 'vscode'
import type { IRange, IPosition } from '../../_interfaces/IVSCode.js'

export class RangeAdapter implements IRange {

	constructor(private range: vscode.Range) {}

	get start(): IPosition {
		return {
			create: (_line: number, _character: number) => this.range.start,
		}
	}

	get end(): IPosition {
		return {
			create: (_line: number, _character: number) => this.range.end,
		}
	}

	static create(start: vscode.Position, end: vscode.Position): IRange {
		return new RangeAdapter(new vscode.Range(start, end))
	}

}
