// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { TreeItemCheckboxState, TreeItemCollapsibleState, Event } from '@fux/shared'

//= MISC ======================================================================================================
import * as micromatch from 'micromatch'
import * as yaml from 'js-yaml'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IFileExplorerService } from '../_interfaces/IFileExplorerService.js'
import { FileExplorerItem } from '../models/FileExplorerItem.js'
import type { ITreeItemFactory } from '../models/FileExplorerItem.js'
import { constants } from '../_config/constants.js'
import type { FileGroupsConfig } from '../_interfaces/ccp.types.js'
import type { IWorkspace, IFileSystemWatcher } from '../_interfaces/IWorkspace.js'
import type { IWindow } from '../_interfaces/IWindow.js'
import type { IQuickSettingsService } from '../_interfaces/IQuickSettingsService.js'
import type { ITokenizerService } from '../_interfaces/ITokenizerService.js'
import type { IFileSystem, DirectoryEntry } from '../_interfaces/IFileSystem.js'
import type { IPath } from '../_interfaces/IPath.js'
import { EventEmitterAdapter } from '@fux/shared'

//--------------------------------------------------------------------------------------------------------------<<

const LARGE_FILE_TOKEN_THRESHOLD = 500_000
const _LARGE_FILE_SIZE_THRESHOLD_BYTES = 500 * 1024 // 500 KB, a more conservative threshold

interface ProjectYamlConfig { //>
	ContextCherryPicker?: {
		quick_settings_panel?: {
			file_groups?: FileGroupsConfig
		}
		ignore?: string[]
		project_tree?: {
			always_show?: string[]
			always_hide?: string[]
			show_if_selected?: string[]
		}
		context_explorer?: {
			ignore?: string[]
			hide_children?: string[]
		}
	}
} //<

function isFileOrDirectory(entry: DirectoryEntry): entry is DirectoryEntry & { type: 'file' | 'directory' } {
	return entry.type === 'file' || entry.type === 'directory'
}

export class FileExplorerService implements IFileExplorerService { //>

	private _onDidChangeTreeData: EventEmitterAdapter<FileExplorerItem | undefined | null | void> = new EventEmitterAdapter<FileExplorerItem | undefined | null | void>()
	readonly onDidChangeTreeData: Event<FileExplorerItem | undefined | null | void> = this._onDidChangeTreeData.event

	private checkboxStates: Map<string, TreeItemCheckboxState> = new Map()
	private tokenCountCache: Map<string, 'loading' | number> = new Map()
	private fileWatcher: IFileSystemWatcher | undefined
	private isInitialized = false
	private configChangeListener: any | undefined

	private fileGroupsConfig: FileGroupsConfig | undefined
	private globalIgnoreGlobs: string[] = []
	private contextExplorerIgnoreGlobs: string[] = []
	private contextExplorerHideChildrenGlobs: string[] = []
	private projectTreeAlwaysShowGlobs: string[] = []
	private projectTreeAlwaysHideGlobs: string[] = []
	private projectTreeShowIfSelectedGlobs: string[] = []

	constructor(
		private readonly workspace: IWorkspace,
		private readonly window: IWindow,
		private readonly quickSettingsService: IQuickSettingsService,
		private readonly tokenizerService: ITokenizerService,
		private readonly fileSystem: IFileSystem,
		private readonly path: IPath,
		private readonly treeItemFactory: ITreeItemFactory,
	) {
		this.configChangeListener = this.workspace.onDidChangeConfiguration(this._onVsCodeConfigChange)

		if (this.workspace.workspaceFolders && this.workspace.workspaceFolders.length > 0) {
			const workspaceRoot = this.workspace.workspaceFolders[0].uri
			const globPattern = this.path.join(workspaceRoot, constants.projectConfig.fileName)

			this.fileWatcher = this.workspace.createFileSystemWatcher(globPattern)

			this.fileWatcher.onDidChange(this._onFocusedUxConfigChange)
			this.fileWatcher.onDidCreate(this._onFocusedUxConfigChange)
			this.fileWatcher.onDidDelete(this._onFocusedUxConfigChange)
		}
	}

