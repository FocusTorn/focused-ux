// ESLint & Imports -->>

// _UTILITIES (direct imports) ================================================================================
import type { IWindow, IWorkspace, ICommonUtilsService, IFrontmatterUtilsService, IPathUtilsService, ICommands, IFileType } from '@fux/shared'
import type { INotesHubProviderManager } from '../_interfaces/INotesHubProviderManager.js'
import type { INotesHubDataProvider } from '../_interfaces/INotesHubDataProvider.js'
import type { INotesHubItem } from '../_interfaces/INotesHubItem.js'
import { ProjectNotesDataProvider } from '../providers/ProjectNotesDataProvider.js'
import { RemoteNotesDataProvider } from '../providers/RemoteNotesDataProvider.js'
import { GlobalNotesDataProvider } from '../providers/GlobalNotesDataProvider.js'
import type { NotesHubConfig } from '../_interfaces/INotesHubConfigService.js'
import type { IExtensionContext, Disposable } from '@fux/shared'

//--------------------------------------------------------------------------------------------------------------<<

export class NotesHubProviderManager implements INotesHubProviderManager {

	private projectNotesProvider?: ProjectNotesDataProvider
	private remoteNotesProvider?: RemoteNotesDataProvider
	private globalNotesProvider?: GlobalNotesDataProvider
	private disposables: Disposable[] = []

	constructor(
		private readonly iContext: IExtensionContext,
		private readonly iWindow: IWindow,
		private readonly iWorkspace: IWorkspace,
		private readonly iCommands: ICommands,
		private readonly iCommonUtils: ICommonUtilsService,
		private readonly iFrontmatterUtils: IFrontmatterUtilsService,
		private readonly iPathUtils: IPathUtilsService,
		private readonly iFileTypeEnum: IFileType,
		private readonly treeItemAdapter: any,
		private readonly themeIconAdapter: any,
		private readonly themeColorAdapter: any,
		private readonly uriAdapter: any,
		private readonly treeItemCollapsibleStateAdapter: any,
	) {}

	public async initializeProviders(config: NotesHubConfig, commandPrefix: string, openNoteCommandId: string): Promise<void> { //>
		// Check if providers are already initialized
		if (this.projectNotesProvider || this.remoteNotesProvider || this.globalNotesProvider) {
			console.warn(`[NotesHub] Providers already initialized, skipping.`)
			return
		}

		if (config.isProjectNotesEnabled && config.projectNotesPath) {
			this.projectNotesProvider = new ProjectNotesDataProvider(
				config.projectNotesPath,
				this.iContext,
				this.iWindow,
				this.iWorkspace,
				this.iCommands,
				this.iCommonUtils,
				this.iFrontmatterUtils,
				this.iPathUtils,
				this.iFileTypeEnum,
				openNoteCommandId,
				this.treeItemAdapter,
				this.themeIconAdapter,
				this.themeColorAdapter,
				this.uriAdapter,
				this.treeItemCollapsibleStateAdapter,
			)
			this.projectNotesProvider.initializeTreeView(`${commandPrefix}.projectNotesView`)
			this.disposables.push(this.projectNotesProvider)
		}

		if (config.isRemoteNotesEnabled && config.remoteNotesPath) {
			this.remoteNotesProvider = new RemoteNotesDataProvider(
				config.remoteNotesPath,
				this.iContext,
				this.iWindow,
				this.iWorkspace,
				this.iCommands,
				this.iCommonUtils,
				this.iFrontmatterUtils,
				this.iPathUtils,
				this.iFileTypeEnum,
				openNoteCommandId,
				this.treeItemAdapter,
				this.themeIconAdapter,
				this.themeColorAdapter,
				this.uriAdapter,
				this.treeItemCollapsibleStateAdapter,
			)
			this.remoteNotesProvider.initializeTreeView(`${commandPrefix}.remoteNotesView`)
			this.disposables.push(this.remoteNotesProvider)
		}

		if (config.isGlobalNotesEnabled && config.globalNotesPath) {
			this.globalNotesProvider = new GlobalNotesDataProvider(
				config.globalNotesPath,
				this.iContext,
				this.iWindow,
				this.iWorkspace,
				this.iCommands,
				this.iCommonUtils,
				this.iFrontmatterUtils,
				this.iPathUtils,
				this.iFileTypeEnum,
				openNoteCommandId,
				this.treeItemAdapter,
				this.themeIconAdapter,
				this.themeColorAdapter,
				this.uriAdapter,
				this.treeItemCollapsibleStateAdapter,
			)
			this.globalNotesProvider.initializeTreeView(`${commandPrefix}.globalNotesView`)
			this.disposables.push(this.globalNotesProvider)
		}
	} //<

