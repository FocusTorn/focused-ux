// ESLint & Imports -->>

// _UTILITIES ==================================================================================================
import type {
	IWindow,
	IWorkspace,
	ICommands,
	ICommonUtilsService,
	IFrontmatterUtilsService,
	IPathUtilsService,
	IFileType,
	Event,
	IFileSystemWatcher,
	ProviderResult,
} from '@fux/shared'
import {
	EventEmitterAdapter,
	ThemeIconAdapter,
	UriAdapter,
	RelativePatternAdapter,
	TreeItemAdapter,
} from '@fux/shared'
import { basename, dirname, extname, join, normalize } from 'node:path'
import { constants as fsConstants } from 'node:fs'
import { Buffer } from 'node:buffer'
import { access as fspAccess } from 'node:fs/promises'
import type { ExtensionContext, Uri, TreeItem } from 'vscode'
import { TreeItemCollapsibleState } from 'vscode'
import type { INotesHubDataProvider } from '../_interfaces/INotesHubDataProvider.js'
import { NotesHubItem } from '../models/NotesHubItem.js'
// import type { ICommonUtilsService, IFrontmatterUtilsService, IPathUtilsService, IWindow, IWorkspace, ICommands } from '@fux/_utilities' (update to actual path)

//--------------------------------------------------------------------------------------------------------------<<

const DEFAULT_ROOT_ICON = 'folder'
const PROJECT_ROOT_ICON = 'project'
const REMOTE_ROOT_ICON = 'remote-explorer'
const GLOBAL_ROOT_ICON = 'globe'
const DEFAULT_FOLDER_ICON = 'folder'

const ALLOWED_EXTENSIONS = ['.md', '.txt', '.txte']

export abstract class BaseNotesDataProvider implements INotesHubDataProvider {

	private _onDidChangeTreeData: EventEmitterAdapter<NotesHubItem | undefined | null | void> = new EventEmitterAdapter()
	readonly onDidChangeTreeData: Event<NotesHubItem | undefined | null | void> = this._onDidChangeTreeData.event

	private fileWatcher: IFileSystemWatcher

	// TreeDragAndDropController properties
	readonly dropMimeTypes: string[] = ['application/vnd.code.tree.notesHub']
	readonly dragMimeTypes: string[] = ['application/vnd.code.tree.notesHub']

	// Awilix-ready constructor (no decorators)
	constructor(
		public readonly notesDir: string,
		public readonly providerName: 'project' | 'remote' | 'global',
		private readonly openNoteCommandId: string,
		protected readonly iContext: ExtensionContext,
		protected readonly iWindow: IWindow,
		protected readonly iWorkspace: IWorkspace,
		protected readonly iCommands: ICommands,
		protected readonly iCommonUtils: ICommonUtilsService,
		protected readonly iFrontmatterUtils: IFrontmatterUtilsService,
		protected readonly iPathUtils: IPathUtilsService,
		protected readonly iFileTypeEnum: IFileType,
	) {
		// Guard: invalid notesDir makes provider inert
		if (!this.notesDir || typeof this.notesDir !== 'string' || this.notesDir.trim() === '') {
			console.error(`[BaseNotesDataProvider] Invalid notesDir provided for provider '${this.providerName}'. Provider will be inert.`)
			// Do not register watchers; leave provider inert
			this.fileWatcher = {
				onDidChange: () => ({ dispose() {} } as any),
				onDidCreate: () => ({ dispose() {} } as any),
				onDidDelete: () => ({ dispose() {} } as any),
				dispose: () => {},
			} as unknown as IFileSystemWatcher
			return
		}

		if (this.providerName === 'project' && this.notesDir.includes('.fux_note-hub')) {
			this.addDirToGitignore('.fux_note-hub')
		}

		this.fileWatcher = this.iWorkspace.createFileSystemWatcher(
			RelativePatternAdapter.create(this.notesDir, '**/*'),
		)
		this.fileWatcher.onDidChange(() => this.refresh())
		this.fileWatcher.onDidCreate(() => this.refresh())
		this.fileWatcher.onDidDelete(() => this.refresh())
		this.iContext.subscriptions.push(this.fileWatcher)
	}

	private treeViewRegistered = false

