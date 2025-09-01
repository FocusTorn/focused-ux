import type * as vt from 'vscode'
import type { DiagnosticSeverity, TreeItemCollapsibleState, EndOfLine } from './vscEnums.js'

export class Diagnostic implements vt.Diagnostic {

	range: Range
	message: string
	severity: DiagnosticSeverity
	source?: string
	code?: string | number | { value: string | number, target: vt.Uri }
	relatedInformation?: vt.DiagnosticRelatedInformation[]
	tags?: vt.DiagnosticTag[]

	constructor(
		range: Range,
		message: string,
		severity: DiagnosticSeverity,
	) {
		this.range = range
		this.message = message
		this.severity = severity
	}

}

export class Disposable implements vt.Disposable {

	private _callOnDispose: () => any
	private _isDisposed = false

	constructor(callOnDispose: () => any) {
		this._callOnDispose = callOnDispose
	}

	dispose(): any {
		if (!this._isDisposed) {
			this._isDisposed = true
			try {
				this._callOnDispose()
			}
			catch (e) {
				console.error('Error during Disposable dispose:', e)
			}
		}
	}

	[Symbol.dispose](): void {
		this.dispose()
	}

	static from(...disposableLikes: { dispose: () => any }[]): Disposable {
		return new Disposable(() => {
			for (const disposable of disposableLikes) {
				if (disposable && typeof disposable.dispose === 'function') {
					disposable.dispose()
				}
			}
		})
	}

}

export class EventEmitter<T> implements vt.EventEmitter<T> {

	private _listeners: Set<{ listener: (e: T) => any, thisArgs?: any }> = new Set()
	private _disposed = false

	get event(): vt.Event<T> {
		return (listener: (e: T) => any, thisArgs?: any) => {
			if (this._disposed) {
				return new Disposable(() => {})
			}

			const listenerObj = { listener, thisArgs }

			this._listeners.add(listenerObj)

			return new Disposable(() => {
				this._listeners.delete(listenerObj)
			})
		}
	}

	fire(data: T): void {
		if (this._disposed)
			return

		for (const { listener, thisArgs } of this._listeners) {
			try {
				listener.call(thisArgs, data)
			}
			catch (e) {
				console.error('Error in event listener:', e)
			}
		}
	}

	dispose(): void {
		this._disposed = true
		this._listeners.clear()
	}

}

export class Location implements vt.Location {

	readonly uri: vt.Uri
	readonly range: Range

	constructor(uri: vt.Uri, rangeOrPosition: Range | Position) {
		this.uri = uri
		this.range = rangeOrPosition instanceof Position
			? new Range(rangeOrPosition, rangeOrPosition)
			: rangeOrPosition
	}

}

export class Position implements vt.Position {

	readonly line: number
	readonly character: number

	constructor(line: number, character: number) {
		this.line = line
		this.character = character
	}

	// Helper methods for min/max operations
	static min(a: Position, b: Position): Position {
		return a.isBefore(b) ? a : b
	}

	static max(a: Position, b: Position): Position {
		return a.isAfter(b) ? a : b
	}

	isBefore(other: Position): boolean {
		return this.line < other.line || (this.line === other.line && this.character < other.character)
	}

	isBeforeOrEqual(other: Position): boolean {
		return this.line < other.line || (this.line === other.line && this.character <= other.character)
	}

	isAfter(other: Position): boolean {
		return this.line > other.line || (this.line === other.line && this.character > other.character)
	}

	isAfterOrEqual(other: Position): boolean {
		return this.line > other.line || (this.line === other.line && this.character >= other.character)
	}

	isEqual(other: Position): boolean {
		return this.line === other.line && this.character === other.character
	}

	compareTo(other: Position): number {
		if (this.line < other.line)
			return -1
		if (this.line > other.line)
			return 1
		if (this.character < other.character)
			return -1
		if (this.character > other.character)
			return 1
		return 0
	}

	translate(lineDeltaOrChange: number | { lineDelta?: number, characterDelta?: number } | undefined, characterDelta?: number): Position {
		if (typeof lineDeltaOrChange === 'number') {
			return new Position(this.line + lineDeltaOrChange, this.character + (characterDelta || 0))
		}
		if (lineDeltaOrChange && typeof lineDeltaOrChange === 'object') {
			return new Position(
				this.line + (lineDeltaOrChange.lineDelta || 0),
				this.character + (lineDeltaOrChange.characterDelta || 0),
			)
		}
		return new Position(this.line, this.character)
	}

	with(lineOrChange: number | { line?: number, character?: number } | undefined, character?: number): Position {
		if (typeof lineOrChange === 'number') {
			return new Position(lineOrChange, character !== undefined ? character : this.character)
		}
		if (lineOrChange && typeof lineOrChange === 'object') {
			return new Position(
				lineOrChange.line !== undefined ? lineOrChange.line : this.line,
				lineOrChange.character !== undefined ? lineOrChange.character : this.character,
			)
		}
		return new Position(this.line, this.character)
	}

}

export class Range implements vt.Range {

	static readonly START_TO_START = 0
	static readonly START_TO_END = 1
	static readonly END_TO_END = 2
	static readonly END_TO_START = 3

	readonly start: Position
	readonly end: Position

	constructor(
		startLine: number | Position,
		startCharacter: number | Position,
		endLine?: number,
		endCharacter?: number,
	) {
		if (startLine instanceof Position) {
			this.start = startLine
			if (startCharacter instanceof Position) {
				this.end = startCharacter
			}
			else {
				throw new TypeError('Invalid Range constructor arguments')
			}
		}
		else {
			this.start = new Position(startLine, startCharacter as number)
			this.end = new Position(endLine || startLine, endCharacter !== undefined ? endCharacter : startCharacter as number)
		}
	}

