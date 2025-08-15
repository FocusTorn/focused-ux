//= IMPLEMENTATION TYPES ======================================================================================
import type { IWindow, IWorkspace, ICommands, ICommonUtilsService, IPathUtilsService, IFrontmatterUtilsService, IExtensionContext, IUri, IFileType, IStorageService, IEnv } from '@fux/shared'
import type { INotesHubActionService } from '../_interfaces/INotesHubActionService.js'
import type { INotesHubItem } from '../_interfaces/INotesHubItem.js'
import type { INotesHubProviderManager } from '../_interfaces/INotesHubProviderManager.js'

import { Buffer } from 'node:buffer'
import type * as nodePath from 'node:path'
import type * as fspAccessType from 'node:fs/promises'
import type * as fspRenameType from 'node:fs/promises'
import { notesHubConstants } from '../_config/constants.js'
import { NotesHubItem } from '../models/NotesHubItem.js'
import { constants as fsConstants } from 'node:fs'

//--------------------------------------------------------------------------------------------------------------<<

const ALLOWED_EXTENSIONS_NOTES_HUB = ['.md', '.txt', '.txte']

export class NotesHubActionService implements INotesHubActionService {

	constructor(
		private readonly iContext: IExtensionContext,
		private readonly iCommands: ICommands,
		private readonly iWindow: IWindow,
		private readonly iWorkspace: IWorkspace,
		private readonly iEnv: IEnv,
		private readonly iCommonUtils: ICommonUtilsService,
		private readonly iFrontmatterUtils: IFrontmatterUtilsService,
		private readonly iPathUtils: IPathUtilsService,
		private readonly iStorage: IStorageService,
		private readonly iProviderManager: INotesHubProviderManager,
		private readonly iPathJoin: typeof nodePath.join,
		private readonly iPathDirname: typeof nodePath.dirname,
		private readonly iPathBasename: typeof nodePath.basename,
		private readonly iPathParse: typeof nodePath.parse,
		private readonly iPathExtname: typeof nodePath.extname,
		private readonly iFspAccess: typeof fspAccessType.access,
		private readonly iFspRename: typeof fspRenameType.rename,
		private readonly iFileTypeEnum: IFileType,
		private readonly treeItemAdapter: any,
		private readonly themeIconAdapter: any,
		private readonly themeColorAdapter: any,
		private readonly uriAdapter: any,
		private readonly treeItemCollapsibleStateAdapter: any,
	) {}

