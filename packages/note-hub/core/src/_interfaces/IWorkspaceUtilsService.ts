// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { IUri } from './IUri.js'
import type { IWorkspaceFolder } from './IWorkspaceFolder.js'

//--------------------------------------------------------------------------------------------------------------<<

export interface WorkspaceInfo {
	inWorkspace: boolean
	workspaceName?: string
	multiRoot: boolean
	primaryUri?: IUri
	primaryName?: string
	multiRootByIndex: IUri[]
	multiRootByName: { [key: string]: IUri }
	workspaceFolders?: readonly IWorkspaceFolder[]
	safeWorkspaceName: string
	isRemote: boolean
	remoteUserAndHost?: string
}

export interface IWorkspaceUtilsService {
	workspaceName?: string
	multiRoot: boolean
	primaryUri?: IUri
	primaryName?: string
	multiRootByIndex: IUri[]
	multiRootByName: { [key: string]: IUri }
	workspaceFolders?: readonly IWorkspaceFolder[]
	safeWorkspaceName: string
	isRemote: boolean
	remoteUserAndHost?: string
	getWorkspaceInfo: () => WorkspaceInfo
}
