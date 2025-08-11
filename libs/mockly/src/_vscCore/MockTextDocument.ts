import type { TextDocument, Uri, Position, Range } from 'vscode'
import { MockPosition, MockRange } from './vscClasses.js'

export class MockTextDocument implements TextDocument {
	readonly uri: Uri
	readonly fileName: string
	readonly isUntitled: boolean
	readonly languageId: string
	readonly version: number
	readonly isDirty: boolean
	readonly isClosed: boolean
	readonly eol: number
	readonly lineCount: number

	private _content: string
	private _lines: string[]

	constructor(uri: Uri, content: string = '', languageId: string = 'markdown') {
		this.uri = uri
		this.fileName = uri.fsPath
		this.isUntitled = false
		this.languageId = languageId
		this.version = 1
		this.isDirty = false
		this.isClosed = false
		this.eol = 1 // LF
		this._content = content
		this._lines = content ? content.split('\n') : ['']
		this.lineCount = this._lines.length
	}

	getText(range?: Range): string {
		if (!range) {
			return this._content
		}

		// Simple range extraction - in a real implementation this would be more sophisticated
		const startLine = range.start.line
		const endLine = range.end.line
		const startChar = range.start.character
		const endChar = range.end.character

		if (startLine === endLine) {
			return this._lines[startLine]?.substring(startChar, endChar) || ''
		}

		const lines = this._lines.slice(startLine, endLine + 1)
		if (lines.length > 0) {
			lines[0] = lines[0].substring(startChar)
			lines[lines.length - 1] = lines[lines.length - 1].substring(0, endChar)
		}

		return lines.join('\n')
	}

	getLineText(line: number): string {
		return this._lines[line] || ''
	}

	positionAt(offset: number): Position {
		if (offset < 0) {
			return new MockPosition(0, 0)
		}

		let currentOffset = 0
		for (let line = 0; line < this._lines.length; line++) {
			const lineLength = this._lines[line].length + 1 // +1 for newline
			if (currentOffset + lineLength > offset) {
				const character = offset - currentOffset
				return new MockPosition(line, character)
			}
			currentOffset += lineLength
		}

		// If offset is beyond content, return position at end
		return new MockPosition(this._lines.length - 1, this._lines[this._lines.length - 1]?.length || 0)
	}

	offsetAt(position: Position): number {
		let offset = 0
		for (let line = 0; line < position.line; line++) {
			offset += (this._lines[line]?.length || 0) + 1 // +1 for newline
		}
		offset += position.character
		return offset
	}

	validateRange(range: Range): Range {
		// Ensure range is within document bounds
		const startLine = Math.max(0, Math.min(range.start.line, this.lineCount - 1))
		const endLine = Math.max(0, Math.min(range.end.line, this.lineCount - 1))
		
		const startChar = Math.max(0, Math.min(range.start.character, this._lines[startLine]?.length || 0))
		const endChar = Math.max(0, Math.min(range.end.character, this._lines[endLine]?.length || 0))

		return new MockRange(startLine, startChar, endLine, endChar)
	}

	validatePosition(position: Position): Position {
		const line = Math.max(0, Math.min(position.line, this.lineCount - 1))
		const character = Math.max(0, Math.min(position.character, this._lines[line]?.length || 0))
		return new MockPosition(line, character)
	}

	// Mock methods for testing
	setContent(content: string): void {
		this._content = content
		this._lines = content ? content.split('\n') : ['']
		this.lineCount = this._lines.length
		this.version++
	}

	getContent(): string {
		return this._content
	}

	// Utility methods for testing
	getLines(): string[] {
		return [...this._lines]
	}

	getLineCount(): number {
		return this.lineCount
	}
} 