	public async openNote( //>
		noteItem: INotesHubItem,
	): Promise<void> {
		if (!noteItem?.resourceUri) {
			this.iCommonUtils.errMsg('Could not open note: Invalid resource URI.')
			return
		}
		try {
			const doc = await this.iWorkspace.openTextDocument(noteItem.resourceUri)

			await this.iWindow.showTextDocument(doc)
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to open note: ${typeof noteItem.label === 'string' ? noteItem.label : noteItem.label?.label}`, error)
		}
	} //<

	public async renameItem( //>
		item: INotesHubItem,
	): Promise<void> {
		const oldUri = item?.resourceUri

		if (!oldUri) {
			this.iCommonUtils.errMsg('Cannot rename item: Invalid URI.')
			return
		}

		const oldFilePath = oldUri.fsPath
		const oldName = this.iPathBasename(oldFilePath)

		const newNameWithExt = await this.iWindow.showInputBox({
			prompt: 'Enter the new name (extension will be preserved if not specified)',
			value: oldName,
		})

		if (!newNameWithExt)
			return

		const oldExt = this.iPathExtname(oldName)
		let newName = newNameWithExt
		let newExt = this.iPathExtname(newNameWithExt)

		if (!newExt && oldExt) {
			newExt = oldExt
		}
		else if (newExt) {
			newName = this.iPathParse(newNameWithExt).name
		}

		const finalNewName = newExt ? `${newName}${newExt}` : newName
		const sanitizedFileName = finalNewName ? this.iPathUtils.sanitizePath(finalNewName) : ''
		const newPath = this.iPathJoin(this.iPathDirname(oldFilePath), sanitizedFileName)
		const newUri = this.uriAdapter.file(newPath)

		if (oldUri.toString() === newUri.toString())
			return

		try {
			await this.iWorkspace.fs.rename(
				oldUri,
				(newUri as any).uri,
				{ overwrite: false },
			)

			const provider = await this.iProviderManager.getProviderForNote(item)

			provider?.refresh()
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to rename item '${oldName}'`, error)
		}
	} //<

	public async addFrontmatter( //>
		noteItem: INotesHubItem,
	): Promise<void> {
		if (!noteItem?.resourceUri || noteItem.isDirectory) {
			this.iCommonUtils.errMsg('Cannot add frontmatter: Invalid item or not a file.')
			return
		}

		try {
			const fileContentBuffer = await this.iWorkspace.fs.readFile(noteItem.resourceUri)
			const fileContent = Buffer.from(fileContentBuffer).toString('utf-8')

			if (this.iFrontmatterUtils.getFrontmatter_validateFrontmatter(fileContent)) {
				this.iWindow.showInformationMessage('Frontmatter already exists in this note.')
				return
			}

			const newFrontmatter = `---\nPriority: \nCodicon: \nDesc: \n---\n\n${fileContent}`

			await this.iWorkspace.fs.writeFile(noteItem.resourceUri, Buffer.from(newFrontmatter, 'utf-8'))
			this.iWindow.showInformationMessage('Frontmatter added successfully.')

			const provider = await this.iProviderManager.getProviderForNote(noteItem)

			provider?.refresh()
		}
		catch (error) {
			this.iCommonUtils.errMsg('Error adding frontmatter', error)
		}
	} //<

	public async openNotePreview( //>
		noteItem: INotesHubItem,
	): Promise<void> {
		if (!noteItem?.resourceUri || noteItem.isDirectory) {
			this.iCommonUtils.errMsg('Cannot open preview: Invalid item or not a file.')
			return
		}
		try {
			await this.iCommands.executeCommand('markdown.showPreviewToSide', noteItem.resourceUri)
		}
		catch (error) {
			this.iCommonUtils.errMsg('Failed to open note preview.', error)
		}
	} //<

	public async deleteItem( //>
		item: INotesHubItem,
	): Promise<void> {
		const resourceUri = item?.resourceUri

		if (!resourceUri) {
			this.iCommonUtils.errMsg('Could not delete item: Invalid resource URI.')
			return
		}

		const itemName = typeof item.label === 'string' ? item.label : item.label?.label || this.iPathBasename(resourceUri.fsPath)
		const confirm = await this.confirmAction(`Are you sure you want to delete '${itemName}'?`, 'Delete')

		if (!confirm)
			return

		try {
			await this.iWorkspace.fs.delete(resourceUri, { recursive: true, useTrash: true })

			const provider = await this.iProviderManager.getProviderForNote(item)

			provider?.refresh()
			this.iWindow.showInformationMessage(`Item '${itemName}' moved to trash.`)
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to delete item '${itemName}'`, error)
		}
	} //<

	public async copyItem( //>
		item: INotesHubItem,
	): Promise<void> {
		if (!item?.resourceUri) {
			this.iCommonUtils.errMsg('Cannot copy item: Invalid item or URI.')
			return
		}
		await this.iEnv.clipboard.writeText(item.resourceUri.toString())
		await this.iStorage.update(`${notesHubConstants.commands.openNote}.${notesHubConstants.storageKeys.OPERATION}`, 'copy')
		this.iCommands.executeCommand('setContext', `${notesHubConstants.commands.openNote}.${notesHubConstants.contextKeys.CAN_PASTE}`, true)
		this.iWindow.showInformationMessage(`'${item.fileName}' copied.`)
	} //<

	public async cutItem( //>
		item: INotesHubItem,
	): Promise<void> {
		if (!item?.resourceUri) {
			this.iCommonUtils.errMsg('Cannot cut item: Invalid item or URI.')
			return
		}
		await this.iEnv.clipboard.writeText(item.resourceUri.toString())
		await this.iStorage.update(`${notesHubConstants.commands.openNote}.${notesHubConstants.storageKeys.OPERATION}`, 'cut')
		this.iCommands.executeCommand('setContext', `${notesHubConstants.commands.openNote}.${notesHubConstants.contextKeys.CAN_PASTE}`, true)
		this.iWindow.showInformationMessage(`'${item.fileName}' cut.`)
	} //<

	public async pasteItem( //>
		targetFolderItem: INotesHubItem,
	): Promise<void> {
		if (!targetFolderItem?.isDirectory || !targetFolderItem.resourceUri) {
			this.iCommonUtils.errMsg('Cannot paste item: Target is not a valid folder.')
			return
		}

		const sourceUriString = await this.iEnv.clipboard.readText()

		if (!sourceUriString) {
			this.iCommonUtils.errMsg('Clipboard is empty or contains invalid data for paste.')
			return
		}

		let sourceUri: IUri

		try {
			sourceUri = this.uriAdapter.file(sourceUriString)
		}
		catch (error) {
			this.iCommonUtils.errMsg('Invalid URI on clipboard for paste operation.', error)
			return
		}

		const sourceItemName = this.iPathBasename(sourceUri.fsPath)
		const targetFolderPath = targetFolderItem.resourceUri.fsPath
		const targetItemPath = this.iPathJoin(targetFolderPath, sourceItemName)
		const targetItemUri = this.uriAdapter.file(targetItemPath ? this.iPathUtils.sanitizePath(targetItemPath) : targetItemPath)

		if (sourceUri.toString() === targetItemUri.toString())
			return

		if (await this.fileExists(targetItemUri.fsPath)) {
			const confirm = await this.confirmOverwrite(sourceItemName)

			if (!confirm)
				return
		}

		const operation = await this.iStorage.get<'copy' | 'cut'>(`${notesHubConstants.commands.openNote}.${notesHubConstants.storageKeys.OPERATION}`)
		const operationName = operation === 'cut' ? 'Moving' : 'Copying'

		try {
			await this.iWindow.withProgress(
				{ title: `${operationName} '${sourceItemName}'...`, cancellable: false },
				async () => {
					if (operation === 'cut') {
						await this.iFspRename(sourceUri.fsPath, targetItemUri.fsPath)
					}
					else {
						await this.iWorkspace.fs.copy(
							(sourceUri as any).uri,
							(targetItemUri as any).uri,
							{ overwrite: true },
						)
					}
				},
			)

			const targetProvider = await this.iProviderManager.getProviderForNote(targetFolderItem)

			targetProvider?.refresh()

			const sourceStats = await this.iWorkspace.fs.stat((sourceUri as any).uri)
			const sourceItemForProviderLookup = new NotesHubItem(
				this.iPathBasename(sourceUri.fsPath),
				sourceUri.fsPath,
				sourceStats.type === this.iFileTypeEnum.Directory,
				this.treeItemAdapter,
				this.themeIconAdapter,
				this.themeColorAdapter,
				this.uriAdapter,
				this.treeItemCollapsibleStateAdapter,
			)
			const sourceProvider = await this.iProviderManager.getProviderForNote(sourceItemForProviderLookup)

			if (sourceProvider && sourceProvider !== targetProvider) {
				sourceProvider.refresh()
			}

			if (operation === 'cut') {
				await this.iStorage.update(`${notesHubConstants.commands.openNote}.${notesHubConstants.storageKeys.OPERATION}`, undefined)
				await this.iEnv.clipboard.writeText('')
				this.iCommands.executeCommand('setContext', `${notesHubConstants.commands.openNote}.${notesHubConstants.contextKeys.CAN_PASTE}`, false)
			}
			this.iWindow.showInformationMessage(`Item '${sourceItemName}' ${operation === 'cut' ? 'moved' : 'copied'}.`)
		}
		catch (err) {
			this.iCommonUtils.errMsg(`Failed to ${operationName.toLowerCase()} item`, err)
		}
	} //<

	public async newNoteInFolder( //>
		targetFolderItem: INotesHubItem,
	): Promise<void> {
		console.log('[NotesHubAction] newNoteInFolder - ENTERED with targetFolderItem:', {
			fileName: targetFolderItem?.fileName,
			filePath: targetFolderItem?.filePath,
			isDirectory: targetFolderItem?.isDirectory,
			resourceUri: targetFolderItem?.resourceUri?.toString(),
		})
		
		if (!targetFolderItem?.isDirectory || !targetFolderItem.resourceUri) {
			console.log('[NotesHubAction] newNoteInFolder - validation failed, returning early')
			this.iCommonUtils.errMsg('This command can only be used on a valid folder.')
			return
		}

		console.log('[NotesHubAction] newNoteInFolder - validation passed, getting provider')

		const provider = await this.iProviderManager.getProviderForNote(targetFolderItem)

		if (!provider) {
			console.log('[NotesHubAction] newNoteInFolder - provider not found')
			this.iCommonUtils.errMsg('Could not determine provider for the target folder.')
			return
		}

		console.log('[NotesHubAction] newNoteInFolder - provider found, getting notesDir')

		const notesDir = targetFolderItem.filePath

		console.log('[NotesHubAction] newNoteInFolder - notesDir:', notesDir)
		console.log('[NotesHubAction] newNoteInFolder - notesDir type:', typeof notesDir)
		console.log('[NotesHubAction] newNoteInFolder - notesDir length:', notesDir?.length)
		console.log('[NotesHubAction] newNoteInFolder - notesDir trimmed:', notesDir?.trim())
		
		const result = await this.getNewFileNameWithExtension('NewNote')

		if (!result) {
			console.log('[NotesHubAction] newNoteInFolder - getNewFileNameWithExtension returned undefined')
			return
		}

		console.log('[NotesHubAction] newNoteInFolder - result:', result)

		const { newName, newExtension } = result
		const newNotePath = this.iPathJoin(notesDir, newName + newExtension)

		console.log('[NotesHubAction] newNoteInFolder - newNotePath:', newNotePath)

		try {
			console.log('[NotesHubAction] newNoteInFolder - calling UriAdapter.file with:', newNotePath)

			const newNoteUri = this.uriAdapter.file(newNotePath)

			console.log('[NotesHubAction] newNoteInFolder - UriAdapter.file succeeded, newNoteUri:', newNoteUri.toString())
			
			// Create the file with initial content before trying to open it
			const initialContent = `# ${newName}\n\n`

			await this.iWorkspace.fs.writeFile((newNoteUri as any).uri, Buffer.from(initialContent, 'utf-8'))
			
			console.log('[NotesHubAction] newNoteInFolder - file created successfully')
			
			provider.refresh()

			const doc = await this.iWorkspace.openTextDocument((newNoteUri as any).uri)

			await this.iWindow.showTextDocument(doc)

			const newItemForReveal = await provider.getNotesHubItem((newNoteUri as any).uri)

			if (newItemForReveal) {
				await this.iProviderManager.revealNotesHubItem(provider, newItemForReveal, true)
			}
		}
		catch (error) {
			console.error('[NotesHubAction] newNoteInFolder - error in file operations:', error)
			console.error('[NotesHubAction] newNoteInFolder - error type:', typeof error)
			console.error('[NotesHubAction] newNoteInFolder - error message:', (error as Error)?.message)
			console.error('[NotesHubAction] newNoteInFolder - error stack:', (error as Error)?.stack)
			this.iCommonUtils.errMsg('Failed to create new note', error)
		}
	} //<

	public async newFolderInFolder( //>
		targetFolderItem: INotesHubItem,
	): Promise<void> {
		if (!targetFolderItem?.isDirectory || !targetFolderItem.resourceUri) {
			this.iCommonUtils.errMsg('This command can only be used on a valid folder.')
			return
		}

		const provider = await this.iProviderManager.getProviderForNote(targetFolderItem)

		if (!provider) {
			this.iCommonUtils.errMsg('Could not determine provider for the target folder.')
			return
		}

		const newFolderName = await this.iWindow.showInputBox({ prompt: 'Enter the name of the new folder', value: 'NewFolder' })

		if (!newFolderName)
			return

		const targetFolderPath = targetFolderItem.filePath
		const sanitizedFolderName = newFolderName ? this.iPathUtils.sanitizePath(newFolderName) : ''
		const newFolderPath = this.iPathJoin(targetFolderPath, sanitizedFolderName)
		const newFolderUri = this.uriAdapter.file(newFolderPath)

		try {
			await this.iFspAccess(targetFolderPath, fsConstants.W_OK)
		}
		catch (error) {
			this.iCommonUtils.errMsg('Permission denied. Cannot create a folder in this directory.', error)
			return
		}

		try {
			// Pass the raw VSCode URI to workspace.fs.createDirectory
			await this.iWorkspace.fs.createDirectory((newFolderUri as any).uri)
			provider.refresh()

			const newItemForReveal = await provider.getNotesHubItem((newFolderUri as any).uri)

			if (newItemForReveal) {
				await this.iProviderManager.revealNotesHubItem(provider, newItemForReveal, true)
			}
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to create folder '${newFolderName}'`, error)
		}
	} //<

	public async newNoteAtRoot(providerName: 'project' | 'remote' | 'global'): Promise<void> { //>
		console.log('[NotesHubAction] newNoteAtRoot - called with providerName:', providerName)
		
		const provider = this.iProviderManager.getProviderInstance(providerName)

		if (!provider) {
			console.error('[NotesHubAction] newNoteAtRoot - provider not found:', providerName)
			this.iCommonUtils.errMsg(`Notes Hub provider '${providerName}' is not enabled or available.`)
			return
		}

		console.log('[NotesHubAction] newNoteAtRoot - provider found, notesDir:', provider.notesDir)
		console.log('[NotesHubAction] newNoteAtRoot - provider.notesDir type:', typeof provider.notesDir)
		console.log('[NotesHubAction] newNoteAtRoot - provider.notesDir length:', provider.notesDir?.length)
		console.log('[NotesHubAction] newNoteAtRoot - provider.notesDir trimmed:', provider.notesDir?.trim())
		
		console.log('[NotesHubAction] newNoteAtRoot - about to create NotesHubItem with:', {
			fileName: this.iPathBasename(provider.notesDir),
			filePath: provider.notesDir,
			isDirectory: true,
		})
		
		const rootItem = new NotesHubItem(
			this.iPathBasename(provider.notesDir),
			provider.notesDir,
			true,
			this.treeItemAdapter,
			this.themeIconAdapter,
			this.themeColorAdapter,
			this.uriAdapter,
			this.treeItemCollapsibleStateAdapter,
		)

		console.log('[NotesHubAction] newNoteAtRoot - rootItem created:', {
			fileName: rootItem.fileName,
			filePath: rootItem.filePath,
			isDirectory: rootItem.isDirectory,
			resourceUri: rootItem.resourceUri?.toString(),
		})

		console.log('[NotesHubAction] newNoteAtRoot - about to call newNoteInFolder with rootItem')
		try {
			await this.newNoteInFolder(rootItem)
			console.log('[NotesHubAction] newNoteAtRoot - newNoteInFolder completed successfully')
		}
		catch (error) {
			console.error('[NotesHubAction] newNoteAtRoot - newNoteInFolder failed with error:', error)
			console.error('[NotesHubAction] newNoteAtRoot - error type:', typeof error)
			console.error('[NotesHubAction] newNoteAtRoot - error message:', (error as Error)?.message)
			console.error('[NotesHubAction] newNoteAtRoot - error stack:', (error as Error)?.stack)
			throw error
		}
	} //<

	public async newFolderAtRoot(providerName: 'project' | 'remote' | 'global'): Promise<void> { //>
		const provider = this.iProviderManager.getProviderInstance(providerName)

		if (!provider) {
			this.iCommonUtils.errMsg(`Notes Hub provider '${providerName}' is not enabled or available.`)
			return
		}

		const rootItem = new NotesHubItem(
			this.iPathBasename(provider.notesDir),
			provider.notesDir,
			true,
			this.treeItemAdapter,
			this.themeIconAdapter,
			this.themeColorAdapter,
			this.uriAdapter,
			this.treeItemCollapsibleStateAdapter,
		)

		await this.newFolderInFolder(rootItem)
	} //<

	private async confirmAction(message: string, confirmActionTitle: string = 'Confirm'): Promise<boolean> { //>
		const result = await this.iWindow.showWarningMessage(message, { modal: true }, confirmActionTitle, 'Cancel')

		return result === confirmActionTitle
	} //<

	private async confirmOverwrite(itemName: string): Promise<boolean> { //>
		return this.confirmAction(`'${itemName}' already exists. Overwrite?`, 'Overwrite')
	} //<

	private async getNewFileNameWithExtension( //>
		promptValue: string = 'NewNote',
		prompt: string = 'Enter the new name (extension will be added if missing):',
		defaultExtension: string = '.md',
	): Promise<{ newName: string, newExtension: string } | undefined> {
		console.log('[NotesHubAction] getNewFileNameWithExtension - ENTERED with:', { promptValue, prompt, defaultExtension })
		
		let newFileNameWithExt: string | undefined
		let newFileName: string
		let fileExtension: string

		while (true) {
			console.log('[NotesHubAction] getNewFileNameWithExtension - showing input box')
			newFileNameWithExt = await this.iWindow.showInputBox({
				prompt: `${prompt} Allowed: ${ALLOWED_EXTENSIONS_NOTES_HUB.join(', ')}`,
				value: promptValue,
			})
			console.log('[NotesHubAction] getNewFileNameWithExtension - input box result:', newFileNameWithExt)

			if (!newFileNameWithExt) {
				console.log('[NotesHubAction] getNewFileNameWithExtension - no input, returning undefined')
				return undefined
			}

			const parsedPath = this.iPathParse(newFileNameWithExt)

			newFileName = parsedPath.name
			fileExtension = parsedPath.ext.toLowerCase()

			if (fileExtension && ALLOWED_EXTENSIONS_NOTES_HUB.includes(fileExtension)) {
				break
			}
			else if (!fileExtension) {
				newFileName = newFileNameWithExt
				fileExtension = defaultExtension
				break
			}
			else {
				this.iWindow.showErrorMessage(`Invalid extension: '${fileExtension}'. Allowed: ${ALLOWED_EXTENSIONS_NOTES_HUB.join(', ')}`)
				promptValue = newFileName
			}
		}
		return { newName: newFileName, newExtension: fileExtension }
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

			await this.iFspAccess(sanitizedPath, fsConstants.F_OK)
			return true
		}
		catch {
			return false
		}
	} //<

}