	public dispose(): void { //>
		this.projectNotesProvider?.dispose()
		this.remoteNotesProvider?.dispose()
		this.globalNotesProvider?.dispose()
		this.projectNotesProvider = undefined
		this.remoteNotesProvider = undefined
		this.globalNotesProvider = undefined
		this.disposables.forEach(d => d.dispose())
		this.disposables = []
	} //<

	public async getProviderForNote(
		item: INotesHubItem,
	): Promise<INotesHubDataProvider | undefined> {
		const config = {
			projectNotesPath: this.projectNotesProvider?.notesDir || '',
			remoteNotesPath: this.remoteNotesProvider?.notesDir || '',
			globalNotesPath: this.globalNotesProvider?.notesDir || '',
		}
		const sanitizedFilePath = item.filePath ? this.iPathUtils.sanitizePath(item.filePath) : ''

		if (this.projectNotesProvider && config.projectNotesPath && sanitizedFilePath.startsWith(config.projectNotesPath)) {
			return this.projectNotesProvider
		}
		if (this.remoteNotesProvider && config.remoteNotesPath && sanitizedFilePath.startsWith(config.remoteNotesPath)) {
			return this.remoteNotesProvider
		}
		if (this.globalNotesProvider && config.globalNotesPath && sanitizedFilePath.startsWith(config.globalNotesPath)) {
			return this.globalNotesProvider
		}
		this.iCommonUtils.errMsg(`Could not determine provider for item: ${item.filePath}`)
		return undefined
	} //<

	public getProviderInstance(providerName: 'project' | 'remote' | 'global'): INotesHubDataProvider | undefined { //>
		switch (providerName) {
			case 'project': return this.projectNotesProvider
			case 'remote': return this.remoteNotesProvider
			case 'global': return this.globalNotesProvider
			default: return undefined
		}
	} //<

	public refreshProviders( //>
		providersToRefresh?: 'project' | 'remote' | 'global' | 'all' | Array<'project' | 'remote' | 'global'>,
	): void {
		const targets = Array.isArray(providersToRefresh)
			? providersToRefresh
			: providersToRefresh === undefined || providersToRefresh === 'all'
				? ['project', 'remote', 'global'] as const
				: [providersToRefresh]

		for (const target of targets) {
			switch (target) {
				case 'project': this.projectNotesProvider?.refresh(); break
				case 'remote': this.remoteNotesProvider?.refresh(); break
				case 'global': this.globalNotesProvider?.refresh(); break
			}
		}
	} //<

	public async revealNotesHubItem( //>
		provider: INotesHubDataProvider,
		item: INotesHubItem,
		_select: boolean = false,
	): Promise<void> {
		try {
			// With the change to `registerTreeDataProvider`, we no longer have access to the
			// `TreeView` instance, so we cannot programmatically reveal items.
			// This is a known limitation to fix the extension activation errors.
			console.warn(`[NotesHub] Attempted to reveal item '${item.filePath}' on provider '${provider.providerName}', but this feature is disabled.`)
		}
		catch (error) {
			this.iCommonUtils.errMsg('Error revealing item in Notes Hub', error)
		}
	} //<

}
