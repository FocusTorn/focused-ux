// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { IEvent } from '../_interfaces/ILocalTypes.js'

//= MISC ======================================================================================================
import * as yaml from 'js-yaml'

//= IMPLEMENTATION TYPES ======================================================================================
import type { IQuickSettingsService } from '../_interfaces/IQuickSettingsDataProvider.js'
import { constants } from '../_config/constants.js'
import type { IWorkspace } from '../_interfaces/IWorkspace.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.js'
import type { IPath } from '../_interfaces/IPath.js'
import type { IContext } from '../_interfaces/IContext.js'
import { EventEmitterAdapter } from '../_interfaces/ILocalTypes.js'

//--------------------------------------------------------------------------------------------------------------<<

const PROJECT_STRUCTURE_SETTING_ID = constants.quickSettingIDs.projectStructureContents.id
const STATUS_MESSAGE_SETTING_ID = constants.quickSettingIDs.defaultStatusMessage.id

type ProjectStructureSettingValue = 'none' | 'selected' | 'all'
type StatusMessageSettingValue = 'none' | 'toast' | 'bar' | 'drop' | 'desc'

interface QuickSettingsPanelConfig {
	project_structure_contents?: {
		visible?: boolean
		filter?: ProjectStructureSettingValue
	}
	default_status_message?: {
		visible?: boolean
		style?: StatusMessageSettingValue
	}
	file_groups?: {
		[groupName: string]: {
			initially_visible: boolean
			items: string[]
		}
	}
}

interface ProjectYamlConfig {
	ContextCherryPicker?: {
		quick_settings_panel?: QuickSettingsPanelConfig
		settings?: {
			message_show_seconds?: (number | string)[]
		}
	}
}

export class QuickSettingsService implements IQuickSettingsService {

	private _settingsState: Map<string, any> = new Map()
	private _onDidUpdateSetting = new EventEmitterAdapter<{ settingId: string, value: any }>()
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
		const panelConfig = config?.ContextCherryPicker?.quick_settings_panel

		// Project Structure
		const projectStructureFilter = panelConfig?.project_structure_contents?.filter || 'all'

		this._settingsState.set(PROJECT_STRUCTURE_SETTING_ID, projectStructureFilter)

		// Status Message
		const statusMessageStyle = panelConfig?.default_status_message?.style || 'drop'

		this._settingsState.set(STATUS_MESSAGE_SETTING_ID, statusMessageStyle)

		// File Groups
		const fileGroups = panelConfig?.file_groups

