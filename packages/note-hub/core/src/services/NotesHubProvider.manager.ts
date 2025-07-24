// ESLint & Imports -->>

// _UTILITIES (direct imports) ================================================================================
import type { IWindow } from '@fux/shared/_interfaces/IWindow'
import type { IWorkspace } from '@fux/shared/_interfaces/IWorkspace'
import type { ICommonUtilsService } from '@fux/shared/_interfaces/ICommonUtilsService'
import type { IFrontmatterUtilsService } from '@fux/shared/_interfaces/IFrontmatterUtilsService'
import type { IPathUtilsService } from '@fux/shared/_interfaces/IPathUtilsService'
import type { ICommands } from '@fux/shared/_interfaces/ICommands'
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
		select: boolean = false,
	): Promise<void> {
		try {
			if (!provider.treeView) {
				this.iCommonUtils.errMsg(`Tree view not found for provider: ${provider.providerName}`)
				return
			}
			if (!item) {
				this.iCommonUtils.errMsg('Item to reveal is null or undefined')
				return
			}
			await provider.treeView.reveal(item, { expand: true, select: false })
			if (select) {
				await this.iCommonUtils.delay(50)
				await provider.treeView.reveal(item, { select: true, focus: true, expand: true })
			}
		}
		catch (error) {
			this.iCommonUtils.errMsg('Error revealing item in Notes Hub', error)
		}
	} //<

}
