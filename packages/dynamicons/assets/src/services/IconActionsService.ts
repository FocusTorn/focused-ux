// ESLint & Imports -->>

import type { IWindow } from '../_interfaces/IWindow.js'
import type { ICommands } from '../_interfaces/ICommands.js'
import type { IContext } from '../_interfaces/IContext.js'
import type { IPath } from '../_interfaces/IPath.js'
import type { ICommonUtils } from '../_interfaces/ICommonUtils.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'
import type { IIconThemeGeneratorService } from '../_interfaces/IIconThemeGeneratorService.js'
import type { IConfigurationService } from './ConfigurationService.js'
import type { IIconPickerService } from './IconPickerService.js'
import type { IUri, IUriFactory } from '../_interfaces/IUri.js'
import { dynamiconsConstants } from '../_config/dynamicons.constants.js'

//--------------------------------------------------------------------------------------------------------------<<

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
		private readonly uriFactory: IUriFactory,
	) {}

	private async getResourceName(resourceUri: IUri): Promise<string | undefined> {
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

	private async detectResourceType(resourceUris: IUri[]): Promise<IconAssociationType> {
		try {
			// Check the first resource to determine the type
			const firstResource = resourceUris[0]
			const stat = await this.fileSystem.stat(firstResource)

			if (stat.isDirectory()) {
				return 'folder'
			}
			else if (stat.isFile()) {
				return 'file'
			}
		}
		catch (error) {
			this.commonUtils.errMsg(`Error detecting resource type for ${resourceUris[0]?.fsPath}`, error)
		}

		// Default to file if detection fails
		return 'file'
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
		resourceUris: IUri[],
		workspaceAdapter?: any,
		iconTypeScope?: IconAssociationType,
	): Promise<void> {
		if (!resourceUris || resourceUris.length === 0) {
			this.window.showWarningMessage('No resources selected for icon assignment.')
			return
		}

		// Auto-detect resource type if not specified
		let finalIconTypeScope = iconTypeScope

		if (!finalIconTypeScope) {
			finalIconTypeScope = await this.detectResourceType(resourceUris)
		}

		// Convert language type to file type for icon picker (language icons are typically file icons)
		const pickerType = finalIconTypeScope === 'language' ? 'file' : finalIconTypeScope
		const selectedIcon = await this.showAvailableIconsQuickPick(pickerType)

		if (!selectedIcon) {
			return
		}

		await this.configService.updateCustomMappings(async (mappings) => {
			for (const resourceUri of resourceUris) {
				const resourceName = await this.getResourceName(resourceUri)

				if (!resourceName)
					continue

				const associationKey = await this.getAssociationKey(resourceName, finalIconTypeScope || 'file')

				mappings[associationKey] = selectedIcon
			}
			return mappings
		})

		await this.regenerateAndApplyTheme(workspaceAdapter)
		this.window.showInformationMessage(`Icon assigned to ${resourceUris.length} resource(s).`)
	}

	public async revertIconAssignment(resourceUris: IUri[], workspaceAdapter?: any): Promise<void> {
		if (!resourceUris || resourceUris.length === 0) {
			this.window.showWarningMessage('No resources selected for icon reversion.')
			return
		}

		await this.configService.updateCustomMappings(async (mappings) => {
			for (const resourceUri of resourceUris) {
				const resourceName = await this.getResourceName(resourceUri)

				if (!resourceName)
					continue

				// Remove mappings for all types
				for (const type of ['file', 'folder', 'language'] as const) {
					const associationKey = await this.getAssociationKey(resourceName, type)

					delete mappings[associationKey]
				}
			}
			return mappings
		})

		await this.regenerateAndApplyTheme(workspaceAdapter)
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
			.filter(([key]) =>
				key.startsWith(prefix))
			.map(([key, value]) =>
				({
					resource: key.substring(prefix.length),
					icon: value,
				}))

		if (relevantMappings.length === 0) {
			this.window.showInformationMessage(`No ${type} icon assignments found.`)
			return
		}

		const message = relevantMappings
			.map(m =>
				`${m.resource} → ${m.icon}`)
			.join('\n')

		this.window.showInformationMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} Icon Assignments:\n${message}`)
	}

	public async toggleExplorerArrows(workspaceAdapter?: any): Promise<void> {
		const currentSetting = await this.configService.getHideArrowsSetting()
		const newSetting = !currentSetting
		
		await this.configService.updateHideArrowsSetting(newSetting)
		await this.regenerateAndApplyTheme(workspaceAdapter)
		
		const status = newSetting ? 'hidden' : 'visible'

		this.window.showInformationMessage(`Explorer arrows are now ${status}.`)
	}

	public async refreshIconTheme(workspaceAdapter?: any): Promise<void> {
		await this.regenerateAndApplyTheme(workspaceAdapter)
		this.window.showInformationMessage('Icon theme refreshed successfully.')
	}

	private async regenerateAndApplyTheme(workspaceAdapter?: any): Promise<void> {
		try {
			const baseThemePath = await this.getBaseThemePath()
			const generatedThemeDir = await this.getGeneratedThemeDir()
			const userIconsDir = await this.configService.getUserIconsDirectory()
			const customMappings = await this.configService.getCustomMappings()
			const hideArrows = await this.configService.getHideArrowsSetting()

			const baseThemeUri = this.uriFactory.file(baseThemePath)
			const generatedThemeDirUri = this.uriFactory.file(generatedThemeDir)

			const manifest = await this.iconThemeGenerator.generateIconThemeManifest(
				baseThemeUri,
				generatedThemeDirUri,
				userIconsDir,
				customMappings,
				hideArrows,
			)

			if (!manifest) {
				throw new Error('Failed to generate icon theme manifest')
			}

			const outputPath = this.uriFactory.file(this.path.join(generatedThemeDir, 'dynamicons.theme.json'))

			await this.iconThemeGenerator.writeIconThemeFile(manifest, outputPath)

			// Use workspace adapter if available (same as working implementation)
			if (workspaceAdapter) {
				const workbenchConfig = workspaceAdapter.getConfiguration('workbench')
				const currentTheme = workbenchConfig.get('iconTheme')

				if (currentTheme === 'dynamicons-theme') {
					await workbenchConfig.update('iconTheme', 'vs-seti-file-icons', true)
					await new Promise(resolve =>
						setTimeout(resolve, 25))
					await workbenchConfig.update('iconTheme', 'dynamicons-theme', true)
				}
			}
			else {
			// Fallback to command execution if workspace adapter not available
				await this.commands.executeCommand('workbench.action.selectIconTheme', 'vs-seti-file-icons')
				await new Promise(resolve =>
					setTimeout(resolve, 25))
				await this.commands.executeCommand('workbench.action.selectIconTheme', 'dynamicons-theme')
			}
		}
		catch (error) {
			this.commonUtils.errMsg('Failed to regenerate icon theme', error)
			this.window.showErrorMessage('Failed to regenerate icon theme. Check the console for details.')
		}
	}

}
