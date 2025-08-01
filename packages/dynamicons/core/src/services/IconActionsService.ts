// ESLint & Imports -->>

import type { Uri as VsCodeUri } from 'vscode'
import { QuickPickItemKind } from 'vscode'
import { dynamiconsConstants } from '../_config/dynamicons.constants.js'
import type { IIconActionsService } from '../_interfaces/IIconActionsService.js'
import type { IWindow } from '../_interfaces/IWindow.js'
import type { ICommands } from '../_interfaces/ICommands.js'
import type { IWorkspace } from '../_interfaces/IWorkspace.js'
import type { IPath } from '../_interfaces/IPath.js'
import type { IQuickPick } from '../_interfaces/IQuickPick.js'
import type { ICommonUtils } from '../_interfaces/ICommonUtils.js'
import type { IContext } from '../_interfaces/IContext.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'
import type { IIconThemeGeneratorService } from '../_interfaces/IIconThemeGeneratorService.js'
import type { ICoreQuickPickItem } from '../_interfaces/ICoreQuickPickItem.js'

//--------------------------------------------------------------------------------------------------------------<<

type IconAssociationType = 'file' | 'folder' | 'language'
type DataOrSeparator<T extends ICoreQuickPickItem> = | T | (
	{ label: string, kind: typeof QuickPickItemKind.Separator }
)

export class IconActionsService implements IIconActionsService {

	private readonly EXTENSION_CONFIG_PREFIX = dynamiconsConstants.configPrefix
	private readonly CUSTOM_MAPPINGS_KEY = dynamiconsConstants.configKeys.customIconMappings
	private readonly HIDE_ARROWS_KEY = dynamiconsConstants.configKeys.hideExplorerArrows
	private readonly USER_ICONS_DIR_KEY = dynamiconsConstants.configKeys.userIconsDirectory
	private readonly BUILT_IN_FILE_ICONS_REL_PATH = 'assets/icons/file_icons'
	private readonly BUILT_IN_FOLDER_ICONS_REL_PATH = 'assets/icons/folder_icons'

	constructor(
		private readonly context: IContext,
		private readonly window: IWindow,
		private readonly commands: ICommands,
		private readonly workspace: IWorkspace,
		private readonly path: IPath,
		private readonly quickPick: IQuickPick,
		private readonly commonUtils: ICommonUtils,
		private readonly fileSystem: IFileSystem,
		private readonly iconThemeGenerator: IIconThemeGeneratorService,
	) {}

	private async getResourceName(
		resourceUri: VsCodeUri,
	): Promise<string | undefined> {
		try {
			const stat = await this.fileSystem.stat(resourceUri.fsPath)

			if (stat.isDirectory()) {
				return this.path.basename(resourceUri.fsPath)
			}
			else if (stat.isFile()) {
				return this.path.basename(resourceUri.fsPath)
			}
		}
		catch (error) {
			this.commonUtils.errMsg(`Error getting resource stats for ${resourceUri.fsPath}`, error)
		}
		return undefined
	}

	private async getAssociationKey(
		name: string,
		type: IconAssociationType,
	): Promise<string> {
		const prefix = dynamiconsConstants.associationKeyPrefixes[type]

		return `${prefix}${name}`
	}

	private async getBaseThemePath(): Promise<string> {
		return this.path.join(this.context.extensionPath, 'assets', 'themes', 'base.theme.json')
	}

	private async getGeneratedThemeDir(): Promise<string> {
		return this.path.join(this.context.extensionPath, 'assets', 'themes')
	}

	private async getUserIconsDir(): Promise<string | undefined> {
		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX)

