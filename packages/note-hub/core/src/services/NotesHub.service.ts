// ESLint & Imports -->>

// _UTILITIES (direct imports) ================================================================================
import type { IWindow, IWorkspace, ICommands } from '@fux/shared'
import type { INotesHubService } from '../_interfaces/INotesHubService.js'
import type { INotesHubDataProvider } from '../_interfaces/INotesHubDataProvider.js'
import type { INotesHubItem } from '../_interfaces/INotesHubItem.js'
import { notesHubConstants } from '../_config/constants.js'
import type { INotesHubConfigService, NotesHubConfig } from '../_interfaces/INotesHubConfigService.js'
import type { INotesHubActionService } from '../_interfaces/INotesHubActionService.js'
import type { INotesHubProviderManager } from '../_interfaces/INotesHubProviderManager.js'
import type { Disposable } from 'vscode'

//--------------------------------------------------------------------------------------------------------------<<

export class NotesHubService implements INotesHubService {

	private disposables: Disposable[] = []
	private configPrefix: string = 'nh'
	private commandPrefix: string = 'nh'

	constructor(
		private readonly iWorkspace: IWorkspace,
		private readonly iWindow: IWindow,
		private readonly iCommands: ICommands,
		private readonly iConfigService: INotesHubConfigService,
		private readonly iActionService: INotesHubActionService,
		private readonly iProviderManager: INotesHubProviderManager,
	) {}

	public async initializeNotesHub( //>
		configPrefix: string = 'nh',
		commandPrefix: string = 'nh',
	): Promise<void> {
		this.configPrefix = configPrefix
		this.commandPrefix = commandPrefix

		const config = this.iConfigService.getNotesHubConfig(this.configPrefix)

		await this.iConfigService.createDirectoryIfNeeded(config.projectNotesPath)
		await this.iConfigService.createDirectoryIfNeeded(config.remoteNotesPath)
		await this.iConfigService.createDirectoryIfNeeded(config.globalNotesPath)

		const openNoteCommandId = `${this.commandPrefix}.${notesHubConstants.commands.openNote}`

		await this.iProviderManager.initializeProviders(config, this.commandPrefix, openNoteCommandId)

		const configWatcher = this.iWorkspace.onDidChangeConfiguration(async (e) => {
			if (e.affectsConfiguration(this.configPrefix)) {
				const action = await this.iWindow.showInformationMessage(
					'A Notes Hub configuration change requires a reload to take effect.',
					'Reload Window',
				)

				if (action === 'Reload Window') {
					this.iCommands.executeCommand('workbench.action.reloadWindow')
				}
			}
		})

		this.disposables.push(configWatcher, { dispose: () => this.iProviderManager.dispose() })
	} //<

	public dispose(): void { //>
		this.disposables.forEach(d => d.dispose())
		this.disposables = []
	} //<

	// Delegated methods
	public getNotesHubConfig(): NotesHubConfig {
		return this.iConfigService.getNotesHubConfig(this.configPrefix)
	}

	public getProviderForNote(item: INotesHubItem): Promise<INotesHubDataProvider | undefined> {
		return this.iProviderManager.getProviderForNote(item)
	}

	public refreshProviders(providersToRefresh?: 'project' | 'remote' | 'global' | 'all' | Array<'project' | 'remote' | 'global'>): void {
		this.iProviderManager.refreshProviders(providersToRefresh)
	}

	public revealNotesHubItem(provider: INotesHubDataProvider, item: INotesHubItem, select?: boolean): Promise<void> {
		return this.iProviderManager.revealNotesHubItem(provider, item, select)
	}

	public openNote(noteItem: INotesHubItem): Promise<void> {
		return this.iActionService.openNote(noteItem)
	}

	public renameItem(item: INotesHubItem): Promise<void> {
		return this.iActionService.renameItem(item)
	}

	public addFrontmatter(noteItem: INotesHubItem): Promise<void> {
		return this.iActionService.addFrontmatter(noteItem)
	}

	public openNotePreview(noteItem: INotesHubItem): Promise<void> {
		return this.iActionService.openNotePreview(noteItem)
	}

	public deleteItem(item: INotesHubItem): Promise<void> {
		return this.iActionService.deleteItem(item)
	}

	public copyItem(item: INotesHubItem): Promise<void> {
		return this.iActionService.copyItem(item)
	}

	public cutItem(item: INotesHubItem): Promise<void> {
		return this.iActionService.cutItem(item)
	}

	public pasteItem(targetFolderItem: INotesHubItem): Promise<void> {
		return this.iActionService.pasteItem(targetFolderItem)
	}

	public newNoteInFolder(targetFolderItem: INotesHubItem): Promise<void> {
		return this.iActionService.newNoteInFolder(targetFolderItem)
	}

	public newFolderInFolder(targetFolderItem: INotesHubItem): Promise<void> {
		return this.iActionService.newFolderInFolder(targetFolderItem)
	}

	public newNoteAtRoot(providerName: 'project' | 'remote' | 'global'): Promise<void> {
		return this.iActionService.newNoteAtRoot(providerName)
	}

	public newFolderAtRoot(providerName: 'project' | 'remote' | 'global'): Promise<void> {
		return this.iActionService.newFolderAtRoot(providerName)
	}

}
