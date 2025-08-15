// ESLint & Imports -->>

//= VSCODE TYPES & MOCKED INTERNALS ===========================================================================
import type { IUri, IWorkspaceFolder } from '@fux/shared'

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
}