		return config.get<string>(this.USER_ICONS_DIR_KEY) || undefined
	}

	private async getCustomMappings(): Promise<Record<string, string> | undefined> {
		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX)
		const mappings = config.get<Record<string, string>>(this.CUSTOM_MAPPINGS_KEY) || undefined
		
		return mappings
	}

	private async getHideArrowsSetting(): Promise<boolean | null | undefined> {
		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX)

		return config.get<boolean | null>(this.HIDE_ARROWS_KEY)
	}

	private async updateCustomIconMappings(
		updateFn: (
			mappings: Record<string, string>
		) => Promise<boolean | Record<string, string>>,
	): Promise<void> {
		console.log(`[IconActionsService] updateCustomIconMappings - Starting`)

		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX)
		const originalMappingsFromConfig = config.get<Record<string, string>>(this.CUSTOM_MAPPINGS_KEY) || {}

		console.log(`[IconActionsService] updateCustomIconMappings - Original mappings:`, JSON.stringify(originalMappingsFromConfig, null, 2))
		
		const mutableMappingsCopy = { ...originalMappingsFromConfig }

		const newMappingsResult = await updateFn(mutableMappingsCopy)

		if (typeof newMappingsResult === 'boolean' && !newMappingsResult) {
			console.log(`[IconActionsService] updateCustomIconMappings - Update function returned false, aborting`)
			return
		}

		const finalMappings = typeof newMappingsResult === 'boolean' ? mutableMappingsCopy : newMappingsResult

		console.log(`[IconActionsService] updateCustomIconMappings - Final mappings:`, JSON.stringify(finalMappings, null, 2))

		if (JSON.stringify(originalMappingsFromConfig) !== JSON.stringify(finalMappings)) {
			console.log(`[IconActionsService] updateCustomIconMappings - Mappings changed, updating config...`)
			try {
				await config.update(this.CUSTOM_MAPPINGS_KEY, finalMappings, true) // true for global
				console.log(`[IconActionsService] updateCustomIconMappings - Config updated successfully`)
			}
			catch (error: any) {
				console.log(`[IconActionsService] updateCustomIconMappings - Config update failed:`, error)
				await this.window.showTimedInformationMessage(`Failed to update icon mappings: ${error.message || 'Unknown error'}`)
			}
		}
		else {
			console.log(`[IconActionsService] updateCustomIconMappings - No changes detected, skipping config update`)
		}
		console.log(`[IconActionsService] updateCustomIconMappings - Completed`)
	}

	private async getIconOptionsFromDirectory(
		directoryPath: string,
		iconKind: 'file' | 'folder' | 'user',
		filter?: (filename: string) => boolean,
	): Promise<ICoreQuickPickItem[]> {
		const iconOptions: ICoreQuickPickItem[] = []

		try {
			const entries = await this.fileSystem.readdir(directoryPath, { withFileTypes: true }) as import('fs').Dirent[]

			for (const entry of entries) {
				if (entry.isFile() && entry.name.endsWith('.svg') && (!filter || filter(entry.name))) {
					const iconNameWithoutExt = this.path.parse(entry.name).name
					let iconDefinitionKey: string

					if (iconKind === 'user') {
						iconDefinitionKey = `${dynamiconsConstants.defaults.userIconDefinitionPrefix}${iconNameWithoutExt}`
					}
					else {
						iconDefinitionKey = `_${iconNameWithoutExt}`
					}

					iconOptions.push({
						label: iconNameWithoutExt.replace(/^folder-/, '').replace(new RegExp(`${dynamiconsConstants.defaults.openFolderIconSuffix}$`), ''),
						description: `(${iconKind}) ${entry.name}`,
						iconPath: this.path.join(directoryPath, entry.name),
						iconNameInDefinitions: iconDefinitionKey,
					})
				}
			}
		}
		catch (error: any) {
			if (error.code !== 'ENOENT') {
				this.commonUtils.errMsg(`Error reading icon directory ${directoryPath}`, error)
			}
		}
		return iconOptions.sort((a, b) => a.label.localeCompare(b.label))
	}

	public async showAvailableIconsQuickPick(
		assignableToType?: 'file' | 'folder',
		currentFilter?: (iconName: string) => boolean,
	): Promise<string | undefined> {
		console.log(`[IconActionsService] showAvailableIconsQuickPick - Starting`)
		console.log(`[IconActionsService] showAvailableIconsQuickPick - assignableToType:`, assignableToType)
		
		const builtInFileIconsDir = this.path.join(
			this.context.extensionPath,
			this.BUILT_IN_FILE_ICONS_REL_PATH,
		)
		const builtInFolderIconsDir = this.path.join(
			this.context.extensionPath,
			this.BUILT_IN_FOLDER_ICONS_REL_PATH,
		)

		console.log(`[IconActionsService] showAvailableIconsQuickPick - Icon directories:`, { builtInFileIconsDir, builtInFolderIconsDir })

		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX)
		const userIconsDirSetting = config.get<string>(this.USER_ICONS_DIR_KEY)

		console.log(`[IconActionsService] showAvailableIconsQuickPick - User icons dir setting:`, userIconsDirSetting)

		let fileIconOptions: ICoreQuickPickItem[] = []
		let folderIconOptions: ICoreQuickPickItem[] = []
		let userIconOptions: ICoreQuickPickItem[] = []

		if (assignableToType === 'file' || !assignableToType) {
			console.log(`[IconActionsService] showAvailableIconsQuickPick - Loading file icons...`)
			fileIconOptions = await this.getIconOptionsFromDirectory(builtInFileIconsDir, 'file')
			console.log(`[IconActionsService] showAvailableIconsQuickPick - File icons loaded:`, fileIconOptions.length)
		}
		if (assignableToType === 'folder' || !assignableToType) {
			console.log(`[IconActionsService] showAvailableIconsQuickPick - Loading folder icons...`)

			const folderFilter = (name: string) => !name.endsWith(`${dynamiconsConstants.defaults.openFolderIconSuffix}.svg`)

			folderIconOptions = await this.getIconOptionsFromDirectory(builtInFolderIconsDir, 'folder', folderFilter)
			console.log(`[IconActionsService] showAvailableIconsQuickPick - Folder icons loaded:`, folderIconOptions.length)
		}

		if (userIconsDirSetting) {
			try {
				await this.fileSystem.stat(userIconsDirSetting)
				console.log(`[IconActionsService] showAvailableIconsQuickPick - Loading user icons...`)
				userIconOptions = await this.getIconOptionsFromDirectory(userIconsDirSetting, 'user')
				console.log(`[IconActionsService] showAvailableIconsQuickPick - User icons loaded:`, userIconOptions.length)
			}
			catch (error: any) {
				if (error.code === 'ENOENT') {
					this.window.showWarningMessage(`User icons directory not found: ${userIconsDirSetting}. Please check the '${this.EXTENSION_CONFIG_PREFIX}.${this.USER_ICONS_DIR_KEY}' setting.`)
				}
				else {
					this.commonUtils.errMsg(`Error accessing user icons directory: ${userIconsDirSetting}`, error)
				}
			}
		}

		const filterFn = currentFilter || (() => true)

		fileIconOptions = fileIconOptions.filter(item => filterFn(item.iconNameInDefinitions))
		folderIconOptions = folderIconOptions.filter(item => filterFn(item.iconNameInDefinitions))
		userIconOptions = userIconOptions.filter(item => filterFn(item.iconNameInDefinitions))

		console.log(`[IconActionsService] showAvailableIconsQuickPick - After filtering:`, { fileIconOptions: fileIconOptions.length, folderIconOptions: folderIconOptions.length, userIconOptions: userIconOptions.length })

		const combinedIconOptions: DataOrSeparator<ICoreQuickPickItem>[] = []

		if (userIconOptions.length > 0) {
			combinedIconOptions.push({ label: 'User Icons', kind: QuickPickItemKind.Separator })
			combinedIconOptions.push(...userIconOptions)
		}
		if (fileIconOptions.length > 0) {
			combinedIconOptions.push({ label: 'File Icons (Built-in)', kind: QuickPickItemKind.Separator })
			combinedIconOptions.push(...fileIconOptions)
		}
		if (folderIconOptions.length > 0) {
			combinedIconOptions.push({ label: 'Folder Icons (Built-in)', kind: QuickPickItemKind.Separator })
			combinedIconOptions.push(...folderIconOptions)
		}

		console.log(`[IconActionsService] showAvailableIconsQuickPick - Combined options:`, combinedIconOptions.length)

		const dataItems = combinedIconOptions.filter(item => 'iconNameInDefinitions' in item) as ICoreQuickPickItem[]

		console.log(`[IconActionsService] showAvailableIconsQuickPick - Data items:`, dataItems.length)

		if (dataItems.length === 0) {
			console.log(`[IconActionsService] showAvailableIconsQuickPick - No items found, showing message`)
			this.window.showInformationMessage('No available icons match the criteria.')
			return undefined
		}

		console.log(`[IconActionsService] showAvailableIconsQuickPick - Showing quick pick with`, dataItems.length, `items`)
		return this.quickPick.showQuickPickSingle<ICoreQuickPickItem, 'iconNameInDefinitions'>(
			dataItems,
			{
				placeHolder: 'Select an icon definition',
				matchOnDescription: true,
				matchOnDetail: true,
			},
			'iconNameInDefinitions',
		)
	}

	public async assignIconToResource(
		resourceUris: VsCodeUri[],
		iconTypeScope?: IconAssociationType,
	): Promise<void> {
		if (!resourceUris || resourceUris.length === 0) {
			this.window.showWarningMessage('No file or folder selected.')
			return
		}

		let isFileMode = false
		let isFolderMode = false
		const resourceStats = await Promise.all(resourceUris.map(async (uri) => {
			try {
				return { uri, stat: await this.fileSystem.stat(uri.fsPath) }
			}
			catch (error) {
				this.commonUtils.errMsg(`Could not get stats for ${uri.fsPath}`, error)
				return { uri, stat: null }
			}
		}))

		for (const { stat } of resourceStats) {
			if (!stat)
				continue
			if (stat.isFile())
				isFileMode = true
			if (stat.isDirectory())
				isFolderMode = true
		}

		if (isFileMode && isFolderMode) {
			this.window.showErrorMessage('Cannot assign icons to a mix of files and folders.')
			return
		}
		if (!isFileMode && !isFolderMode) {
			this.window.showErrorMessage('Could not determine the type of the selected resources.')
			return
		}

		const typeToAssign = isFileMode ? 'file' : 'folder'

		if (iconTypeScope && iconTypeScope !== typeToAssign) {
			this.window.showWarningMessage(`Selection type (${typeToAssign}) does not match the required scope (${iconTypeScope}).`)
			return
		}

		const iconNameKey = await this.showAvailableIconsQuickPick(typeToAssign)

		if (!iconNameKey)
			return

		const resourceNames = resourceStats.filter(rs => rs.stat !== null).map(rs => this.path.basename(rs.uri.fsPath))

		if (resourceNames.length === 0) {
			this.window.showErrorMessage('Could not determine the names of the selected resources.')
			return
		}

		console.log(`[IconActionsService] Assigning ${iconNameKey} to ${resourceNames.length} ${typeToAssign}${resourceNames.length > 1 ? 's' : ''}: ${resourceNames.join(', ')}`)

		// Get current settings for comparison
		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX)
		const beforeMappings = config.get<Record<string, string>>(this.CUSTOM_MAPPINGS_KEY) || {}

		await this.updateCustomIconMappings(async (mappings) => {
			for (const resourceName of resourceNames) {
				const associationKey = await this.getAssociationKey(resourceName, typeToAssign)
				mappings[associationKey] = iconNameKey
			}
			return mappings
		})

		// Get updated settings for comparison
		const afterMappings = config.get<Record<string, string>>(this.CUSTOM_MAPPINGS_KEY) || {}

		// Show only the specific items that were changed
		console.log(`[IconActionsService] === ASSIGNMENT SUMMARY ===`)
		for (const resourceName of resourceNames) {
			const associationKey = await this.getAssociationKey(resourceName, typeToAssign)
			const beforeValue = beforeMappings[associationKey] || 'NO ASSIGNMENT'
			const afterValue = afterMappings[associationKey] || 'NO ASSIGNMENT'
			
			console.log(`[IconActionsService] ${resourceName}: ${beforeValue} → ${afterValue}`)
		}
		console.log(`[IconActionsService] === END ASSIGNMENT ===`)
		
		await this.window.showTimedInformationMessage(`Icon assigned successfully. Theme will update automatically.`)
	}

	public async revertIconAssignment(resourceUris: VsCodeUri[]): Promise<void> {
		if (!resourceUris || resourceUris.length === 0) {
			this.window.showWarningMessage('No file or folder selected.')
			return
		}

		let isFileMode = false
		let isFolderMode = false
		const resourceStats = await Promise.all(resourceUris.map(async (uri) => {
			try {
				return { uri, stat: await this.fileSystem.stat(uri.fsPath) }
			}
			catch (error) {
				this.commonUtils.errMsg(`Could not get stats for ${uri.fsPath}`, error)
				return { uri, stat: null }
			}
		}))

		for (const { stat } of resourceStats) {
			if (!stat)
				continue
			if (stat.isFile())
				isFileMode = true
			if (stat.isDirectory())
				isFolderMode = true
		}

		if (isFileMode && isFolderMode) {
			this.window.showErrorMessage('Cannot revert icons for a mix of files and folders.')
			return
		}

		const resourceNames = resourceStats.filter(rs => rs.stat !== null).map(rs => this.path.basename(rs.uri.fsPath))

		if (resourceNames.length === 0) {
			this.window.showErrorMessage('Could not determine the names of the selected resources.')
			return
		}

		await this.updateCustomIconMappings(async (mappings) => {
			let anyFound = false
			const typeToRevert: IconAssociationType = isFileMode ? 'file' : 'folder'

			for (const resourceName of resourceNames) {
				const associationKey = await this.getAssociationKey(resourceName, typeToRevert)

				if (Object.prototype.hasOwnProperty.call(mappings, associationKey)) {
					delete mappings[associationKey]
					anyFound = true
				}
			}
			if (anyFound) {
				return mappings
			}
			else {
				this.window.showInformationMessage('No custom icon assignments found for the selected items.')
				return false
			}
		})
	}

	public async toggleExplorerArrows(): Promise<void> {
		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX)
		const currentSetting = config.get<boolean | null>(this.HIDE_ARROWS_KEY)
		const newSetting = (currentSetting === null || currentSetting === undefined) ? true : !currentSetting

		await config.update(this.HIDE_ARROWS_KEY, newSetting, true) // true for global
	}

	public async showUserIconAssignments(_type: 'file' | 'folder' | 'language'): Promise<void> {
		await this.commands.executeCommand('workbench.action.openSettings', 'dynamicons.customIconMappings')
	}

	public async refreshIconTheme(): Promise<void> {
		console.log('[IconActionsService] refreshIconTheme() called. Actual refresh handled by extension command/event.')
	}

}