		if (fileGroups) {
			for (const groupName in fileGroups) {
				const group = fileGroups[groupName]
				const settingId = `${constants.quickSettingIDs.fileGroupVisibility.idPrefix}.${groupName}`

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
				const yamlContent = await this.fileSystem.readFile(configFileUri)

				return yaml.load(yamlContent) as ProjectYamlConfig
			}
			catch (_error) {
				// ignore
			}
		}
		return undefined
	}

	private async _writeSettingToConfig(settingId: string, newState: any): Promise<void> {
		if (!this.workspace.workspaceFolders || this.workspace.workspaceFolders.length === 0)
			return

		const workspaceRoot = this.workspace.workspaceFolders[0].uri
		const configFileUri = this.path.join(workspaceRoot, constants.projectConfig.fileName)

		try {
			const config = await this._getProjectConfig() || {}
			const ccpKey = constants.projectConfig.keys.contextCherryPicker
			const panelKey = constants.projectConfig.keys.quick_settings_panel

			if (!config[ccpKey])
				config[ccpKey] = {}
			if (!config[ccpKey]![panelKey])
				config[ccpKey]![panelKey] = {}

			const panelConfig = config[ccpKey]![panelKey]!

			if (settingId === PROJECT_STRUCTURE_SETTING_ID) {
				if (!panelConfig.project_structure_contents)
					panelConfig.project_structure_contents = {}
				panelConfig.project_structure_contents.filter = newState
			}
			else if (settingId === STATUS_MESSAGE_SETTING_ID) {
				if (!panelConfig.default_status_message)
					panelConfig.default_status_message = {}
				panelConfig.default_status_message.style = newState
			}
			else if (settingId.startsWith(constants.quickSettingIDs.fileGroupVisibility.idPrefix)) {
				const groupName = settingId.substring(constants.quickSettingIDs.fileGroupVisibility.idPrefix.length + 1)

				if (panelConfig.file_groups && panelConfig.file_groups[groupName]) {
					panelConfig.file_groups[groupName].initially_visible = newState
				}
			}

			const newYamlContent = yaml.dump(config)

			await this.fileSystem.writeFile(configFileUri, new TextEncoder().encode(newYamlContent))
		}
		catch (error) {
			console.error(`[${constants.extension.nickName}] Failed to write to .FocusedUX:`, error)
		}
	}

	public async refresh(): Promise<void> {
		this._initializationPromise = this._initializeStatesFromConfig()
		await this._initializationPromise
		this._onDidUpdateSetting.fire({ settingId: 'refresh', value: null })
	}

	public async updateSettingState(settingId: string, newState: any): Promise<void> {
		this._settingsState.set(settingId, newState)
		await this._writeSettingToConfig(settingId, newState)
		this._onDidUpdateSetting.fire({ settingId, value: newState })
	}

	public async getSettingState(settingId: string): Promise<any> {
		await this._initializationPromise
		return this._settingsState.get(settingId)
	}

	public async getHtml(cspSource: string, nonce: string): Promise<string> {
		await this._initializationPromise

		const config = await this._getProjectConfig()
		const panelConfig = config?.ContextCherryPicker?.quick_settings_panel

		let projectStructureSection = ''

		if (panelConfig?.project_structure_contents?.visible) {
			const currentState = this._settingsState.get(PROJECT_STRUCTURE_SETTING_ID) || 'all'

			projectStructureSection = `
                <div class="quick-setting-group">
                    <div class="quick-setting-title">Project Structure Contents</div>
                    <div class="options-container" data-setting-group-id="${PROJECT_STRUCTURE_SETTING_ID}">
                        <div class="option-button ${currentState === 'none' ? 'selected' : ''}" data-setting-id="${PROJECT_STRUCTURE_SETTING_ID}" data-value="none">None</div>
                        <div class="option-button ${currentState === 'selected' ? 'selected' : ''}" data-setting-id="${PROJECT_STRUCTURE_SETTING_ID}" data-value="selected">Selected</div>
                        <div class="option-button ${currentState === 'all' ? 'selected' : ''}" data-setting-id="${PROJECT_STRUCTURE_SETTING_ID}" data-value="all">All</div>
                    </div>
                </div>`
		}

		let statusMessageSection = ''

		if (panelConfig?.default_status_message?.visible) {
			const currentState = this._settingsState.get(STATUS_MESSAGE_SETTING_ID) || 'drop'

			statusMessageSection = `
                <div class="quick-setting-group">
                    <div class="quick-setting-title">Default Status Message</div>
                    <div class="options-container" data-setting-group-id="${STATUS_MESSAGE_SETTING_ID}">
                        <div class="option-button ${currentState === 'none' ? 'selected' : ''}" data-setting-id="${STATUS_MESSAGE_SETTING_ID}" data-value="none">None</div>
                        <div class="option-button ${currentState === 'toast' ? 'selected' : ''}" data-setting-id="${STATUS_MESSAGE_SETTING_ID}" data-value="toast">Toast</div>
                        <div class="option-button ${currentState === 'bar' ? 'selected' : ''}" data-setting-id="${STATUS_MESSAGE_SETTING_ID}" data-value="bar">Bar</div>
                        <div class="option-button ${currentState === 'drop' ? 'selected' : ''}" data-setting-id="${STATUS_MESSAGE_SETTING_ID}" data-value="drop">Drop</div>
                        <div class="option-button ${currentState === 'desc' ? 'selected' : ''}" data-setting-id="${STATUS_MESSAGE_SETTING_ID}" data-value="desc">Desc</div>
                    </div>
                </div>`
		}

		let fileGroupButtonsHtml = ''
		const fileGroups = panelConfig?.file_groups

		if (fileGroups) {
			for (const groupName in fileGroups) {
				const settingId = `${constants.quickSettingIDs.fileGroupVisibility.idPrefix}.${groupName}`
				const isSelected = this._settingsState.get(settingId) ? 'selected' : ''

				fileGroupButtonsHtml += `<div class="toggle-button ${isSelected}" data-setting-id="${settingId}">${groupName}</div>`
			}
		}

		const viewHtmlUri = this.path.join(this.context.extensionUri, 'assets', 'views', 'projectStructureQuickSetting.html')

		try {
			const htmlContent = await this.fileSystem.readFile(viewHtmlUri)

			const finalHtml = htmlContent
				.replace(/\$\{nonce\}/g, nonce)
				.replace(/\$\{webview.cspSource\}/g, cspSource)
				.replace(/\$\{projectStructureSection\}/g, projectStructureSection)
				.replace(/\$\{statusMessageSection\}/g, statusMessageSection)
				.replace(/\$\{fileGroupButtonsHtml\}/g, fileGroupButtonsHtml)

			return finalHtml
		}
		catch (error) {
			console.error(`[${constants.extension.nickName}] Failed to read HTML file ${viewHtmlUri}:`, error)
			throw error
		}
	}

}
