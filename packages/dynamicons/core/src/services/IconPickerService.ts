import type { IQuickPick, ICoreQuickPickItem } from '../_interfaces/IQuickPick.js'
import type { IWindow } from '../_interfaces/IWindow.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'
import type { ICommonUtils } from '../_interfaces/ICommonUtils.js'
import type { IIconDiscoveryService } from './IconDiscoveryService.js'
import type { IConfigurationService } from './ConfigurationService.js'
import type { IUriFactory } from '../_interfaces/IUri.js'
import { dynamiconsConstants } from '../_config/dynamicons.constants.js'

// QuickPickItemKind values - these should match VSCode's QuickPickItemKind enum
const QuickPickItemKind = {
	Separator: -1,
	Default: 0,
} as const

type DataOrSeparator<T extends ICoreQuickPickItem> = T | {
	label: string
	kind: typeof QuickPickItemKind.Separator
}

export interface IIconPickerService {
	showAvailableIconsQuickPick: (
		assignableToType?: 'file' | 'folder',
		currentFilter?: (iconName: string) => boolean,
	) => Promise<string | undefined>
}

export class IconPickerService implements IIconPickerService {

	constructor(
		private readonly window: IWindow,
		private readonly quickPick: IQuickPick,
		private readonly fileSystem: IFileSystem,
		private readonly commonUtils: ICommonUtils,
		private readonly iconDiscovery: IIconDiscoveryService,
		private readonly configService: IConfigurationService,
		private readonly uriFactory: IUriFactory,
	) {}

	public async showAvailableIconsQuickPick(
		assignableToType?: 'file' | 'folder',
		currentFilter?: (iconName: string) => boolean,
	): Promise<string | undefined> {
		console.log(`[IconPickerService] showAvailableIconsQuickPick - Starting`)
		console.log(`[IconPickerService] showAvailableIconsQuickPick - assignableToType:`, assignableToType)
		
		const { fileIconsDir, folderIconsDir } = await this.iconDiscovery.getBuiltInIconDirectories()

		console.log(`[IconPickerService] showAvailableIconsQuickPick - Icon directories:`, { fileIconsDir, folderIconsDir })

		const userIconsDirSetting = await this.configService.getUserIconsDirectory()

		console.log(`[IconPickerService] showAvailableIconsQuickPick - User icons dir setting:`, userIconsDirSetting)

		let fileIconOptions: ICoreQuickPickItem[] = []
		let folderIconOptions: ICoreQuickPickItem[] = []
		let userIconOptions: ICoreQuickPickItem[] = []

		if (assignableToType === 'file' || !assignableToType) {
			console.log(`[IconPickerService] showAvailableIconsQuickPick - Loading file icons...`)
			fileIconOptions = await this.iconDiscovery.getIconOptionsFromDirectory(fileIconsDir, 'file')
			console.log(`[IconPickerService] showAvailableIconsQuickPick - File icons loaded:`, fileIconOptions.length)
		}
		if (assignableToType === 'folder' || !assignableToType) {
			console.log(`[IconPickerService] showAvailableIconsQuickPick - Loading folder icons...`)

			const folderFilter = (name: string) => !name.endsWith(`${dynamiconsConstants.defaults.openFolderIconSuffix}.svg`)

			folderIconOptions = await this.iconDiscovery.getIconOptionsFromDirectory(folderIconsDir, 'folder', folderFilter)
			console.log(`[IconPickerService] showAvailableIconsQuickPick - Folder icons loaded:`, folderIconOptions.length)
		}

		if (userIconsDirSetting) {
			try {
				await this.fileSystem.access(this.uriFactory.file(userIconsDirSetting))
				console.log(`[IconPickerService] showAvailableIconsQuickPick - Loading user icons...`)
				userIconOptions = await this.iconDiscovery.getIconOptionsFromDirectory(userIconsDirSetting, 'user')
				console.log(`[IconPickerService] showAvailableIconsQuickPick - User icons loaded:`, userIconOptions.length)
			}
			catch (error: any) {
				if (error.code === 'ENOENT') {
					this.window.showWarningMessage(`User icons directory not found: ${userIconsDirSetting}. Please check the '${dynamiconsConstants.configPrefix}.${dynamiconsConstants.configKeys.userIconsDirectory}' setting.`)
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

		console.log(`[IconPickerService] showAvailableIconsQuickPick - After filtering:`, { fileIconOptions: fileIconOptions.length, folderIconOptions: folderIconOptions.length, userIconOptions: userIconOptions.length })

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

		console.log(`[IconPickerService] showAvailableIconsQuickPick - Combined options:`, combinedIconOptions.length)

		const dataItems = combinedIconOptions.filter(item => 'iconNameInDefinitions' in item) as ICoreQuickPickItem[]

		console.log(`[IconPickerService] showAvailableIconsQuickPick - Data items:`, dataItems.length)

		if (dataItems.length === 0) {
			console.log(`[IconPickerService] showAvailableIconsQuickPick - No items found, showing message`)
			this.window.showInformationMessage('No available icons match the criteria.')
			return undefined
		}

		console.log(`[IconPickerService] showAvailableIconsQuickPick - Showing quick pick with`, dataItems.length, `items`)
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

}