	get isEmpty(): boolean {
		return this.start.isEqual(this.end)
	}

	get isSingleLine(): boolean {
		return this.start.line === this.end.line
	}

	contains(positionOrRange: Position | Range): boolean {
		if (positionOrRange instanceof Position) {
			return this.start.isBeforeOrEqual(positionOrRange) && positionOrRange.isBeforeOrEqual(this.end)
		}
		return this.contains(positionOrRange.start) && this.contains(positionOrRange.end)
	}

	isEqual(other: Range): boolean {
		return this.start.isEqual(other.start) && this.end.isEqual(other.end)
	}

	intersection(other: Range): Range | undefined {
		// Find the later start position
		const start = Position.max(this.start, other.start)
		
		// Find the earlier end position
		let end: Position

		if (this.end.line < other.end.line) {
			end = this.end
		}
		else if (this.end.line > other.end.line) {
			end = other.end
		}
		else {
			// Same line, find the earlier character position
			end = this.end.character <= other.end.character ? this.end : other.end
		}

		// Check if the ranges actually overlap
		return start.isBeforeOrEqual(end) ? new Range(start, end) : undefined
	}

	union(other: Range): Range {
		// Find the earlier start position and later end position
		const start = Position.min(this.start, other.start)
		const end = Position.max(this.end, other.end)

		return new Range(start, end)
	}

	with(startOrChange?: Position | { start?: Position, end?: Position }, end?: Position): Range {
		if (startOrChange instanceof Position) {
			return new Range(startOrChange, end || this.end)
		}
		if (startOrChange && typeof startOrChange === 'object') {
			return new Range(
				startOrChange.start || this.start,
				startOrChange.end || this.end,
			)
		}
		return new Range(this.start, this.end)
	}

}

export class Selection extends Range implements vt.Selection {

	readonly anchor: Position
	readonly active: Position

	constructor(
		anchorLine: number | Position,
		anchorCharacter: number | Position,
		activeLine?: number,
		activeCharacter?: number,
	) {
		if (anchorLine instanceof Position) {
			super(anchorLine, anchorCharacter as Position)
			this.anchor = anchorLine
			this.active = anchorCharacter as Position
		}
		else {
			const anchor = new Position(anchorLine, anchorCharacter as number)
			const active = new Position(activeLine || anchorLine, activeCharacter !== undefined ? activeCharacter : anchorCharacter as number)

			super(anchor, active)
			this.anchor = anchor
			this.active = active
		}
	}

	get isReversed(): boolean {
		return this.anchor.isAfter(this.active)
	}

}

export class ThemeColor implements vt.ThemeColor {

	id: string

	constructor(id: string) {
		this.id = id
	}

}

export class ThemeIcon implements vt.ThemeIcon {

	static readonly File = new ThemeIcon('file')
	static readonly Folder = new ThemeIcon('folder')

	readonly id: string
	readonly color?: ThemeColor

	constructor(id: string, color?: ThemeColor) {
		this.id = id
		this.color = color
	}

}

export class TreeItem implements vt.TreeItem {

	label?: string | vt.TreeItemLabel
	id?: string
	iconPath?: string | vt.Uri | ThemeIcon | { light: vt.Uri, dark: vt.Uri } | undefined
	description?: string | boolean
	resourceUri?: vt.Uri
	tooltip?: string | vt.MarkdownString | undefined
	command?: vt.Command
	collapsibleState?: TreeItemCollapsibleState
	contextValue?: string
	accessibilityInformation?: vt.AccessibilityInformation

	constructor(
		labelOrUri: string | vt.TreeItemLabel | vt.Uri,
		collapsibleState?: TreeItemCollapsibleState,
	) {
		if (typeof labelOrUri === 'string') {
			this.label = labelOrUri
		}
		else if ('label' in labelOrUri) {
			this.label = labelOrUri
		}
		else {
			this.resourceUri = labelOrUri
		}
		this.collapsibleState = collapsibleState
	}

}

export class TextEdit implements vt.TextEdit {

	range: Range
	newText: string

	constructor(range: Range, newText: string) {
		this.range = range
		this.newText = newText
	}

	static replace(range: Range, newText: string): TextEdit {
		return new TextEdit(range, newText)
	}

	static insert(position: Position, newText: string): TextEdit {
		return new TextEdit(new Range(position, position), newText)
	}

	static delete(range: Range): TextEdit {
		return new TextEdit(range, '')
	}

	static setEndOfLine(_eol: EndOfLine): TextEdit {
		// This is a placeholder - actual implementation would be more complex
		return new TextEdit(new Range(new Position(0, 0), new Position(0, 0)), '')
	}

}

export class CancellationToken implements vt.CancellationToken {

	private _isCancellationRequested = false
	private _onCancellationRequestedEmitter = new EventEmitter<void>()

	get isCancellationRequested(): boolean {
		return this._isCancellationRequested
	}

	get onCancellationRequested(): vt.Event<void> {
		return this._onCancellationRequestedEmitter.event
	}

	_fireCancellation(): void {
		if (!this._isCancellationRequested) {
			this._isCancellationRequested = true
			this._onCancellationRequestedEmitter.fire()
		}
	}

	_disposeEmitter(): void {
		this._onCancellationRequestedEmitter.dispose()
	}

}

export class CancellationTokenSource implements vt.CancellationTokenSource {

	private _token: CancellationToken | undefined = new CancellationToken()

	get token(): vt.CancellationToken {
		if (!this._token) {
			throw new Error('CancellationTokenSource has been disposed')
		}
		return this._token
	}

	cancel(): void {
		if (this._token) {
			this._token._fireCancellation()
		}
	}

	dispose(): void {
		if (this._token) {
			this._token._disposeEmitter()
			this._token = undefined
		}
	}

}
