//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type {
	Event,
	TreeItemLabel,
	TreeItemCheckboxState,
	TreeItemCollapsibleState,
	Disposable,
	ProgressLocation,
	MessageItem,
	MessageOptions,
	QuickPickItemKind,
	Uri,
	Range,
	DocumentSymbol,
	TextEditor,
	TextDocument,
	UriHandler,
	TreeItem,
	ThemeIcon,
	ThemeColor,
	FileType,
	Extension,
	MarkdownString,
	TreeDataProvider,
	TreeDragAndDropController,
	TreeView,
} from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

//= POSITION INTERFACE ===========================================================================
export interface IPosition {
	create: (line: number, character: number) => any
}

//= COMMANDS INTERFACE ===========================================================================
export interface ICommands {
	registerCommand: (command: string, callback: (...args: any[]) => any) => any
	executeCommand: <T>(command: string, ...args: any[]) => Promise<T>
}

//= WINDOW INTERFACE ===========================================================================
export interface IWindow {
	activeTextEditor?: any
	showErrorMessage: (message: string) => void
	withProgress: <T>(
		options: { title: string, cancellable: boolean },
		task: (progress: { report: (value: { message: string }) => void }) => Promise<T>,
	) => Promise<T>
	showInformationMessage: (message: string, ...items: string[]) => Promise<string | undefined>
	showWarningMessage: (message: string, options?: any, ...items: string[]) => Promise<string | undefined>
	showInputBox: (options?: any) => Promise<string | undefined>
	showTextDocument: (doc: any) => Promise<any>
	createTreeView: (viewId: string, options: any) => any
	registerTreeDataProvider: (viewId: string, provider: any) => any
	setStatusBarMessage: (message: string, timeout?: number) => void
	registerUriHandler: (handler: any) => any
	showTimedInformationMessage: (message: string, duration?: number) => Promise<void>
}

//= WORKSPACE INTERFACE ===========================================================================
export interface IWorkspace {
	getConfiguration: (section: string) => any
	get fs(): any
	get workspaceFolders(): any
	onDidChangeConfiguration: (listener: any) => any
	createFileSystemWatcher: (pattern: string | IRelativePattern) => any
	openTextDocument: (uri: any) => Promise<ITextDocument>
}

//= PROCESS INTERFACE ===========================================================================
export interface IProcess {
	get workspaceRoot(): string | undefined
}

//= PATH UTILS INTERFACE ===========================================================================
export interface IPathUtils {
	sanitizePath: (path: string) => string
}

export interface IPath { //>
	join: (...paths: string[]) => string
	basename: (path: string) => string
	parse: (path: string) => { name: string, ext: string }
	dirname: (path: string) => string
	relative: (from: string, to: string) => string
} //<

//= FILE SYSTEM INTERFACE ===========================================================================
export interface IFileSystem {
	readFile: (uri: any) => Promise<Uint8Array>
	writeFile: (uri: any, content: Uint8Array) => Promise<void>
	delete: (uri: any) => Promise<void>
	rename: (source: any, target: any) => Promise<void>
	stat: (uri: any) => Promise<any>
	readDirectory: (uri: any) => Promise<[string, any][]>
	createDirectory: (uri: any) => Promise<void>
}

//= COMMON UTILS INTERFACE ===========================================================================
export interface ICommonUtils {
	showTimedInformationMessage: (message: string, durationMs: number) => Promise<void>
}

//= TREE DATA PROVIDER INTERFACES ===========================================================================
export interface ITreeDataProvider<T> {
	onDidChangeTreeData: Event<T | undefined | null | void>
	getTreeItem: (element: T) => ITreeItem
	getChildren: (element?: T) => Promise<T[]>
}

export interface ITreeDragAndDropController<T> {
	onDidChangeTreeData: Event<T | undefined | null | void>
	getTreeItem: (element: T) => ITreeItem
	getChildren: (element?: T) => Promise<T[]>
}

export interface ITreeView<T> {
	onDidChangeSelection: Event<T[]>
	onDidChangeVisibility: Event<boolean>
	visible: boolean
	selection: T[]
	reveal: (element: T, options?: any) => Promise<void>
	dispose: () => void
}

//= CCP SPECIFIC INTERFACES ===========================================================================
export interface IFileSystemWatcher {
	onDidChange: (listener: () => void) => { dispose: () => void }
	onDidCreate: (listener: () => void) => { dispose: () => void }
	onDidDelete: (listener: () => void) => { dispose: () => void }
	dispose: () => void
}

export interface IWorkspaceCCP {
	workspaceFolders: { uri: string, name: string }[] | undefined
	asRelativePath: (pathOrUri: string, includeWorkspaceFolder?: boolean) => string
	get: (section: string, key: string) => any
	onDidChangeConfiguration: (listener: () => void) => { dispose: () => void }
	createFileSystemWatcher: (globPattern: string) => IFileSystemWatcher
}

export interface IWindowCCP {
	showInformationMessage: (message: string) => void
	showWarningMessage: (message: string, modal: boolean, ...items: string[]) => Promise<string | undefined>
	showErrorMessage: (message: string) => void
	showInputBox: (options: { prompt: string }) => Promise<string | undefined>
	setClipboard: (text: string) => Promise<void>
	setStatusBarMessage: (message: string, durationInMs?: number) => void
	showDropdownMessage: (message: string, durationInMs?: number) => void
	showDescriptionMessage: (message: string, durationInMs?: number) => void
	showTimedInformationMessage: (message: string, duration?: number) => Promise<void>
}