	public initializeTreeView(viewId: string): void {
		if (!this.notesDir) {
			return
		}
		// Prevent duplicate registrations
		if (this.treeViewRegistered) {
			console.warn(`[NotesHub] Tree view ${viewId} is already registered, skipping.`)
			return
		}
		
		// We use registerTreeDataProvider because the view is already declared in package.json.
		// Using createTreeView would attempt to register it a second time, causing an error.
		// I am assuming iWindow, which is an adapter for vscode.window, has this method.
		const disposable = this.iWindow.registerTreeDataProvider(viewId, this)
		
		this.iContext.subscriptions.push(disposable)
		this.treeViewRegistered = true
	}

	public refresh(): void {
		if (!this.notesDir) {
			return
		}
		this._onDidChangeTreeData.fire(undefined)
	}

	public dispose(): void {
		this._onDidChangeTreeData.dispose()
		this.fileWatcher.dispose()
	}
	      
	public getParent(element: NotesHubItem): ProviderResult<NotesHubItem> { //>
		if (!this.notesDir) {
			return undefined
		}
		// If there is no parent URI, this is a top-level/root item
		if (!element.parentUri) {
			return undefined
		}

		const rootPath = this.notesDir ? this.iPathUtils.sanitizePath(this.notesDir) : ''
		const parentPathRaw = element.parentUri?.fsPath || ''
		const parentPath = parentPathRaw ? this.iPathUtils.sanitizePath(parentPathRaw) : ''

		// Validate paths before processing
		if (!parentPath || parentPath.trim() === '') {
			console.warn('[BaseNotesDataProvider] Invalid parent path in getParent:', { parentPathRaw, parentPath })
			return undefined
		}

		// Parent is the provider root
		if (parentPath === rootPath) {
			return new NotesHubItem(basename(this.notesDir), this.notesDir, true)
		}

		// Construct the parent item synchronously without I/O
		const parentName = parentPath ? basename(parentPath) : ''
		const parentParentPath = parentPath ? dirname(parentPath) : ''
		
		// Validate parentParentPath before creating URI
		if (!parentParentPath || parentParentPath.trim() === '' || parentParentPath === parentPath) {
			return new NotesHubItem(parentName, parentPath, true)
		}

		try {
			const parentParentUri = (UriAdapter.file(parentParentPath) as any).uri

			return new NotesHubItem(parentName, parentPath, true, parentParentUri)
		}
		catch (error) {
			console.warn('[BaseNotesDataProvider] Error creating parent URI:', { parentParentPath, error })
			return new NotesHubItem(parentName, parentPath, true)
		}
	}//<

	public async getTreeItem(element: NotesHubItem): Promise<TreeItem> {
		if (!this.notesDir) {
			// Return inert TreeItem without constructing NotesHubItem (which requires a valid filePath)
			const treeItem = TreeItemAdapter.create('Notes (disabled)', TreeItemCollapsibleState.None)

			return treeItem as any
		}
		try {
			if (element.isDirectory) {
				// If it's a root item (no parent), start it as expanded. Otherwise, collapsed.
				element.collapsibleState = !element.parentUri
					? TreeItemCollapsibleState.Expanded
					: TreeItemCollapsibleState.Collapsed
			}
			else {
				element.collapsibleState = TreeItemCollapsibleState.None
			}

			if (element.isDirectory) {
				if (!element.parentUri) { // This is a root folder for this provider
					switch (this.providerName) {
						case 'project':
							element.iconPath = ThemeIconAdapter.create(PROJECT_ROOT_ICON)
							break
						case 'remote':
							element.iconPath = ThemeIconAdapter.create(REMOTE_ROOT_ICON)
							break
						case 'global':
							element.iconPath = ThemeIconAdapter.create(GLOBAL_ROOT_ICON)
							break
						default:
							element.iconPath = ThemeIconAdapter.create(DEFAULT_ROOT_ICON)
					}
				}
				else {
					element.iconPath = ThemeIconAdapter.create(DEFAULT_FOLDER_ICON)
				}
			}

			// Return a VS Code TreeItem object rather than our adapter wrapper to avoid serialization issues
			// in VS Code internals when it expects a raw TreeItem
			const raw = (element as unknown as { toVsCode?: () => any })?.toVsCode?.()

			return (raw ?? element) as any
		}
		catch (error) {
			// Ensure the error has proper properties for VSCode's error handling
			const errorMessage = error instanceof Error ? error.message : String(error)
			const errorStack = error instanceof Error ? error.stack : undefined
			
			console.error(`[BaseNotesDataProvider] Error in getTreeItem for element: ${element?.filePath || 'unknown'}`, {
				message: errorMessage,
				stack: errorStack,
				error,
			})
			
			// Return a basic tree item to prevent the tree view from breaking
			const fallbackItem = new NotesHubItem('Error', element?.filePath || 'unknown', false)

			fallbackItem.collapsibleState = TreeItemCollapsibleState.None
			return fallbackItem as any
		}
	}

