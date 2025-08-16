import type { TextEditor, TextDocument, Uri, ProgressOptions, Progress, InputBoxOptions, QuickPickOptions, QuickPickItem, TreeView, TreeDataProvider, Terminal } from 'vscode'
import { MockTextEditor } from './MockTextEditor.js'
import { MockTextDocument } from './MockTextDocument.js'

// Mock Terminal class for testing

class MockTerminal implements Terminal {

	name: string
	processId: Promise<number | undefined>
	creationOptions: any
	exitStatus: any
	state: any
	shellIntegration: any

	constructor(name: string) {
		this.name = name
		this.processId = Promise.resolve(1)
		this.creationOptions = {}
		this.exitStatus = undefined
		this.state = 1 // TerminalState.Running
		this.shellIntegration = undefined
	}

	sendText(_text: string, _addNewLine?: boolean): void {
		// Mock implementation - do nothing but don't throw
	}

	show(_preserveFocus?: boolean): void {
		// Mock implementation - do nothing but don't throw
	}

	hide(): void {
		// Mock implementation - do nothing but don't throw
	}

	dispose(): void {
		// Mock implementation - do nothing but don't throw
	}

}

export class MockWindow {

	private _activeTextEditor?: TextEditor
	private _visibleTextEditors: TextEditor[] = []
	private _textEditors: TextEditor[] = []
	private _treeViews = new Map<string, TreeView<any>>()
	private _treeDataProviders = new Map<string, TreeDataProvider<any>>()
	private _activeTerminal?: Terminal
	private _terminals: Terminal[] = []
	private _utils: any

	constructor(utils?: any) {
		this._utils = utils || console
	}

	// Enhanced window API with proper editor tracking
	get activeTextEditor(): TextEditor | undefined {
		return this._activeTextEditor
	}

	get activeTextEditorUri(): string | undefined {
		return this._activeTextEditor?.document.uri.fsPath
	}

	get visibleTextEditors(): TextEditor[] {
		return [...this._visibleTextEditors]
	}

	get textEditors(): TextEditor[] {
		return [...this._textEditors]
	}

	// Terminal API methods
	get activeTerminal(): Terminal | undefined {
		return this._activeTerminal
	}

	createTerminal(name: string): Terminal {
		const terminal = new MockTerminal(name)

		this._terminals.push(terminal)
		this._activeTerminal = terminal
		
		// Safely call debug if it exists
		if (this._utils && typeof this._utils.debug === 'function') {
			this._utils.debug(`Created terminal: ${name}`)
		}

		return terminal
	}

	async showTextDocument(document: TextDocument | Uri, _column?: number): Promise<TextEditor> {
		let doc: TextDocument
		let uri: Uri

		if ('uri' in document) {
			// document is TextDocument
			doc = document
			uri = document.uri
		}
		else {
			// document is Uri
			uri = document
			// Create a mock document if we don't have one
			doc = new MockTextDocument(uri)
		}

		// Check if we already have an editor for this document
		let editor = this._textEditors.find(e => e.document.uri.toString() === uri.toString())
		
		if (!editor) {
			// Create new editor
			editor = new MockTextEditor(doc)
			this._textEditors.push(editor)
		}

		// Make it active and visible
		this._activeTextEditor = editor
		if (!this._visibleTextEditors.includes(editor)) {
			this._visibleTextEditors.push(editor)
		}

		// Safely call debug if it exists
		if (this._utils && typeof this._utils.debug === 'function') {
			this._utils.debug(`Show text document: ${uri.fsPath}`)
		}
		return editor
	}

	async showErrorMessage(message: string, ...items: string[]): Promise<string | undefined> {
		this._utils.error(`Window Error: ${message}`)
		return items[0]
	}

	async showWarningMessage(message: string, options?: { modal?: boolean }, ...items: any[]): Promise<any> {
		this._utils.warn(`Window Warning: ${message}`)
		return items[0]
	}

	async showInformationMessage(message: string, ...items: string[]): Promise<string | undefined> {
		this._utils.info(`Window Info: ${message}`)
		return items[0]
	}

	async showInputBox(options?: InputBoxOptions): Promise<string | undefined> {
		this._utils.info(`Input Box: ${options?.prompt || 'Enter value'}`)
		return options?.value || ''
	}

	async showQuickPick<T extends QuickPickItem>(items: readonly T[] | readonly string[], options?: QuickPickOptions): Promise<T | string | undefined> {
		this._utils.info(`Quick Pick: ${options?.placeHolder || 'Select item'}`)
		return Array.isArray(items) && items.length > 0 ? items[0] : undefined
	}

