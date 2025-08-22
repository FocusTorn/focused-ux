import type { IWindow } from '../_interfaces/IWindow.js'
import type { ICommands } from '../_interfaces/ICommands.js'
import type { IContext } from '../_interfaces/IContext.js'
import type { IPath } from '../_interfaces/IPath.js'
import type { ICommonUtils } from '../_interfaces/ICommonUtils.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'
import type { IIconThemeGeneratorService } from '../_interfaces/IIconThemeGeneratorService.js'
import type { IConfigurationService } from './ConfigurationService.js'
import type { IIconPickerService } from './IconPickerService.js'
import { Uri } from 'vscode'
import { dynamiconsConstants } from '../_config/dynamicons.constants.js'

type IconAssociationType = 'file' | 'folder' | 'language'

export class IconActionsService {
	constructor(
		private readonly context: IContext,
		private readonly window: IWindow,
		private readonly commands: ICommands,
		private readonly path: IPath,
		private readonly commonUtils: ICommonUtils,
		private readonly fileSystem: IFileSystem,
		private readonly iconThemeGenerator: IIconThemeGeneratorService,
		private readonly configService: IConfigurationService,
		private readonly iconPicker: IIconPickerService,
	) {}

	private async getResourceName(resourceUri: Uri): Promise<string | undefined> {
		try {
			const stat = await this.fileSystem.stat(resourceUri)

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

	private async getAssociationKey(name: string, type: IconAssociationType): Promise<string> {
		const prefix = dynamiconsConstants.associationKeyPrefixes[type]
		return `${prefix}${name}`
	}

	private async getBaseThemePath(): Promise<string> {
		return this.path.join(this.context.extensionPath, 'assets', 'themes', 'base.theme.json')
	}

	private async getGeneratedThemeDir(): Promise<string> {
		return this.path.join(this.context.extensionPath, 'assets', 'themes')
	}

	public async showAvailableIconsQuickPick(
		assignableToType?: 'file' | 'folder',
		currentFilter?: (iconName: string) => boolean,
	): Promise<string | undefined> {
		return this.iconPicker.showAvailableIconsQuickPick(assignableToType, currentFilter)
	}

	public async assignIconToResource(
		resourceUris: Uri[],
		iconTypeScope?: IconAssociationType,
	): Promise<void> {
		if (!resourceUris || resourceUris.length === 0) {
			this.window.showWarningMessage('No resources selected for icon assignment.')
			return
		}

		// Convert language type to file type for icon picker (language icons are typically file icons)
		const pickerType = iconTypeScope === 'language' ? 'file' : iconTypeScope
		const selectedIcon = await this.showAvailableIconsQuickPick(pickerType)
		if (!selectedIcon) {
			return
		}

		await this.configService.updateCustomMappings(async (mappings) => {
			for (const resourceUri of resourceUris) {
				const resourceName = await this.getResourceName(resourceUri)
				if (!resourceName) continue

				const associationKey = await this.getAssociationKey(resourceName, iconTypeScope || 'file')
				mappings[associationKey] = selectedIcon
			}
			return mappings
		})

		await this.regenerateAndApplyTheme()
		this.window.showInformationMessage(`Icon assigned to ${resourceUris.length} resource(s).`)
	}

	public async revertIconAssignment(resourceUris: Uri[]): Promise<void> {
		if (!resourceUris || resourceUris.length === 0) {
			this.window.showWarningMessage('No resources selected for icon reversion.')
			return
		}

		await this.configService.updateCustomMappings(async (mappings) => {
			for (const resourceUri of resourceUris) {
				const resourceName = await this.getResourceName(resourceUri)
				if (!resourceName) continue

				// Remove mappings for all types
				for (const type of ['file', 'folder', 'language'] as const) {
					const associationKey = await this.getAssociationKey(resourceName, type)
					delete mappings[associationKey]
				}
			}
			return mappings
		})

		await this.regenerateAndApplyTheme()
		this.window.showInformationMessage(`Icon assignments reverted for ${resourceUris.length} resource(s).`)
	}

	public async showUserIconAssignments(type: 'file' | 'folder' | 'language'): Promise<void> {
		const mappings = await this.configService.getCustomMappings()
		if (!mappings) {
			this.window.showInformationMessage('No custom icon assignments found.')
			return
		}

		const prefix = dynamiconsConstants.associationKeyPrefixes[type]
		const relevantMappings = Object.entries(mappings)
			.filter(([key]) => key.startsWith(prefix))
			.map(([key, value]) => ({
				resource: key.substring(prefix.length),
				icon: value
			}))

		if (relevantMappings.length === 0) {
			this.window.showInformationMessage(`No ${type} icon assignments found.`)
			return
		}

		const message = relevantMappings
			.map(m => `${m.resource} → ${m.icon}`)
			.join('\n')

		this.window.showInformationMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} Icon Assignments:\n${message}`)
	}

	private async regenerateAndApplyTheme(): Promise<void> {
		try {
			const baseThemePath = await this.getBaseThemePath()
			const generatedThemeDir = await this.getGeneratedThemeDir()
			const userIconsDir = await this.configService.getUserIconsDirectory()
			const customMappings = await this.configService.getCustomMappings()
			const hideArrows = await this.configService.getHideArrowsSetting()

			const baseThemeUri = Uri.file(baseThemePath)
			const generatedThemeDirUri = Uri.file(generatedThemeDir)

			const manifest = await this.iconThemeGenerator.generateIconThemeManifest(
				baseThemeUri,
				generatedThemeDirUri,
				userIconsDir,
				customMappings,
				hideArrows
			)

			if (!manifest) {
				throw new Error('Failed to generate icon theme manifest')
			}

			const outputPath = Uri.file(this.path.join(generatedThemeDir, 'generated.theme.json'))
			await this.iconThemeGenerator.writeIconThemeFile(manifest, outputPath)

			// Refresh the file explorer to show the new icons
			await this.commands.executeCommand('workbench.files.action.refreshFilesExplorer')
		}
		catch (error) {
			this.commonUtils.errMsg('Failed to regenerate icon theme', error)
			this.window.showErrorMessage('Failed to regenerate icon theme. Check the console for details.')
		}
	}
} 