	public async getChildren(element?: NotesHubItem): Promise<NotesHubItem[]> {
		if (!this.notesDir) {
			return []
		}
		try {
			const dirPath = element?.filePath || this.notesDir

			// Validate dirPath before processing
			if (!dirPath || dirPath.trim() === '') {
				console.warn('[BaseNotesDataProvider] Invalid directory path in getChildren:', { dirPath, element: element?.filePath })
				return []
			}

			if (!element) { // Root level for this provider
				const rootFolderItem = new NotesHubItem(basename(this.notesDir), this.notesDir, true)

				return [rootFolderItem]
			}

			if (element.isDirectory && element.resourceUri) {
				const entries = await this.iWorkspace.fs.readDirectory(element.resourceUri)
				const items: NotesHubItem[] = []

				for (const [name, fileType] of entries) {
					// Validate name before processing
					if (!name || name.trim() === '') {
						console.warn('[BaseNotesDataProvider] Invalid file name in directory:', { name, dirPath })
						continue
					}

					const filePath = join(dirPath, name)
					const isDir = (fileType & this.iFileTypeEnum.Directory) > 0

					if (isDir || this.isExtensionValid(filePath)) {
						let frontmatter: { [key: string]: string } | undefined
						
						// Only try to get frontmatter for files, not directories
						if (!isDir) {
							try {
								frontmatter = await this.iFrontmatterUtils.getFrontmatter(filePath)
							}
							catch (frontmatterError) {
								// Log the error but don't let it break the tree view
								console.warn(`[BaseNotesDataProvider] Failed to get frontmatter for ${filePath}:`, frontmatterError)
								frontmatter = undefined
							}
						}
						
						try {
							const item = new NotesHubItem(name, filePath, isDir, element.resourceUri, frontmatter)

							items.push(item)
						}
						catch (itemError) {
							console.warn(`[BaseNotesDataProvider] Failed to create NotesHubItem for ${filePath}:`, itemError)
							continue
						}
					}
				}
				return items.sort(this.sortItems)
			}
			return []
		}
		catch (error) {
			// Ensure the error has proper properties for VSCode's error handling
			const errorMessage = error instanceof Error ? error.message : String(error)
			const errorStack = error instanceof Error ? error.stack : undefined
			
			console.error(`[BaseNotesDataProvider] Error reading directory: ${element?.filePath || this.notesDir}`, {
				message: errorMessage,
				stack: errorStack,
				error,
			})
			
			this.iCommonUtils.errMsg(`Error reading directory: ${element?.filePath || this.notesDir}`, error)
			return []
		}
	}

	public async getNotesHubItem(uri: Uri): Promise<NotesHubItem | undefined> {
		if (!this.notesDir) {
			return undefined
		}
		try {
			const filePath = uri.fsPath
			
			// Validate filePath before processing
			if (!filePath || filePath.trim() === '') {
				console.warn('[BaseNotesDataProvider] Invalid filePath in getNotesHubItem:', { filePath, uri: uri.toString() })
				return undefined
			}

			const stats = await this.iWorkspace.fs.stat(uri)
			const isDirectory = (stats.type & this.iFileTypeEnum.Directory) > 0
			const fileName = basename(filePath)
			const parentPath = dirname(filePath)
			
			// Validate parentPath before creating URI
			let parentUri: Uri | undefined

			if (parentPath !== filePath && parentPath.trim() !== '') {
				try {
					parentUri = (UriAdapter.file(parentPath) as any).uri
				}
				catch (uriError) {
					console.warn('[BaseNotesDataProvider] Error creating parent URI:', { parentPath, uriError })
					parentUri = undefined
				}
			}

			let frontmatter: { [key: string]: string } | undefined

			if (!isDirectory && this.isExtensionValid(filePath)) {
				try {
					frontmatter = await this.iFrontmatterUtils.getFrontmatter(filePath)
				}
				catch (frontmatterError) {
					// Log the error but don't let it break the tree view
					console.warn(`[BaseNotesDataProvider] Failed to get frontmatter for ${filePath}:`, frontmatterError)
					frontmatter = undefined
				}
			}
			
			try {
				return new NotesHubItem(fileName, filePath, isDirectory, parentUri, frontmatter)
			}
			catch (itemError) {
				console.warn('[BaseNotesDataProvider] Error creating NotesHubItem:', { fileName, filePath, itemError })
				return undefined
			}
		}
		catch (error) {
			// Ensure the error has proper properties for VSCode's error handling
			const errorMessage = error instanceof Error ? error.message : String(error)
			const errorStack = error instanceof Error ? error.stack : undefined
			
			console.error(`[BaseNotesDataProvider] Error creating NotesHubItem for URI: ${uri.fsPath}`, {
				message: errorMessage,
				stack: errorStack,
				error,
			})
			
			this.iCommonUtils.errMsg(`Error creating NotesHubItem for URI: ${uri.fsPath}`, error)
			return undefined
		}
	}