	private _onVsCodeConfigChange = async (): Promise<void> => {
		console.log(`[${constants.extension.name}] VS Code settings changed. Refreshing explorer view.`)
		await this.refresh()
	}

	private _onFocusedUxConfigChange = async (): Promise<void> => {
		console.log(`[${constants.extension.name}] '.FocusedUX' file configuration changed. Refreshing explorer view.`)
		await this.quickSettingsService.refresh()
		await this.refresh()
	}

	private getPatternsFromSources(
		parsedYamlConfig: ProjectYamlConfig | undefined,
		yamlPath: string[],
		vscodeSettingKey: string,
		defaultValue: string[] = [],
	): string[] {
		let patterns: string[] | undefined

		if (parsedYamlConfig) {
			let currentLevel: any = parsedYamlConfig

			for (const key of yamlPath) {
				if (currentLevel && typeof currentLevel === 'object' && Object.prototype.hasOwnProperty.call(currentLevel, key)) {
					currentLevel = currentLevel[key]
				}
				else {
					currentLevel = undefined
					break
				}
			}
			if (Array.isArray(currentLevel)) {
				patterns = currentLevel as string[]
			}
		}

		if (patterns !== undefined) {
			return patterns
		}
		else {
			const vsCodePatterns = this.workspace.get(constants.extension.configKey, vscodeSettingKey.substring(constants.extension.configKey.length + 1))

			return vsCodePatterns || defaultValue
		}
	}