//= PB SPECIFIC INTERFACES ===========================================================================
export interface IWindowPB {
	activeTextEditorUri: string | undefined
	showErrorMessage: (message: string) => void
	showInformationMessage: (message: string, modal?: boolean, ...items: string[]) => Promise<string | undefined>
	showWarningMessage: (message: string) => void
	withProgress: <T>(
		options: { title: string, cancellable: boolean },
		task: (progress: { report: (value: { message: string }) => void }) => Promise<T>,
	) => Promise<T>
	showTimedInformationMessage: (message: string, duration?: number) => void
}

export interface ITerminal {
	sendText: (text: string) => void
	show: () => void
}

export interface ITerminalProvider {
	activeTerminal: ITerminal | undefined
	createTerminal: (name: string) => ITerminal
}

//= FACTORY INTERFACES ===========================================================================
export interface TreeItemFactory {
	create: (
		label: string | TreeItemLabel,
		collapsibleState: TreeItemCollapsibleState,
		checkboxState?: TreeItemCheckboxState,
	) => any
}

export interface SimpleEventEmitter<T = any> {
	event: Event<T>
	fire: (data: T) => void
	dispose: () => void
}

//= EXTENSION INTERFACES ===========================================================================
export interface IExtensionContext {
	subscriptions: any[]
}

export type ProviderResult<T> = T | undefined | null | Thenable<T | undefined | null>

export interface IExtensionAPI {
	registerTreeDataProvider: (provider: any) => any
	registerWebviewViewProvider: (id: string, provider: any) => any
	registerCommand: (command: string, callback: (...args: any[]) => any) => any
	createTreeView: (id: string, options: any) => any
	executeCommand: (command: string, ...args: any[]) => Promise<any>
}

//= EXTENSIONS INTERFACE ===========================================================================
export interface IExtension {
	id: string
}

export interface IExtensions {
	all: readonly IExtension[]
}

//= PROGRESS INTERFACE ===========================================================================
export interface IProgress {
	report: (value: { message: string }) => void
}

export interface IProgressOptions {
	location: ProgressLocation
	title: string
	cancellable: boolean
}

//= AI AGENT INTERACTOR INTERFACES ===========================================================================
export interface IUri {
	path: string
	query: string
	fsPath: string
	toString: () => string
}

export interface IUriHandler {
	handleUri: (uri: IUri) => Promise<void>
}

export interface IRange {
	start: IPosition
	end: IPosition
}

export interface IDocumentSymbol {
	name: string
	range: IRange
	children?: IDocumentSymbol[]
}

export interface IEditBuilder {
	replace: (range: IRange, text: string) => void
}

export interface ITextEditor {
	edit: (editFunction: (editBuilder: IEditBuilder) => void) => Promise<boolean>
}

export interface ITextDocument {
	uri: IUri
	getText: () => string
	positionAt: (offset: number) => IPosition
	save: () => Promise<void>
}

export interface IWorkspaceConfig {
	get: (section: string, key: string) => any
}

//= NOTE HUB INTERFACES ===========================================================================
export interface ITreeItem {
	label: string | TreeItemLabel | undefined
	resourceUri?: IUri
	description?: string | boolean
	tooltip?: string | MarkdownString
	contextValue?: string
	iconPath?: IThemeIcon
	collapsibleState: TreeItemCollapsibleState | undefined
}

export interface IThemeIcon {
	readonly id: string
	readonly color?: IThemeColor
}

export interface IThemeColor {
	readonly id: string
}

export interface IClipboard {
	readText: () => Promise<string>
	writeText: (text: string) => Promise<void>
}

export interface IEnv {
	readonly clipboard: IClipboard
}

export interface IFileType {
	Unknown: number
	File: number
	Directory: number
	SymbolicLink: number
}

export interface IRelativePattern {
	pattern: string
	base: string
}

//= DYNAMICONS INTERFACES ===========================================================================
export interface IQuickPick {
	showQuickPickSingle: <T extends Record<string, any>, K extends keyof T>(
		items: T[],
		options: {
			placeHolder?: string
			matchOnDescription?: boolean
			matchOnDetail?: boolean
		},
		propertyKey: K,
	) => Promise<T[K] | undefined>
}

export interface ICoreQuickPickItem {
	label: string
	description?: string
	iconPath?: string
	iconNameInDefinitions: string
}

export interface IContext {
	extensionPath: string
}

//= EVENT EMITTER INTERFACE ===========================================================================
export interface IEventEmitter<T = any> {
	event: Event<T>
	fire: (data: T) => void
	dispose: () => void
}

//= VSCODE TYPES EXPORT ===========================================================================
export type {
	Event,
	TreeItemLabel,
	TreeItemCheckboxState,
	TreeItemCollapsibleState,
	Disposable,
	ProgressLocation,
	MessageItem,
	MessageOptions,
	QuickPickItemKind,
	Uri,
	Range,
	DocumentSymbol,
	TextEditor,
	TextDocument,
	UriHandler,
	TreeItem,
	ThemeIcon,
	ThemeColor,
	FileType,
	Extension,
	MarkdownString,
	TreeDataProvider,
	TreeDragAndDropController,
	TreeView,
}
