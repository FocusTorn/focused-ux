// Interfaces
export type { IConfigurationService } from './_interfaces/IConfigurationService.js'
export type { IEnv } from './_interfaces/IEnv.js'
export type { DirectoryEntry, FileStats, IFileSystem } from './_interfaces/IFileSystem.js'
export type { IFrontmatterUtilsService } from './_interfaces/IFrontmatterUtilsService.js'
export type { IProcess } from './_interfaces/IProcess.js'
export type { IStorageService } from './_interfaces/IStorageService.js'
export type { ICommonUtilsService, IPathUtilsService } from './_interfaces/IUtilServices.js'
export type { IUriFactory } from './_interfaces/IUriFactory.js'

export type {
	IWindow,
	IWorkspace,
	ICommands,
	IPosition,
	TreeItemCheckboxState,
	TreeItemCollapsibleState,
	Event,
	TreeItemLabel,
	IWindowCCP,
	IWorkspaceCCP,
	IWindowPB,
	ITerminal,
	ITerminalProvider,
	IFileSystemWatcher,
	IUri,
	IUriHandler,
	IRange,
	IDocumentSymbol,
	IEditBuilder,
	ITextEditor,
	ITextDocument,
	IWorkspaceConfig,
	ITreeItem,
	IThemeIcon,
	IThemeColor,
	IClipboard,
	IFileType,
	IRelativePattern,
	IExtensionContext,
	ProviderResult,
	IQuickPick,
	ICoreQuickPickItem,
	IContext,
	IPath,
	ITreeDataProvider,
	ITreeDragAndDropController,
	ITreeView,
	IWorkspaceFolder,
} from './_interfaces/IVSCode.js'

export type { SimpleEventEmitter, TreeItemFactory, Disposable } from './_interfaces/IVSCode.js'

// VSCode Adapters
export { WindowAdapter } from './vscode/adapters/Window.adapter.js'
export { WorkspaceAdapter } from './vscode/adapters/Workspace.adapter.js'
export { WorkspaceCCPAdapter } from './vscode/adapters/WorkspaceCCP.adapter.js'
export { CommandsAdapter } from './vscode/adapters/Commands.adapter.js'
export { PositionAdapter } from './vscode/adapters/Position.adapter.js'
export { ProcessAdapter } from './vscode/adapters/Process.adapter.js'
export { PathUtilsAdapter } from './vscode/adapters/PathUtils.adapter.js'
export { FileSystemAdapter } from './vscode/adapters/FileSystem.adapter.js'
export { CommonUtilsAdapter } from './vscode/adapters/CommonUtils.adapter.js'
export { TerminalAdapter } from './vscode/adapters/Terminal.adapter.js'
export { ExtensionContextAdapter, ExtensionAPIAdapter } from './vscode/adapters/Extension.adapter.js'
export { TreeItemFactoryAdapter, UriFactory } from './vscode/adapters/TreeItemFactory.adapter.js'
export { EventEmitterAdapter } from './vscode/adapters/EventEmitter.adapter.js'
export { ExtensionsAdapter } from './vscode/adapters/Extensions.adapter.js'
export { ProgressAdapter } from './vscode/adapters/Progress.adapter.js'
export { UriAdapter } from './vscode/adapters/Uri.adapter.js'
export { VSCodeUriFactory } from './vscode/adapters/VSCodeUriFactory.js'
export { RangeAdapter } from './vscode/adapters/Range.adapter.js'
export { DocumentSymbolAdapter } from './vscode/adapters/DocumentSymbol.adapter.js'
export { TextDocumentAdapter } from './vscode/adapters/TextDocument.adapter.js'
export { TextEditorAdapter, EditBuilderAdapter } from './vscode/adapters/TextEditor.adapter.js'
export { UriHandlerAdapter } from './vscode/adapters/UriHandler.adapter.js'
export { TreeItemAdapter, ThemeIconAdapter, ThemeColorAdapter } from './vscode/adapters/TreeItem.adapter.js'
export { TreeItemCollapsibleStateAdapter } from './vscode/adapters/TreeItemCollapsibleState.adapter.js'
export { EnvAdapter, ClipboardAdapter } from './vscode/adapters/Env.adapter.js'
export { FileTypeAdapter } from './vscode/adapters/FileType.adapter.js'
export { RelativePatternAdapter } from './vscode/adapters/RelativePattern.adapter.js'
export { QuickPickAdapter } from './vscode/adapters/QuickPick.adapter.js'
export { PathAdapter } from './vscode/adapters/Path.adapter.js'
export { ContextAdapter } from './vscode/adapters/Context.adapter.js'
export type { IWorkspaceUtilsService } from './_interfaces/IWorkspaceUtilsService.js'

// Services
export { ConfigurationService } from './services/Configuration.service.js'
export { StorageService } from './services/Storage.service.js'

// Utility functions
export { showTimedInformationMessage } from './utils/showTimedInformationMessage.js'