	private async loadConfigurationPatterns(): Promise<void> {
		let parsedYamlConfig: ProjectYamlConfig | undefined
		const ccpKey = constants.projectConfig.keys.contextCherryPicker

		if (this.workspace.workspaceFolders && this.workspace.workspaceFolders.length > 0) {
			const workspaceRoot = this.workspace.workspaceFolders[0].uri
			const configFileUri = this.path.join(workspaceRoot, constants.projectConfig.fileName)

			try {
				const yamlContent = await this.fileSystem.readFile(configFileUri)

				parsedYamlConfig = yaml.load(yamlContent) as ProjectYamlConfig
			}
			catch (_error: any) {
				// Ignore file not found, warn on others
			}
		}

		const keys = constants.projectConfig.keys
		const cfg = constants.configKeys
		const panelKey = constants.projectConfig.keys.quick_settings_panel

		this.fileGroupsConfig = parsedYamlConfig?.[ccpKey]?.[panelKey]?.file_groups
		this.globalIgnoreGlobs = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.ignore], cfg.CCP_IGNORE_PATTERNS, [])
		this.contextExplorerIgnoreGlobs = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.context_explorer, keys.ignore], cfg.CCP_CONTEXT_EXPLORER_IGNORE_GLOBS, [])
		this.contextExplorerHideChildrenGlobs = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.context_explorer, keys.hide_children], cfg.CCP_CONTEXT_EXPLORER_HIDE_CHILDREN_GLOBS, [])
		this.projectTreeAlwaysShowGlobs = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.project_tree, keys.always_show], cfg.CCP_PROJECT_TREE_ALWAYS_SHOW_GLOBS, [])
		this.projectTreeAlwaysHideGlobs = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.project_tree, keys.always_hide], cfg.CCP_PROJECT_TREE_ALWAYS_HIDE_GLOBS, [])
		this.projectTreeShowIfSelectedGlobs = this.getPatternsFromSources(parsedYamlConfig, [ccpKey, keys.project_tree, keys.show_if_selected], cfg.CCP_PROJECT_TREE_SHOW_IF_SELECTED_GLOBS, [])
	}

	private async isUriHiddenForProviderUi(uri: string): Promise<boolean> {
		const relativePath = this.workspace.asRelativePath(uri, false).replace(/\\/g, '/')
		const mm = micromatch

		if (mm.isMatch(relativePath, this.globalIgnoreGlobs))
			return true
		if (mm.isMatch(relativePath, this.contextExplorerIgnoreGlobs))
			return true

		if (this.fileGroupsConfig) {
			for (const groupName in this.fileGroupsConfig) {
				const group = this.fileGroupsConfig[groupName]
				const settingId = `${constants.quickSettingIDs.fileGroupVisibility.idPrefix}.${groupName}`
				const isVisible = await this.quickSettingsService.getSettingState(settingId)

				if (isVisible === false) {
					if (mm.isMatch(relativePath, group.items || [])) {
						return true
					}
				}
			}
		}
		return false
	}

	async getChildren(element?: FileExplorerItem): Promise<FileExplorerItem[]> {
		if (!this.isInitialized) {
			await this.loadConfigurationPatterns()
			this.isInitialized = true
		}

		if (!this.workspace.workspaceFolders || this.workspace.workspaceFolders.length === 0)
			return []

		const sourceUri = element ? element.uri : this.workspace.workspaceFolders[0].uri

		if (element && element.type === 'directory') {
			const relativeElementPath = this.workspace.asRelativePath(element.uri, false).replace(/\\/g, '/')
			const mm = micromatch

			if (mm.isMatch(relativeElementPath, this.contextExplorerHideChildrenGlobs)) {
				return []
			}
		}

		try {
			const entries = await this.fileSystem.readDirectory(sourceUri)
			const mm = micromatch
			const promises = entries
				.filter(isFileOrDirectory)
				.map(async (entry: DirectoryEntry) => {
					const childUri = this.path.join(sourceUri, entry.name)

					if (await this.isUriHiddenForProviderUi(childUri)) {
						return null
					}

					const relativeChildPath = this.workspace.asRelativePath(childUri, false).replace(/\\/g, '/')
					let collapsibleStateOverride: TreeItemCollapsibleState | undefined

					if (entry.type === 'directory' && mm.isMatch(relativeChildPath, this.contextExplorerHideChildrenGlobs)) {
						collapsibleStateOverride = this.treeItemFactory.getCollapsibleStateNone()
					}
					return FileExplorerItem.create(
						childUri,
						entry.name,
						entry.type,
						this.treeItemFactory,
						this.getCheckboxState(childUri) || this.treeItemFactory.getCheckboxStateUnchecked(),
						undefined,
						collapsibleStateOverride,
					)
				})

			const resolvedChildren = (await Promise.all(promises)).filter((item: any): item is FileExplorerItem => item !== null)

			return resolvedChildren.sort((a: FileExplorerItem, b: FileExplorerItem) => {
				if (a.type === 'directory' && b.type === 'file')
					return -1
				if (a.type === 'file' && b.type === 'directory')
					return 1
				return a.label.localeCompare(b.label)
			})
		}
		catch (_error: any) {
			this.window.showErrorMessage(`Error reading directory: ${element?.label || sourceUri}`)
			return []
		}
	}

	async getTreeItem(element: FileExplorerItem): Promise<FileExplorerItem> {
		if (await this.isUriHiddenForProviderUi(element.uri)) {
			return element
		}

		const currentState = this.getCheckboxState(element.uri)

		element.checkboxState = currentState === undefined ? this.treeItemFactory.getCheckboxStateUnchecked() : currentState

		const cacheState = this.tokenCountCache.get(element.uri)

		if (typeof cacheState === 'number') {
			element.description = `(tokens: ${this._formatTokenCount(cacheState)})`
		}
		else {
			element.description = `(tokens: --)`
			if (cacheState === undefined) {
				this.tokenCountCache.set(element.uri, 'loading')
				;(async () => {
					const finalCount = await this._calculateTokenCount(element.uri)

					this.tokenCountCache.set(element.uri, finalCount)
					this._onDidChangeTreeData.fire(element)
				})()
			}
		}
		return element
	}

	async refresh(): Promise<void> {
		this.tokenCountCache.clear()
		await this.loadConfigurationPatterns()
		this._onDidChangeTreeData.fire()
	}

	clearAllCheckboxes(): void {
		this.checkboxStates.forEach((state, uriString) => {
			if (state === this.treeItemFactory.getCheckboxStateChecked()) {
				this.checkboxStates.set(uriString, this.treeItemFactory.getCheckboxStateUnchecked())
			}
		})
		this._onDidChangeTreeData.fire()
	}

	updateCheckboxState(uri: string, state: TreeItemCheckboxState): void {
		this.checkboxStates.set(uri, state)
		this._onDidChangeTreeData.fire()
	}

	getCheckboxState(uri: string): TreeItemCheckboxState | undefined {
		return this.checkboxStates.get(uri)
	}

	getAllCheckedItems(): string[] {
		return Array.from(this.checkboxStates.entries())
			.filter(([, state]) => state === this.treeItemFactory.getCheckboxStateChecked())
			.map(([uriString]) => uriString)
	}

	loadCheckedState(itemsToLoad: Array<{ uriString: string, checkboxState: number }>): void {
		this.checkboxStates.clear()
		for (const item of itemsToLoad) {
			this.checkboxStates.set(item.uriString, item.checkboxState as TreeItemCheckboxState)
		}
		this._onDidChangeTreeData.fire()
	}

	public getCoreScanIgnoreGlobs = (): string[] => [...this.globalIgnoreGlobs]
	public getContextExplorerIgnoreGlobs = (): string[] => [...this.contextExplorerIgnoreGlobs]
	public getContextExplorerHideChildrenGlobs = (): string[] => [...this.contextExplorerHideChildrenGlobs]
	public getProjectTreeAlwaysShowGlobs = (): string[] => [...this.projectTreeAlwaysShowGlobs]
	public getProjectTreeAlwaysHideGlobs = (): string[] => [...this.projectTreeAlwaysHideGlobs]
	public getProjectTreeShowIfSelectedGlobs = (): string[] => [...this.projectTreeShowIfSelectedGlobs]
	public getFileGroupsConfig = (): FileGroupsConfig | undefined => this.fileGroupsConfig

	public dispose(): void {
		this._onDidChangeTreeData.dispose()
		this.fileWatcher?.dispose()
		this.configChangeListener?.dispose()
	}

	private _formatTokenCount(count: number): string {
		if (count === Infinity)
			return `>${(LARGE_FILE_TOKEN_THRESHOLD / 1000).toFixed(0)}k`
		if (count < 0)
			return 'err'
		if (count < 1000)
			return count.toString()
		return `${(count / 1000).toFixed(1)}k`
	}

	private async _calculateTokenCount(uri: string): Promise<number> {
		try {
			const stat = await this.fileSystem.stat(uri)

			if (stat.type === 'file') {
				// if (stat.size > LARGE_FILE_SIZE_THRESHOLD_BYTES)
				// 	return Infinity

				const content = await this.fileSystem.readFile(uri)

				return await this.tokenizerService.calculateTokens(content)
			}
			else {
				const entries = await this.fileSystem.readDirectory(uri)
				const promises = entries.map(async (entry: DirectoryEntry) => {
					const childUri = this.path.join(uri, entry.name)

					if (await this.isUriHiddenForProviderUi(childUri))
						return 0

					const cached = this.tokenCountCache.get(childUri)

					if (typeof cached === 'number')
						return cached
					return this._calculateTokenCount(childUri)
				})
				const counts = await Promise.all(promises)

				if (counts.includes(Infinity))
					return Infinity
				return counts.reduce((sum: number, count: number) => sum + count, 0)
			}
		}
		catch (_e) { /* ignore */ }
		return 0
	}

}
