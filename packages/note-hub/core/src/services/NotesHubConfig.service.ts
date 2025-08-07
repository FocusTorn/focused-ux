// ESLint & Imports -->>

// _UTILITIES (direct imports) ================================================================================
import type { IWorkspace, IPathUtilsService, IWorkspaceUtilsService, ICommonUtilsService, ICommands } from '@fux/shared'
import { UriAdapter } from '@fux/shared'
import type * as nodeOs from 'node:os'
import type * as nodePath from 'node:path'
import type { INotesHubConfigService, NotesHubConfig } from '../_interfaces/INotesHubConfigService.js'
import { notesHubConstants } from '../_config/constants.js'

//--------------------------------------------------------------------------------------------------------------<<

export class NotesHubConfigService implements INotesHubConfigService {
	private contextSet = false

	constructor(
		private readonly iWorkspace: IWorkspace,
		private readonly iPathUtils: IPathUtilsService,
		private readonly iWorkspaceUtils: IWorkspaceUtilsService,
		private readonly iCommonUtils: ICommonUtilsService,
		private readonly iCommands: ICommands,
		private readonly iOsHomedir: typeof nodeOs.homedir,
		private readonly iPathJoin: typeof nodePath.join,
		private readonly iPathNormalize: typeof nodePath.normalize,
	) {}

	public getNotesHubConfig(configPrefix: string): NotesHubConfig { //>
		const nhConfig = this.iWorkspace.getConfiguration(configPrefix)

		const getPath = (key: string, defaultSubPath: string): string => {
			let configuredPath: string = nhConfig.get<string>(key) || ''

			if (!configuredPath) {
				if (key === notesHubConstants.configKeys.PROJECT_PATH) {
					const workspaceInfo = this.iWorkspaceUtils.getWorkspaceInfo()
					const { primaryName, workspaceName } = workspaceInfo
					let projectDirName: string = 'default_project_notes'

					if (primaryName && workspaceName && primaryName !== workspaceName) {
						projectDirName = `${primaryName}(${workspaceName})`
					}
					else if (primaryName || workspaceName) {
						projectDirName = primaryName || workspaceName!
					}

					configuredPath = this.iPathJoin(this.iOsHomedir(), '.fux_note-hub', 'project', projectDirName)
				}
				else {
					configuredPath = this.iPathJoin(this.iOsHomedir(), '.fux_note-hub', defaultSubPath)
				}
			}
			else if (configuredPath.startsWith('~')) {
				configuredPath = this.iPathJoin(this.iOsHomedir(), configuredPath.slice(1))
			}
			return this.iPathUtils.santizePath(this.iPathNormalize(configuredPath))
		}

		const projectNotesPath = getPath(notesHubConstants.configKeys.PROJECT_PATH, 'project/default_project_notes')
		const remoteNotesPath = getPath(notesHubConstants.configKeys.REMOTE_PATH, 'remote')
		const globalNotesPath = getPath(notesHubConstants.configKeys.GLOBAL_PATH, 'global')

		const isProjectNotesEnabled = nhConfig.get<boolean>(notesHubConstants.configKeys.ENABLE_PROJECT_NOTES, true)
		const isRemoteNotesEnabled = nhConfig.get<boolean>(notesHubConstants.configKeys.ENABLE_REMOTE_NOTES, true)
		const isGlobalNotesEnabled = nhConfig.get<boolean>(notesHubConstants.configKeys.ENABLE_GLOBAL_NOTES, true)

		// Set context variables for view visibility (only once to prevent duplicate registrations)
		if (!this.contextSet) {
			this.iCommands.executeCommand('setContext', `config.${configPrefix}.enableProjectNotes`, isProjectNotesEnabled)
			this.iCommands.executeCommand('setContext', `config.${configPrefix}.enableRemoteNotes`, isRemoteNotesEnabled)
			this.iCommands.executeCommand('setContext', `config.${configPrefix}.enableGlobalNotes`, isGlobalNotesEnabled)
			this.contextSet = true
		}

		return {
			projectNotesPath,
			remoteNotesPath,
			globalNotesPath,
			isProjectNotesEnabled,
			isRemoteNotesEnabled,
			isGlobalNotesEnabled,
		}
	} //<

	public async createDirectoryIfNeeded(dirPath: string): Promise<void> { //>
		try {
			const uri = UriAdapter.file(this.iPathUtils.santizePath(dirPath))

			try {
				await this.iWorkspace.fs.stat(uri)
			}
			catch (error) {
				const fsError = error as NodeJS.ErrnoException

				if (fsError.code === 'ENOENT' || fsError.code === 'FileNotFound') {
					await this.iWorkspace.fs.createDirectory(uri)
				}
				else {
					throw error
				}
			}
		}
		catch (error) {
			this.iCommonUtils.errMsg(`Failed to ensure directory exists: ${dirPath}`, error)
		}
	} //<

}
