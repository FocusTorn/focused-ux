import * as vscode from 'vscode'
import type { IRelativePattern } from '../../_interfaces/IVSCode.js'

export class RelativePatternAdapter implements IRelativePattern {

	constructor(public readonly relativePattern: vscode.RelativePattern) {}

	get pattern(): string { return this.relativePattern.pattern }
	get base(): string { return this.relativePattern.base }

	static create(base: string, pattern: string): IRelativePattern {
		const relativePattern = new vscode.RelativePattern(base, pattern)

		return new RelativePatternAdapter(relativePattern)
	}

}
