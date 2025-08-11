import type { TextDocument, TextLine, Position as VSCodePosition, Range as VSCodeRange } from 'vscode'
import { Position, Range } from './vscClasses.js'

export class MockTextDocument implements TextDocument {

	public readonly uri: any
	public readonly fileName: string
	public readonly isUntitled: boolean
	public readonly languageId: string
	public readonly version: number
	public get isDirty(): boolean {
		return this._isDirty
	}

	public readonly isClosed: boolean
	public readonly eol: number
	public readonly encoding: string
	private _lines: string[] = []
	private _lineCount: number = 0
	private _isDirty: boolean = false

	constructor(uri: any, content: string = '') {
		this.uri = uri
		this.fileName = uri?.fsPath || uri?.path || 'mock-document.md'
		this.isUntitled = false
		this.languageId = 'markdown'
		this.version = 1
		this._isDirty = false
		this.isClosed = false
		this.eol = 1 // LF
		this.encoding = 'utf8'
		this.setContent(content)
	}

	get lineCount(): number {
		return this._lineCount
	}

	getText(range?: VSCodeRange): string {
		if (!range) {
			return this._lines.join('\n')
		}

		const startLine = range.start.line
		const endLine = range.end.line
		const startChar = range.start.character
		const endChar = range.end.character

		if (startLine === endLine) {
			return this._lines[startLine]?.substring(startChar, endChar) || ''
		}

		const lines = [this._lines[startLine]?.substring(startChar) || '']

		for (let i = startLine + 1; i < endLine; i++) {
			lines.push(this._lines[i] || '')
		}
		lines.push(this._lines[endLine]?.substring(0, endChar) || '')
		return lines.join('\n')
	}

	getLineText(line: number): string {
		return this._lines[line] || ''
	}

	lineAt(lineOrPosition: number | VSCodePosition): TextLine {
		let lineNumber: number

		if (typeof lineOrPosition === 'number') {
			lineNumber = lineOrPosition
		}
		else {
			lineNumber = lineOrPosition.line
		}

		const lineText = this._lines[lineNumber] || ''

		return {
			lineNumber,
			text: lineText,
			range: new Range(lineNumber, 0, lineNumber, lineText.length),
			rangeIncludingLineBreak: new Range(lineNumber, 0, lineNumber + 1, 0),
			firstNonWhitespaceCharacterIndex: lineText.search(/\S/),
			isEmptyOrWhitespace: /^\s*$/.test(lineText),
		}
	}

	getWordRangeAtPosition(position: VSCodePosition, regex?: RegExp): VSCodeRange | undefined {
		const lineText = this._lines[position.line] || ''

		if (!lineText)
			return undefined

		if (regex) {
			// Simple regex matching for mock purposes
			const matches = lineText.match(regex)

			if (matches) {
				return new Range(position.line, 0, position.line, lineText.length)
			}
		}

		// Simple word boundary detection
		const wordRegex = /\b\w+\b/g
		let match

		while ((match = wordRegex.exec(lineText)) !== null) {
			if (match.index <= position.character && match.index + match[0].length > position.character) {
				return new Range(position.line, match.index, position.line, match.index + match[0].length)
			}
		}

		return undefined
	}

	save(): Promise<boolean> {
		this._isDirty = false
		return Promise.resolve(true)
	}

	positionAt(offset: number): VSCodePosition {
		let currentOffset = 0

		for (let i = 0; i < this._lines.length; i++) {
			// Add +1 for newline only if it's not the last line
			const lineLength = this._lines[i].length + (i < this._lines.length - 1 ? 1 : 0)

			if (currentOffset + lineLength > offset) {
				return new Position(i, offset - currentOffset)
			}
			currentOffset += lineLength
		}
		return new Position(this._lines.length, 0)
	}

	offsetAt(position: VSCodePosition): number {
		let offset = 0

		for (let i = 0; i < position.line; i++) {
			// Add +1 for newline only if it's not the last line
			offset += this._lines[i].length + (i < this._lines.length - 1 ? 1 : 0)
		}
		return offset + position.character
	}

	validateRange(range: VSCodeRange): VSCodeRange {
		const startLine = Math.max(0, Math.min(range.start.line, this._lines.length - 1))
		const endLine = Math.max(0, Math.min(range.end.line, this._lines.length - 1))
		const startChar = Math.max(0, Math.min(range.start.character, this._lines[startLine]?.length || 0))
		const endChar = Math.max(0, Math.min(range.end.character, this._lines[endLine]?.length || 0))

		return new Range(startLine, startChar, endLine, endChar)
	}

	validatePosition(position: VSCodePosition): VSCodePosition {
		const line = Math.max(0, Math.min(position.line, this._lines.length - 1))
		const character = Math.max(0, Math.min(position.character, this._lines[line]?.length || 0))

		return new Position(line, character)
	}

	setContent(content: string): void {
		// Split by newlines and filter out trailing empty lines
		this._lines = content.split('\n')
		// Remove trailing empty lines to match VSCode behavior
		while (this._lines.length > 0 && this._lines[this._lines.length - 1] === '') {
			this._lines.pop()
		}
		this._lineCount = this._lines.length
		this._isDirty = true
	}

	getContent(): string {
		return this._lines.join('\n')
	}

	getLines(): string[] {
		return [...this._lines]
	}

	getLineCount(): number {
		return this._lineCount
	}

}
