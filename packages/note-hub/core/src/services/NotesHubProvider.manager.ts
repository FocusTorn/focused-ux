// ESLint & Imports -->>

// _UTILITIES (direct imports) ================================================================================
import type { IWindow, IWorkspace, ICommonUtilsService, IFrontmatterUtilsService, IPathUtilsService, ICommands } from '@fux/shared'
import type { ExtensionContext, Disposable } from 'vscode'
import type { INotesHubProviderManager } from '../_interfaces/INotesHubProviderManager.js'
import type { INotesHubDataProvider } from '../_interfaces/INotesHubDataProvider.js'
import type { INotesHubItem } from '../_interfaces/INotesHubItem.js'
import { ProjectNotesDataProvider } from '../providers/ProjectNotesDataProvider.js'
import { RemoteNotesDataProvider } from '../providers/RemoteNotesDataProvider.js'
import { GlobalNotesDataProvider } from '../providers/GlobalNotesDataProvider.js'
import type { NotesHubConfig } from '../_interfaces/INotesHubConfigService.js'

//--------------------------------------------------------------------------------------------------------------<<

export class NotesHubProviderManager implements INotesHubProviderManager {

	private projectNotesProvider?: ProjectNotesDataProvider
	private remoteNotesProvider?: RemoteNotesDataProvider
	private globalNotesProvider?: GlobalNotesDataProvider
	private disposables: Disposable[] = []

	constructor(
		private readonly iContext: ExtensionContext,
		private readonly iWindow: IWindow,
		private readonly iWorkspace: IWorkspace,
		private readonly iCommands: ICommands,
		private readonly iCommonUtils: ICommonUtilsService,
		private readonly iFrontmatterUtils: IFrontmatterUtilsService,
		private readonly iPathUtils: IPathUtilsService,
	) {}

	public async initializeProviders(config: NotesHubConfig, commandPrefix: string, openNoteCommandId: string): Promise<void> { //>
		// Check if providers are already initialized
		if (this.projectNotesProvider || this.remoteNotesProvider || this.globalNotesProvider) {
			console.warn(`[NotesHub] Providers already initialized, skipping.`)
			return
		}

		if (config.isProjectNotesEnabled) {
			this.projectNotesProvider = new ProjectNotesDataProvider(
				this.iContext,
				this.iWindow,
				this.iWorkspace,
				this.iCommands,
				this.iCommonUtils,
				this.iFrontmatterUtils,
				this.iPathUtils,
				config.projectNotesPath,
				openNoteCommandId,
			)
			this.projectNotesProvider.initializeTreeView(`${commandPrefix}.projectNotesView`)
			this.disposables.push(this.projectNotesProvider)
		}

		if (config.isRemoteNotesEnabled) {
			this.remoteNotesProvider = new RemoteNotesDataProvider(
				this.iContext,
				this.iWindow,
				this.iWorkspace,
				this.iCommands,
				this.iCommonUtils,
				this.iFrontmatterUtils,
				this.iPathUtils,
				config.remoteNotesPath,
				openNoteCommandId,
			)
			this.remoteNotesProvider.initializeTreeView(`${commandPrefix}.remoteNotesView`)
			this.disposables.push(this.remoteNotesProvider)
		}

		if (config.isGlobalNotesEnabled) {
			this.globalNotesProvider = new GlobalNotesDataProvider(
				this.iContext,
				this.iWindow,
				this.iWorkspace,
				this.iCommands,
				this.iCommonUtils,
				this.iFrontmatterUtils,
				this.iPathUtils,
				config.globalNotesPath,
				openNoteCommandId,
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
		const sanitizedFilePath = this.iPathUtils.santizePath(item.filePath)

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
