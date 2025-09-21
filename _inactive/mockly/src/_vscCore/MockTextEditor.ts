import type { TextEditor, TextDocument, TextEditorRevealType } from 'vscode'
import { Position, Selection, Range } from './vscClasses.js'
import { MockTextDocument } from './MockTextDocument.js'

export class MockTextEditor implements TextEditor {

	readonly document: TextDocument
	selection: Selection
	selections: Selection[]
	visibleRanges: Range[]
	readonly options: any
	readonly viewColumn: number

	private _selections: Selection[]
	private _visibleRanges: Range[]

	constructor(document: TextDocument) {
		this.document = document
		this.selection = new Selection(0, 0, 0, 0)
		this.selections = [this.selection]
		this.visibleRanges = [new Range(0, 0, 0, 0)]
		this.options = {}
		this.viewColumn = 1
		
		this._selections = [this.selection]
		this._visibleRanges = [new Range(0, 0, 0, 0)]
	}

	edit(editFunction: (editBuilder: any) => void): Promise<boolean> {
		// Mock edit builder
		const editBuilder = {
			replace: (range: Range, text: string) => {
				// In a real implementation, this would modify the document
				// For now, we'll just log the edit
				console.log(`Mock edit: replace ${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character} with "${text}"`)
			},
			insert: (position: Position, text: string) => {
				console.log(`Mock edit: insert "${text}" at ${position.line}:${position.character}`)
			},
			delete: (range: Range) => {
				console.log(`Mock edit: delete ${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}`)
			},
		}

		try {
			editFunction(editBuilder)
			return Promise.resolve(true)
		}
		catch (_error) {
			return Promise.resolve(false)
		}
	}

	setDecorations(decorationType: any, rangesOrOptions: Range[] | any[]): void {
		// Mock decoration setting
		console.log(`Mock decoration: ${decorationType} applied to ${rangesOrOptions.length} ranges`)
	}

	revealRange(range: Range, _revealType?: TextEditorRevealType): void {
		// Mock range revelation
		console.log(`Mock reveal: ${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}`)
	}

	show(column?: number): void {
		// Mock editor show
		console.log(`Mock show: editor shown in column ${column || this.viewColumn}`)
	}

	hide(): void {
		// Mock editor hide
		console.log(`Mock hide: editor hidden`)
	}

	insertSnippet(snippet: any, _location?: Position | Position[] | Range | Range[]): Promise<boolean> {
		// Mock snippet insertion
		console.log(`Mock insertSnippet: ${snippet}`)
		return Promise.resolve(true)
	}

	// Enhanced methods for testing
	setSelection(selection: Selection): void {
		this.selection = selection
		this.selections = [selection]
		this._selections = [selection]
	}

	setSelections(selections: Selection[]): void {
		if (selections.length > 0) {
			this.selection = selections[0]
			this.selections = [...selections]
			this._selections = [...selections]
		}
	}

	setVisibleRanges(ranges: Range[]): void {
		this.visibleRanges = [...ranges]
		this._visibleRanges = [...ranges]
	}

	// Utility methods for testing
	getSelection(): Selection {
		return this.selection
	}

	getSelections(): Selection[] {
		return [...this.selections]
	}

	getVisibleRanges(): Range[] {
		return [...this.visibleRanges]
	}

	// Mock document modification for testing
	modifyDocument(content: string): void {
		if (this.document instanceof MockTextDocument) {
			(this.document as MockTextDocument).setContent(content)
		}
	}

	// Mock cursor movement for testing
	moveCursor(line: number, character: number): void {
		const _newPosition = new Position(line, character)
		const newSelection = new Selection(line, character, line, character)

		this.setSelection(newSelection)
	}

	// Mock text selection for testing
	selectText(startLine: number, startChar: number, endLine: number, endChar: number): void {
		const newSelection = new Selection(startLine, startChar, endLine, endChar)

		this.setSelection(newSelection)
	}

}
