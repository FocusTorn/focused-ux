// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { INotesHubManagerService, INotesHubDependencies } from '../_interfaces/INotesHubManagerService.js'
import type { Disposable } from '../_interfaces/IDisposable.js'
import type { INotesHubDataProvider } from '../_interfaces/INotesHubDataProvider.js'
import type { INotesHubItem } from '../_interfaces/INotesHubItem.js'
import type { NotesHubConfig } from '../_interfaces/INotesHubConfigService.js'
import { notesHubConstants } from '../_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

const _LOG_PREFIX = `[NotesHub - NH_Manager]:`

export class NotesHubManagerService implements INotesHubManagerService {

    private disposables: Disposable[] = []
    private configPrefix: string = 'nh'
    private commandPrefix: string = 'nh'

    constructor(private readonly dependencies: INotesHubDependencies) {}

    public async initializeNotesHub(
        configPrefix: string = 'nh',
        commandPrefix: string = 'nh',
    ): Promise<void> {
        try {
            this.configPrefix = configPrefix
            this.commandPrefix = commandPrefix

            const config = this.dependencies.configService.getNotesHubConfig(this.configPrefix)

            await this.dependencies.configService.createDirectoryIfNeeded(config.projectNotesPath)
            await this.dependencies.configService.createDirectoryIfNeeded(config.remoteNotesPath)
            await this.dependencies.configService.createDirectoryIfNeeded(config.globalNotesPath)

            const openNoteCommandId = `${this.commandPrefix}.${notesHubConstants.commands.openNote}`

            await this.dependencies.providerManager.initializeProviders(config, this.commandPrefix, openNoteCommandId)

            const configWatcher = this.dependencies.workspace.onDidChangeConfiguration(async (e: any) => {
                if (e.affectsConfiguration(this.configPrefix)) {
                    const action = await this.dependencies.window.showInformationMessage(
                        'A Notes Hub configuration change requires a reload to take effect.',
                        'Reload',
                        'Later',
                    )

                    if (action === 'Reload') {
                        await this.dependencies.commands.executeCommand('workbench.action.reloadWindow')
                    }
                }
            })

            this.disposables.push(configWatcher, { dispose: () => this.dependencies.providerManager.dispose() })
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.PROVIDER_INITIALIZATION_FAILED}: ${errorMessage}`)
        }
    }

    public dispose(): void {
        try {
            this.disposables.forEach(d => d.dispose())
            this.disposables = []
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Dispose failed: ${errorMessage}`)
        }
    }

    // Delegated methods
    public getNotesHubConfig(): NotesHubConfig {
        try {
            return this.dependencies.configService.getNotesHubConfig(this.configPrefix)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Get notes hub config failed: ${errorMessage}`)
        }
    }

    public getProviderForNote(item: INotesHubItem): Promise<INotesHubDataProvider | undefined> {
        try {
            return this.dependencies.providerManager.getProviderForNote(item)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Get provider for note failed: ${errorMessage}`)
        }
    }

    public refreshProviders(providersToRefresh?: 'project' | 'remote' | 'global' | 'all' | Array<'project' | 'remote' | 'global'>): void {
        try {
            this.dependencies.providerManager.refreshProviders(providersToRefresh)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Refresh providers failed: ${errorMessage}`)
        }
    }

    public revealNotesHubItem(provider: INotesHubDataProvider, item: INotesHubItem, select?: boolean): Promise<void> {
        try {
            return this.dependencies.providerManager.revealNotesHubItem(provider, item, select)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Reveal notes hub item failed: ${errorMessage}`)
        }
    }

    // Action service methods
    public openNote(noteItem: INotesHubItem): Promise<void> {
        try {
            return this.dependencies.actionService.openNote(noteItem)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    public renameItem(item: INotesHubItem): Promise<void> {
        try {
            return this.dependencies.actionService.renameItem(item)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    public addFrontmatter(noteItem: INotesHubItem): Promise<void> {
        try {
            return this.dependencies.actionService.addFrontmatter(noteItem)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    public openNotePreview(noteItem: INotesHubItem): Promise<void> {
        try {
            return this.dependencies.actionService.openNotePreview(noteItem)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    public deleteItem(item: INotesHubItem): Promise<void> {
        try {
            return this.dependencies.actionService.deleteItem(item)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    public copyItem(item: INotesHubItem): Promise<void> {
        try {
            return this.dependencies.actionService.copyItem(item)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    public cutItem(item: INotesHubItem): Promise<void> {
        try {
            return this.dependencies.actionService.cutItem(item)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    public pasteItem(targetFolderItem: INotesHubItem): Promise<void> {
        try {
            return this.dependencies.actionService.pasteItem(targetFolderItem)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    public newNoteInFolder(targetFolderItem: INotesHubItem): Promise<void> {
        try {
            return this.dependencies.actionService.newNoteInFolder(targetFolderItem)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    public newFolderInFolder(targetFolderItem: INotesHubItem): Promise<void> {
        try {
            return this.dependencies.actionService.newFolderInFolder(targetFolderItem)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    public newNoteAtRoot(providerName: 'project' | 'remote' | 'global'): Promise<void> {
        try {
            return this.dependencies.actionService.newNoteAtRoot(providerName)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    public newFolderAtRoot(providerName: 'project' | 'remote' | 'global'): Promise<void> {
        try {
            return this.dependencies.actionService.newFolderAtRoot(providerName)
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`${notesHubConstants.errorMessages.NOTE_OPERATION_FAILED}: ${errorMessage}`)
        }
    }

    // Complex orchestration methods
    public async openNoteWithValidation(noteItem: INotesHubItem): Promise<{ opened: boolean; notePath?: string }> {
        try {
            // Step 1: Validate input parameters
            this.validateNoteItem(noteItem)
            
            if (!noteItem || !noteItem.filePath) {
                this.dependencies.window.showWarningMessage('No note item provided for opening.')
                return { opened: false }
            }

            // Step 2: Get provider for the note
            const provider = await this.getProviderForNote(noteItem)
            if (!provider) {
                this.dependencies.window.showWarningMessage(`Could not determine provider for note: ${noteItem.filePath}`)
                return { opened: false }
            }

            // Step 3: Open the note
            await this.openNote(noteItem)
            this.dependencies.window.showInformationMessage(`Note opened: ${noteItem.filePath}`)

            return { opened: true, notePath: noteItem.filePath }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Open note with validation failed: ${errorMessage}`)
        }
    }

    public async createNoteWithValidation(
        providerName: 'project' | 'remote' | 'global', 
        noteName?: string
    ): Promise<{ created: boolean; notePath?: string; providerName?: string }> {
        try {
            // Step 1: Validate input parameters
            this.validateProviderName(providerName)
            
            // Step 2: Get note name if not provided
            let finalNoteName = noteName
            if (!finalNoteName) {
                finalNoteName = await this.dependencies.window.showInputBox({ 
                    prompt: `Enter a name for the new note in ${providerName} provider` 
                })
            }

            if (!finalNoteName) {
                return { created: false, providerName }
            }

            // Step 3: Validate note name
            this.validateNoteName(finalNoteName)

            // Step 4: Create the note
            await this.newNoteAtRoot(providerName)
            this.dependencies.window.showInformationMessage(`Note created in ${providerName} provider: ${finalNoteName}`)

            return { created: true, notePath: finalNoteName, providerName }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Create note with validation failed: ${errorMessage}`)
        }
    }

    public async completeNoteWorkflow(
        operation: 'open' | 'create' | 'delete',
        noteItem?: INotesHubItem,
        providerName?: 'project' | 'remote' | 'global'
    ): Promise<{ success: boolean; operation: string; notePath?: string }> {
        try {
            // Step 1: Validate input parameters based on operation
            if (operation === 'open' || operation === 'delete') {
                this.validateNoteItem(noteItem)
                if (!noteItem) {
                    this.dependencies.window.showWarningMessage(`No note item provided for ${operation} operation.`)
                    return { success: false, operation, notePath: undefined }
                }
            }

            if (operation === 'create') {
                this.validateProviderName(providerName)
                if (!providerName) {
                    this.dependencies.window.showWarningMessage('No provider selected for create operation.')
                    return { success: false, operation, notePath: undefined }
                }
            }

            // Step 2: Execute the appropriate operation
            let result: { success: boolean; notePath?: string }
            
            if (operation === 'open') {
                const openResult = await this.openNoteWithValidation(noteItem!)
                result = { success: openResult.opened, notePath: openResult.notePath }
            } else if (operation === 'create') {
                const createResult = await this.createNoteWithValidation(providerName!)
                result = { success: createResult.created, notePath: createResult.notePath }
            } else if (operation === 'delete') {
                await this.deleteItem(noteItem!)
                result = { success: true, notePath: noteItem!.filePath }
            } else {
                throw new Error(`Unknown operation: ${operation}`)
            }

            return { success: result.success, operation, notePath: result.notePath }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            throw new Error(`Complete note workflow failed: ${errorMessage}`)
        }
    }

    // Private validation methods
    private validateNoteItem(noteItem: INotesHubItem | undefined): void {
        if (!noteItem) {
            throw new Error(notesHubConstants.errorMessages.NO_NOTE_ITEM)
        }
        if (!noteItem.filePath) {
            throw new Error(notesHubConstants.errorMessages.INVALID_NOTE_ITEM)
        }
    }

    private validateProviderName(providerName: 'project' | 'remote' | 'global' | undefined): void {
        if (!providerName) {
            throw new Error(notesHubConstants.errorMessages.NO_PROVIDER_SELECTED)
        }
        if (!['project', 'remote', 'global'].includes(providerName)) {
            throw new Error(notesHubConstants.errorMessages.INVALID_PROVIDER_NAME)
        }
    }

    private validateNoteName(noteName: string): void {
        if (!noteName || !noteName.trim()) {
            throw new Error(notesHubConstants.errorMessages.MISSING_REQUIRED_PARAMETER)
        }
        if (noteName.trim().length < 1) {
            throw new Error(notesHubConstants.errorMessages.INVALID_INPUT)
        }
    }
}