	createTreeView<T>(viewId: string, _options: any): TreeView<T> {
		const treeView: TreeView<T> = {
			onDidChangeSelection: (_listener: any) => ({ dispose: () => {} }),
			onDidChangeVisibility: (_listener: any) => ({ dispose: () => {} }),
			onDidExpandElement: (_listener: any) => ({ dispose: () => {} }),
			onDidCollapseElement: (_listener: any) => ({ dispose: () => {} }),
			onDidChangeCheckboxState: (_listener: any) => ({ dispose: () => {} }),
			visible: true,
			selection: [],
			reveal: async () => {},
			dispose: () => {
				this._treeViews.delete(viewId)
			},
		}

		this._treeViews.set(viewId, treeView)
		return treeView
	}

	registerTreeDataProvider<T>(viewId: string, provider: TreeDataProvider<T>): any {
		this._treeDataProviders.set(viewId, provider)
		
		return {
			dispose: () => {
				this._treeDataProviders.delete(viewId)
			},
		}
	}

	async withProgress<R>(
		options: ProgressOptions,
		task: (progress: Progress<{ message?: string, increment?: number }>) => Promise<R>,
	): Promise<R> {
		this._utils.info(`Progress: ${options.title || 'Processing...'}`)
		
		const progress: Progress<{ message?: string, increment?: number }> = {
			report: (value) => {
				if (value.message) {
					this._utils.debug(`Progress: ${value.message}`)
				}
			},
		}

		return await task(progress)
	}

	setStatusBarMessage(message: string, timeout?: number): any {
		this._utils.info(`Status Bar: ${message}`)
		
		const disposable = {
			dispose: () => {
				this._utils.debug(`Status Bar disposed: ${message}`)
			},
		}

		if (timeout) {
			setTimeout(() => disposable.dispose(), timeout)
		}

		return disposable
	}

	// Enhanced methods for testing
	setActiveTextEditor(editor: TextEditor | undefined): void {
		this._activeTextEditor = editor
		
		// Debug logging
		if (this._utils && typeof this._utils.info === 'function') {
			this._utils.info(`MockWindow.setActiveTextEditor() called with: ${editor ? editor.document.uri.fsPath : 'undefined'}`)
		}
	}

	addTextEditor(editor: TextEditor): void {
		if (!this._textEditors.includes(editor)) {
			this._textEditors.push(editor)
		}
	}

	removeTextEditor(editor: TextEditor): void {
		const index = this._textEditors.indexOf(editor)

		if (index > -1) {
			this._textEditors.splice(index, 1)
		}

		const visibleIndex = this._visibleTextEditors.indexOf(editor)

		if (visibleIndex > -1) {
			this._visibleTextEditors.splice(visibleIndex, 1)
		}

		if (this._activeTextEditor === editor) {
			this._activeTextEditor = this._textEditors[0] || undefined
		}
	}

	// Mock clipboard operations
	async writeText(text: string): Promise<void> {
		// In a real implementation, this would write to clipboard
		this._utils.debug(`Clipboard write: ${text}`)
	}

	async readText(): Promise<string> {
		// In a real implementation, this would read from clipboard
		return ''
	}

	// Utility methods for testing
	getEditorForDocument(uri: Uri): TextEditor | undefined {
		return this._textEditors.find(e => e.document.uri.toString() === uri.toString())
	}

	getEditorForDocumentPath(filePath: string): TextEditor | undefined {
		return this._textEditors.find(e => e.document.uri.fsPath === filePath)
	}

	// Mock command execution
	async executeCommand<T>(command: string, ..._args: any[]): Promise<T> {
		this._utils.debug(`Execute command: ${command}`)
		return undefined as T
	}

	// Debug methods for testing
	printEditorState(): void {
		console.log('Mock Window Editor State:')
		console.log(`  Active Editor: ${this._activeTextEditor?.document.uri.fsPath || 'none'}`)
		console.log(`  Visible Editors: ${this._visibleTextEditors.length}`)
		console.log(`  Total Editors: ${this._textEditors.length}`)
		
		for (const editor of this._textEditors) {
			console.log(`    - ${editor.document.uri.fsPath} (active: ${editor === this._activeTextEditor})`)
		}
	}

	clear(): void {
		this._activeTextEditor = undefined
		this._visibleTextEditors = []
		this._textEditors = []
		this._treeViews.clear()
		this._treeDataProviders.clear()
		this._activeTerminal = undefined
		this._terminals = []
		
		// Debug logging
		if (this._utils && typeof this._utils.info === 'function') {
			this._utils.info('MockWindow.clear() called - activeTextEditor cleared')
		}
	}

}
