import type { IWorkspace } from '../_interfaces/IWorkspace.js'
import type { ICommonUtils } from '../_interfaces/ICommonUtils.js'
import { dynamiconsConstants } from '../_config/dynamicons.constants.js'

export interface IConfigurationService {
	getUserIconsDirectory: () => Promise<string | undefined>
	getCustomMappings: () => Promise<Record<string, string> | undefined>
	getHideArrowsSetting: () => Promise<boolean | null | undefined>
	updateCustomMappings: (updateFn: (mappings: Record<string, string>) => Promise<boolean | Record<string, string>>) => Promise<void>
	updateHideArrowsSetting: (value: boolean) => Promise<void>
}

export class ConfigurationService implements IConfigurationService {

	private readonly EXTENSION_CONFIG_PREFIX = dynamiconsConstants.configPrefix
	private readonly CUSTOM_MAPPINGS_KEY = dynamiconsConstants.configKeys.customIconMappings
	private readonly HIDE_ARROWS_KEY = dynamiconsConstants.configKeys.hideExplorerArrows
	private readonly USER_ICONS_DIR_KEY = dynamiconsConstants.configKeys.userIconsDirectory

	constructor(
		private readonly workspace: IWorkspace,
		private readonly commonUtils: ICommonUtils,
	) {}

	public async getUserIconsDirectory(): Promise<string | undefined> {
		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX) as {
			get: <T>(key: string) => T | undefined
		}

		return config.get<string>(this.USER_ICONS_DIR_KEY) || undefined
	}

	public async getCustomMappings(): Promise<Record<string, string> | undefined> {
		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX) as {
			get: <T>(key: string) => T | undefined
		}

		return config.get<Record<string, string>>(this.CUSTOM_MAPPINGS_KEY) || undefined
	}

	public async getHideArrowsSetting(): Promise<boolean | null | undefined> {
		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX) as {
			get: <T>(key: string) => T | undefined
		}

		return config.get<boolean | null>(this.HIDE_ARROWS_KEY)
	}

	public async updateCustomMappings(
		updateFn: (mappings: Record<string, string>) => Promise<boolean | Record<string, string>>,
	): Promise<void> {
		// console.log(`[ConfigurationService] updateCustomMappings - Starting`)

		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX) as {
			get: <T>(key: string) => T | undefined
			update: (key: string, value: any, isGlobal?: boolean) => Promise<void>
		}
		const originalMappingsFromConfig = config.get<Record<string, string>>(this.CUSTOM_MAPPINGS_KEY) || {}

		// console.log(`[ConfigurationService] updateCustomMappings - Original mappings:`, JSON.stringify(originalMappingsFromConfig, null, 2))
		
		const mutableMappingsCopy = { ...originalMappingsFromConfig }
		const newMappingsResult = await updateFn(mutableMappingsCopy)

		if (typeof newMappingsResult === 'boolean' && !newMappingsResult) {
			// console.log(`[ConfigurationService] updateCustomMappings - Update function returned false, aborting`)
			return
		}

		const finalMappings = typeof newMappingsResult === 'boolean' ? mutableMappingsCopy : newMappingsResult

		// console.log(`[ConfigurationService] updateCustomMappings - Final mappings:`, JSON.stringify(finalMappings, null, 2))

		if (JSON.stringify(originalMappingsFromConfig) !== JSON.stringify(finalMappings)) {
			// console.log(`[ConfigurationService] updateCustomMappings - Mappings changed, updating config...`)
			try {
				await config.update(this.CUSTOM_MAPPINGS_KEY, finalMappings, true) // true for global
				// console.log(`[ConfigurationService] updateCustomMappings - Config updated successfully`)
			}
			catch (error: any) {
				// console.log(`[ConfigurationService] updateCustomMappings - Config update failed:`, error)
				throw new Error(`Failed to update icon mappings: ${error.message || 'Unknown error'}`)
			}
		}
		else {
			// console.log(`[ConfigurationService] updateCustomMappings - No changes detected, skipping config update`)
		}
		// console.log(`[ConfigurationService] updateCustomMappings - Completed`)
	}

	public async updateHideArrowsSetting(value: boolean): Promise<void> {
		const config = this.workspace.getConfiguration(this.EXTENSION_CONFIG_PREFIX) as {
			update: (key: string, value: any, isGlobal?: boolean) => Promise<void>
		}
		
		try {
			await config.update(this.HIDE_ARROWS_KEY, value, true) // true for global
		}
		catch (error: any) {
			throw new Error(`Failed to update hide arrows setting: ${error.message || 'Unknown error'}`)
		}
	}

}