	private sortItems(a: NotesHubItem, b: NotesHubItem): number { //>
		const aIsDir = a.isDirectory ? 0 : 1
		const bIsDir = b.isDirectory ? 0 : 1
		const aLabel = typeof a.label === 'string' ? a.label : a.label?.label || ''
		const bLabel = typeof b.label === 'string' ? b.label : b.label?.label || ''

		return aIsDir - bIsDir || aLabel.localeCompare(bLabel)
	} //<

	private isExtensionValid(filePath: string): boolean { //>
		return ALLOWED_EXTENSIONS.includes(extname(filePath).toLowerCase())
	} //<

	private async fileExists(filePath: string): Promise<boolean> { //>
		try {
			if (!filePath) {
				return false
			}
			
			const sanitizedPath = this.iPathUtils.sanitizePath(filePath)

			if (!sanitizedPath) {
				return false
			}
			
			await fspAccess(sanitizedPath, fsConstants.F_OK)
			return true
		}
		catch {
			return false
		}
	} //<

	private async confirmOverwrite(itemName: string): Promise<boolean> { //>
		const message = `'${itemName}' already exists. Overwrite?`
		const result = await this.iWindow.showInformationMessage(message, 'Overwrite', 'Cancel')

		return result === 'Overwrite'
	} //<

	private async addDirToGitignore(dirToIgnore: string): Promise<void> { //>
		if (!this.notesDir) {
			return
		}

		const workspaceFolder = this.iWorkspace.workspaceFolders?.[0]

		if (!workspaceFolder) {
			return
		}

		// Convert the VSCode URI to an IUri object before using UriAdapter.joinPath
		const workspaceUri = UriAdapter.create(workspaceFolder.uri)
		const gitignoreUriAdapter = UriAdapter.joinPath(workspaceUri, '.gitignore')
		// Access the underlying VSCode URI for the workspace fs API
		const gitignoreUri = (gitignoreUriAdapter as any).uri

		try {
			let gitignoreContent = ''

			try {
				const rawContent = await this.iWorkspace.fs.readFile(gitignoreUri)

				gitignoreContent = Buffer.from(rawContent).toString('utf-8')
			}
			catch (error) {
				const fsError = error as NodeJS.ErrnoException

				if (fsError.code !== 'ENOENT' && fsError.code !== 'FileNotFound') {
					this.iCommonUtils.errMsg(`Error reading .gitignore: ${gitignoreUri.fsPath}`, fsError)
				}
			}

			const lineToSearch = `/${dirToIgnore}/`

			if (!gitignoreContent.includes(lineToSearch)) {
				const newEntry = `${gitignoreContent.length > 0 ? '\n' : ''}# Ignored by F-UX Notes Hub\n${lineToSearch}\n`
				const fullContent = gitignoreContent + newEntry

				await this.iWorkspace.fs.writeFile(gitignoreUri, Buffer.from(fullContent, 'utf-8'))
			}
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to update .gitignore for ${dirToIgnore}`, error)
		}
	} //<

	protected sanitizePath(uncleanPath: string): string { //>
		if (!uncleanPath) {
			return ''
		}
		
		const normalPath = normalize(uncleanPath)

		if (!normalPath) {
			return uncleanPath
		}

		// Ensure normalPath is a string before calling replace
		return String(normalPath).replace(/\\/g, '/')
	} //<

}
