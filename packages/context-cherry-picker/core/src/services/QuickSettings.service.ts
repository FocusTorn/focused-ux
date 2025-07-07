// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import { EventEmitter } from 'vscode'
import type { Event } from 'vscode'

//= MISC ======================================================================================================
import * as yaml from 'js-yaml'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IQuickSettingsService } from '../_interfaces/IQuickSettingsDataProvider.js'
import { constants } from '../_config/constants.js'
import type { IWorkspace } from '../_interfaces/IWorkspace.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'
import type { IPath } from '../_interfaces/IPath.js'
import type { IContext } from '../_interfaces/IContext.js'

//--------------------------------------------------------------------------------------------------------------<<

const PROJECT_STRUCTURE_SETTING_ID = constants.quickSettings.projectStructureContents.id

type ProjectStructureSettingValue = 'none' | 'selected' | 'all'

interface FileGroup {
	initially_visible: boolean
	items: string[]
}
interface FileGroupsConfig {
	[groupName: string]: FileGroup
}
interface ProjectYamlConfig {
	ContextCherryPicker?: {
		file_groups?: FileGroupsConfig
		settings?: {
			default_project_structure?: (string)[]
			message_show_seconds?: (number | string)[]
		}
	}
}

export class QuickSettingsService implements IQuickSettingsService {

	private _settingsState: Map<string, any> = new Map()
	private _onDidUpdateSetting = new EventEmitter<{ settingId: string, value: any }>()
	public readonly onDidUpdateSetting: Event<{ settingId: string, value: any }> = this._onDidUpdateSetting.event
	private _initializationPromise: Promise<void>

	constructor(
		private readonly context: IContext,
		private readonly workspace: IWorkspace,
		private readonly fileSystem: IFileSystem,
		private readonly path: IPath,
	) {
		this._initializationPromise = this._initializeStatesFromConfig()
	}

	private async _initializeStatesFromConfig(): Promise<void> {
		const config = await this._getProjectConfig()
		const keys = constants.projectConfig.keys
		const ccpConfig = config?.[keys.contextCherryPicker]

		let projectStructureValue: ProjectStructureSettingValue = 'all'
		const validValues: ProjectStructureSettingValue[] = ['none', 'selected', 'all']
		const defaultValueFromConfig = ccpConfig?.[keys.settings]?.[keys.default_project_structure] as string[] | undefined

		if (defaultValueFromConfig && Array.isArray(defaultValueFromConfig) && defaultValueFromConfig.length > 0) {
			const configValue = defaultValueFromConfig[0]?.toLowerCase() as ProjectStructureSettingValue

			if (validValues.includes(configValue)) {
				projectStructureValue = configValue
			}
		}
		this._settingsState.set(PROJECT_STRUCTURE_SETTING_ID, projectStructureValue)

		const fileGroups = ccpConfig?.[keys.file_groups]

		if (fileGroups) {
			for (const groupName in fileGroups) {
				const group = fileGroups[groupName]
				const settingId = `${constants.quickSettings.fileGroupVisibility.idPrefix}.${groupName}`

				if (!this._settingsState.has(settingId)) {
					this._settingsState.set(settingId, group.initially_visible ?? false)
				}
			}
		}
	}

	private async _getProjectConfig(): Promise<ProjectYamlConfig | undefined> {
		if (this.workspace.workspaceFolders && this.workspace.workspaceFolders.length > 0) {
			const workspaceRoot = this.workspace.workspaceFolders[0].uri
			const configFileUri = this.path.join(workspaceRoot, constants.projectConfig.fileName)

			try {
				const fileContents = await this.fileSystem.readFile(configFileUri)
				const yamlContent = new TextDecoder().decode(fileContents)

				return yaml.load(yamlContent) as ProjectYamlConfig
			}
			catch (_error) {
				// ignore
			}
		}
		return undefined
	}

	public async refresh(): Promise<void> {
		this._initializationPromise = this._initializeStatesFromConfig()
		await this._initializationPromise
	}

	public async updateSettingState(settingId: string, newState: any): Promise<void> {
		this._settingsState.set(settingId, newState)
		this._onDidUpdateSetting.fire({ settingId, value: newState })
	}

	public async getSettingState(settingId: string): Promise<any> {
		await this._initializationPromise
		return this._settingsState.get(settingId)
	}

	public async getHtml(cspSource: string, nonce: string): Promise<string> {
		await this._initializationPromise

		const currentProjectStructureState = (this._settingsState.get(PROJECT_STRUCTURE_SETTING_ID) || 'all') as ProjectStructureSettingValue
		const viewHtmlUri = this.path.join(this.context.extensionUri, 'assets', 'views', 'projectStructureQuickSetting.html')

		const config = await this._getProjectConfig()
		const fileGroups = config?.ContextCherryPicker?.file_groups
		let fileGroupButtonsHtml = ''

		if (fileGroups) {
			for (const groupName in fileGroups) {
				const settingId = `${constants.quickSettings.fileGroupVisibility.idPrefix}.${groupName}`
				const isSelected = this._settingsState.get(settingId) ? 'selected' : ''

				fileGroupButtonsHtml += `<div class="toggle-button ${isSelected}" data-setting-id="${settingId}">${groupName}</div>`
			}
		}

		try {
			const fileContents = await this.fileSystem.readFile(viewHtmlUri)
			let htmlContent = new TextDecoder().decode(fileContents)

			htmlContent = htmlContent.replace(/\$\{nonce\}/g, nonce)
			htmlContent = htmlContent.replace(/\$\{webview.cspSource\}/g, cspSource)
			htmlContent = htmlContent.replace(/\$\{currentProjectStructureStateSelected.none\}/g, currentProjectStructureState === 'none' ? 'selected' : '')
			htmlContent = htmlContent.replace(/\$\{currentProjectStructureStateSelected.selected\}/g, currentProjectStructureState === 'selected' ? 'selected' : '')
			htmlContent = htmlContent.replace(/\$\{currentProjectStructureStateSelected.all\}/g, currentProjectStructureState === 'all' ? 'selected' : '')
			htmlContent = htmlContent.replace(/\$\{PROJECT_STRUCTURE_SETTING_ID\}/g, PROJECT_STRUCTURE_SETTING_ID)
			htmlContent = htmlContent.replace(/\$\{fileGroupButtonsHtml\}/g, fileGroupButtonsHtml)

			return htmlContent
		}
		catch (error) {
			console.error(`[${constants.extension.nickName}] Failed to read HTML file ${viewHtmlUri}:`, error)
			throw error
		}
	}

}
