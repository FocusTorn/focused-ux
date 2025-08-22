import type { IFileSystem } from '../_interfaces/IFileSystem.js'
import type { IPath } from '../_interfaces/IPath.js'
import type { ICommonUtils } from '../_interfaces/ICommonUtils.js'
import type { ICoreQuickPickItem } from '../_interfaces/ICoreQuickPickItem.js'
import { Uri } from 'vscode'
import { dynamiconsConstants } from '../_config/dynamicons.constants.js'

export interface IIconDiscoveryService {
	getIconOptionsFromDirectory(
		directoryPath: string,
		iconKind: 'file' | 'folder' | 'user',
		filter?: (filename: string) => boolean,
	): Promise<ICoreQuickPickItem[]>
	getBuiltInIconDirectories(): Promise<{ fileIconsDir: string; folderIconsDir: string }>
}

export class IconDiscoveryService implements IIconDiscoveryService {
	private readonly BUILT_IN_FILE_ICONS_REL_PATH = 'assets/icons/file_icons'
	private readonly BUILT_IN_FOLDER_ICONS_REL_PATH = 'assets/icons/folder_icons'

	constructor(
		private readonly fileSystem: IFileSystem,
		private readonly path: IPath,
		private readonly commonUtils: ICommonUtils,
		private readonly extensionPath: string,
	) {}

	public async getIconOptionsFromDirectory(
		directoryPath: string,
		iconKind: 'file' | 'folder' | 'user',
		filter?: (filename: string) => boolean,
	): Promise<ICoreQuickPickItem[]> {
		const iconOptions: ICoreQuickPickItem[] = []

		try {
			const directoryUri = Uri.file(directoryPath)
			const entries = await this.fileSystem.readdir(directoryUri, { withFileTypes: true }) as import('fs').Dirent[]

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

	public async getBuiltInIconDirectories(): Promise<{ fileIconsDir: string; folderIconsDir: string }> {
		const fileIconsDir = this.path.join(
			this.extensionPath,
			this.BUILT_IN_FILE_ICONS_REL_PATH,
		)
		const folderIconsDir = this.path.join(
			this.extensionPath,
			this.BUILT_IN_FOLDER_ICONS_REL_PATH,
		)

		return { fileIconsDir, folderIconsDir }
	}
} 