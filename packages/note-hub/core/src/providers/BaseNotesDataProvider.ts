// ESLint & Imports -->>

// _UTILITIES ==================================================================================================
import type {
	IWindow,
	IWorkspace,
	ICommands,
	ICommonUtilsService,
	IFrontmatterUtilsService,
	IPathUtilsService,
	IUri,
	ITreeItem,
	IFileType,
	Event,
	IExtensionContext,
	TreeItemCollapsibleState,
	IFileSystemWatcher,
	IRelativePattern,
	ProviderResult,
} from '@fux/shared'
import {
	EventEmitterAdapter,
	ThemeIconAdapter,
	UriAdapter,
	RelativePatternAdapter,
} from '@fux/shared'
import { basename, dirname, extname, join, normalize } from 'node:path'
import { constants as fsConstants } from 'node:fs'
import { Buffer } from 'node:buffer'
import { access as fspAccess } from 'node:fs/promises'
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

	// Awilix-ready constructor (no decorators)
	constructor(
		public readonly notesDir: string,
		public readonly providerName: 'project' | 'remote' | 'global',
		private readonly openNoteCommandId: string,
		protected readonly iContext: IExtensionContext,
		protected readonly iWindow: IWindow,
		protected readonly iWorkspace: IWorkspace,
		protected readonly iCommands: ICommands,
		protected readonly iCommonUtils: ICommonUtilsService,
		protected readonly iFrontmatterUtils: IFrontmatterUtilsService,
		protected readonly iPathUtils: IPathUtilsService,
		protected readonly iFileTypeEnum: IFileType,
	) {
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
		this._onDidChangeTreeData.fire(undefined)
	}

	public dispose(): void {
		this._onDidChangeTreeData.dispose()
		this.fileWatcher.dispose()
	}
	      
	public getParent(element: NotesHubItem): ProviderResult<NotesHubItem> { //>
		if (!element.parentUri) {
			return undefined
		}

		const parentPath = this.iPathUtils.santizePath(element.parentUri.fsPath)
		const rootPath = this.iPathUtils.santizePath(this.notesDir)

		if (parentPath === rootPath) {
			// This item's parent is the root directory of this provider.
			// The root item is virtual and has no parent itself.
			return new NotesHubItem(basename(this.notesDir), this.notesDir, true)
		}

		// For any other nested item, we can resolve its parent from the filesystem.
		return this.getNotesHubItem(element.parentUri)
	}//<

	public async getTreeItem(element: NotesHubItem): Promise<ITreeItem> {
		if (element.isDirectory) {
			// If it's a root item (no parent), start it as expanded. Otherwise, collapsed.
			element.collapsibleState = !element.parentUri
				? TreeItemCollapsibleState.Expanded
				: TreeItemCollapsibleState.Collapsed
		}
		else {
			element.collapsibleState = TreeItemCollapsibleState.None
			// Set the command to execute when the item is clicked.
			// This replaces the onDidChangeSelection listener that was previously on the TreeView.
			element.command = {
				command: this.openNoteCommandId,
				title: 'Open Note',
				arguments: [element],
			}
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
		return element
	}

	public async getChildren(element?: NotesHubItem): Promise<NotesHubItem[]> {
		try {
			const dirPath = element?.filePath || this.notesDir

			if (!element) { // Root level for this provider
				const rootFolderItem = new NotesHubItem(basename(this.notesDir), this.notesDir, true)

				return [rootFolderItem]
			}

			if (element.isDirectory && element.resourceUri) {
				const entries = await this.iWorkspace.fs.readDirectory(element.resourceUri)
				const items: NotesHubItem[] = []

				for (const [name, fileType] of entries) {
					const filePath = join(dirPath, name)
					const isDir = (fileType & this.iFileTypeEnum.Directory) > 0

					if (isDir || this.isExtensionValid(filePath)) {
						const frontmatter = !isDir ? await this.iFrontmatterUtils.getFrontmatter(filePath) : undefined
						const item = new NotesHubItem(name, filePath, isDir, element.resourceUri, frontmatter)

						items.push(item)
					}
				}
				return items.sort(this.sortItems)
			}
			return []
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Error reading directory: ${element?.filePath || this.notesDir}`, error)
			return []
		}
	}

	public async getNotesHubItem(uri: IUri): Promise<NotesHubItem | undefined> {
		try {
			const filePath = uri.fsPath
			const stats = await this.iWorkspace.fs.stat(uri)
			const isDirectory = (stats.type & this.iFileTypeEnum.Directory) > 0
			const fileName = basename(filePath)
			const parentPath = dirname(filePath)
			const parentUri = parentPath !== filePath ? UriAdapter.file(parentPath) : undefined

			let frontmatter: { [key: string]: string } | undefined

			if (!isDirectory && this.isExtensionValid(filePath)) {
				frontmatter = await this.iFrontmatterUtils.getFrontmatter(filePath)
			}
			return new NotesHubItem(fileName, filePath, isDirectory, parentUri, frontmatter)
		}
		catch (error) {
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
			await fspAccess(this.iPathUtils.santizePath(filePath), fsConstants.F_OK)
			return true
		}
		catch {
			return false
		}
	} //<

	private async confirmOverwrite(itemName: string): Promise<boolean> { //>
		const message = `'${itemName}' already exists. Overwrite?`
		const result = await this.iWindow.showInformationMessage(message, { modal: true }, 'Overwrite')

		return result === 'Overwrite'
	} //<

	private async addDirToGitignore(dirToIgnore: string): Promise<void> { //>
		const workspaceFolder = this.iWorkspace.workspaceFolders?.[0]

		if (!workspaceFolder) {
			return
		}

		const gitignoreUri = UriAdapter.joinPath(workspaceFolder.uri, '.gitignore')

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

	protected santizePath(uncleanPath: string): string { //>
		const normalPath = normalize(uncleanPath)

		return normalPath.replace(/\\/g, '/')
	} //<

}
