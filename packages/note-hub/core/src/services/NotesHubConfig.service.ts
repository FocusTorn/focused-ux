// ESLint & Imports -->>

// _UTILITIES (direct imports) ================================================================================
import type { IWorkspace } from '../_interfaces/IWorkspace.js'
import type { IPathUtilsService } from '../_interfaces/IPathUtils.ts'
import type { IWorkspaceUtilsService } from '../_interfaces/IWorkspaceUtils.ts'
import type { ICommonUtilsService } from '../_interfaces/ICommonUtils.ts'
import type { ICommands } from '../_interfaces/ICommands.js'
import type { IFileSystem } from '../_interfaces/IFileSystem.ts'
import type { IUriFactory } from '../_interfaces/IUri.js'
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
		private readonly iFileSystem: IFileSystem,
		private readonly iOsHomedir: typeof nodeOs.homedir,
		private readonly iPathJoin: typeof nodePath.join,
		private readonly iPathNormalize: typeof nodePath.normalize,
		private readonly uriAdapter: IUriFactory,
	) {}

	public getNotesHubConfig(configPrefix: string): NotesHubConfig { //>
		const nhConfig = this.iWorkspace.getConfiguration(configPrefix)

		const getPath = (key: string, defaultSubPath: string): string => {
			// Resolve homedir safely first
			const homedir = typeof this.iOsHomedir === 'function' ? (this.iOsHomedir() || '') : ''

			if (!homedir) {
				return ''
			}

			const configuredPathRaw = nhConfig.get(key) as unknown
			let configuredPath = typeof configuredPathRaw === 'string' ? configuredPathRaw : ''

			if (!configuredPath) {
				if (key === notesHubConstants.configKeys.PROJECT_PATH) {
					const workspaceInfo = this.iWorkspaceUtils.getWorkspaceInfo()
					const { primaryName, workspaceName } = workspaceInfo
					let projectDirName: string = 'default_project_notes'

					if (primaryName && workspaceName && primaryName !== workspaceName) {
						projectDirName = `${primaryName}(${workspaceName})`
					}
					else if (primaryName || workspaceName) {
						projectDirName = (primaryName || workspaceName!)
					}

					configuredPath = this.iPathJoin(homedir, '.fux_note-hub', 'project', projectDirName)
				}
				else {
					configuredPath = this.iPathJoin(homedir, '.fux_note-hub', defaultSubPath)
				}
			}
			else if (configuredPath.startsWith('~')) {
				configuredPath = this.iPathJoin(homedir, configuredPath.slice(1))
			}

			// Normalize the path and clean up any double backslashes on Windows
			let normalizedPath = this.iPathNormalize(configuredPath || '')
			
			// Clean up double backslashes on Windows
			if (normalizedPath) {
				// Avoid importing process directly per SOP; normalization is safe across OS
				normalizedPath = String(normalizedPath).replace(/\\/g, '\\')
			}

			const finalPath = typeof normalizedPath === 'string' ? normalizedPath : ''

			// console.warn(`[NotesHubConfig] getPath generated for ${key}:`, {
			// 	configuredPath,
			// 	normalizedPath: finalPath,
			// 	homedir,
			// })
			return finalPath
		}

		const projectNotesPath = getPath(notesHubConstants.configKeys.PROJECT_PATH, 'project/default_project_notes')
		const remoteNotesPath = getPath(notesHubConstants.configKeys.REMOTE_PATH, 'remote')
		const globalNotesPath = getPath(notesHubConstants.configKeys.GLOBAL_PATH, 'global')

		console.log(`[NotesHubConfig] Final paths:`, {
			projectNotesPath,
			remoteNotesPath,
			globalNotesPath,
		})

		const isProjectNotesEnabled = (nhConfig.get(notesHubConstants.configKeys.ENABLE_PROJECT_NOTES, true) && !!projectNotesPath) as boolean
		const isRemoteNotesEnabled = (nhConfig.get(notesHubConstants.configKeys.ENABLE_REMOTE_NOTES, true) && !!remoteNotesPath) as boolean
		const isGlobalNotesEnabled = (nhConfig.get(notesHubConstants.configKeys.ENABLE_GLOBAL_NOTES, true) && !!globalNotesPath) as boolean

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
			if (!dirPath) {
				return
			}

			const normalizedPath = this.iPathNormalize(dirPath)

			if (!normalizedPath) {
				return
			}

			const uriAdapter = this.uriAdapter.file(normalizedPath)
			const uri = (uriAdapter as any).uri // Access the underlying VSCode URI

			// console.warn(`[NotesHubConfig] createDirectoryIfNeeded called with:`, {
			// 	originalPath: dirPath,
			// 	normalizedPath,
			// 	uri: uri.toString(),
			// })

			try {
				await this.iWorkspace.fs.stat(uri)
				// console.warn(`[NotesHubConfig] Directory already exists: ${normalizedPath}`)
			}
			catch (error) {
				const fsError = error as NodeJS.ErrnoException

				if (fsError.code === 'ENOENT' || fsError.code === 'FileNotFound') {
					// console.warn(`[NotesHubConfig] Directory does not exist, creating: ${normalizedPath}`)
					// Use FileSystemAdapter for reliable directory creation
					try {
						await this.iFileSystem.createDirectory(normalizedPath)
						// console.warn(`[NotesHubConfig] Successfully created directory using FileSystemAdapter: ${normalizedPath}`)
					}
					catch (_mkdirError) {
						// If FileSystemAdapter fails, try VSCode workspace fs as fallback
						// console.warn(`[NotesHubConfig] FileSystemAdapter mkdir failed for ${normalizedPath}:`, mkdirError)
						try {
							await this.iWorkspace.fs.createDirectory(uri)
							// console.warn(`[NotesHubConfig] Successfully created directory using VSCode workspace fs: ${normalizedPath}`)
						}
						catch (vscodeError) {
							// console.warn(`[NotesHubConfig] VSCode workspace fs also failed for ${normalizedPath}:`, vscodeError)
							this.iCommonUtils.errMsg(`Failed to create directory: ${normalizedPath}`, vscodeError)
							throw vscodeError
						}
					}
				}
				else {
					// console.warn(`[NotesHubConfig] Unexpected error checking directory: ${normalizedPath}`, error)
					throw error
				}
			}
		}
		catch (error) {
			// console.warn(`[NotesHubConfig] Failed to ensure directory exists: ${dirPath}`, error)
			this.iCommonUtils.errMsg(`Failed to ensure directory exists: ${dirPath}`, error)
		}
	} //<

}
