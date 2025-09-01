import { Range } from 'vscode'
import type { IRange, IPosition } from '../../_interfaces/IVSCode.js'

export class RangeAdapter implements IRange {

	constructor(private range: any) {}

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

	static create(start: any, end: any): IRange {
		// Extract line and character from the input objects
		const startLine = start.line
		const startCharacter = start.character
		const endLine = end.line
		const endCharacter = end.character
		
		// Create VSCode Range - during tests this will be Mockly via the test adapter
		const vscodeRange = new Range(startLine, startCharacter, endLine, endCharacter)

		return new RangeAdapter(vscodeRange)
	}

	// Factory method to create from VSCode Range
	static fromVSCode(vscodeRange: any): RangeAdapter {
		return new RangeAdapter(vscodeRange)
	}

}
