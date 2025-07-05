// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type {
	IWorkspaceUtilsService,
	WorkspaceInfo,
	IWorkspace,
} from '../interfaces.js'

//--------------------------------------------------------------------------------------------------------------<<

export class WorkspaceUtilsService implements IWorkspaceUtilsService {

	constructor(
		private readonly iWorkspace: IWorkspace,
	) {}

	public getWorkspaceInfo(): WorkspaceInfo { //>
		const workspaceFolders = this.iWorkspace.workspaceFolders
		const inWorkspace = !!workspaceFolders && workspaceFolders.length > 0
		const multiRoot = inWorkspace && workspaceFolders.length > 1
		const workspaceName = inWorkspace ? this.iWorkspace.name : undefined
		let primaryUri: import('vscode').Uri | undefined
		let primaryName: string | undefined
		const multiRootByIndex: import('vscode').Uri[] = []
		const multiRootByName: { [key: string]: import('vscode').Uri } = {}
		let safeWorkspaceName: string = 'default'
		let isRemote: boolean = false
		let remoteUserAndHost: string | undefined

		if (inWorkspace && workspaceFolders) {
			primaryUri = workspaceFolders[0].uri
			primaryName = workspaceFolders[0].name
			safeWorkspaceName = workspaceName ?? primaryName ?? 'default_workspace'

			workspaceFolders.forEach((folder) => {
				if (folder) {
					multiRootByIndex.push(folder.uri)
					multiRootByName[folder.name] = folder.uri

					if (folder.uri?.scheme === 'vscode-remote') {
						isRemote = true

						const authority = folder.uri.authority

						if (authority) {
							const parts = authority.split('+')

							remoteUserAndHost = parts[0]
						}
					}
				}
			})
		}
		else {
			safeWorkspaceName = `no_workspace_open`
		}

		return {
			inWorkspace,
			workspaceName,
			multiRoot,
			primaryUri,
			primaryName,
			multiRootByIndex,
			multiRootByName,
			workspaceFolders,
			safeWorkspaceName,
			isRemote,
			remoteUserAndHost,
		}
	} //<

} // <
