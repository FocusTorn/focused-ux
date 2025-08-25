// ESLint & Imports -->>

//= IMPLEMENTATION TYPES ======================================================================================
import type { IWorkspaceUtilsService, WorkspaceInfo } from '../_interfaces/IWorkspaceUtilsService.js'

//= INJECTED TYPES ============================================================================================
import type { IWorkspace } from '../_interfaces/IWorkspace.js'
import type { IUri } from '../_interfaces/IUri.js'
import type { IWorkspaceFolder } from '../_interfaces/IWorkspaceFolder.js'

//--------------------------------------------------------------------------------------------------------------<<

export class WorkspaceUtilsService implements IWorkspaceUtilsService {

	constructor(
		private readonly iWorkspace: IWorkspace,
	) {}

	// Interface properties
	public get workspaceName(): string | undefined {
		const info = this.getWorkspaceInfo()

		return info.workspaceName
	}

	public get multiRoot(): boolean {
		const info = this.getWorkspaceInfo()

		return info.multiRoot
	}

	public get primaryUri(): IUri | undefined {
		const info = this.getWorkspaceInfo()

		return info.primaryUri
	}

	public get primaryName(): string | undefined {
		const info = this.getWorkspaceInfo()

		return info.primaryName
	}

	public get multiRootByIndex(): IUri[] {
		const info = this.getWorkspaceInfo()

		return info.multiRootByIndex
	}

	public get multiRootByName(): { [key: string]: IUri } {
		const info = this.getWorkspaceInfo()

		return info.multiRootByName
	}

	public get workspaceFolders(): readonly IWorkspaceFolder[] | undefined {
		const info = this.getWorkspaceInfo()

		return info.workspaceFolders
	}

	public get safeWorkspaceName(): string {
		const info = this.getWorkspaceInfo()

		return info.safeWorkspaceName
	}

	public get isRemote(): boolean {
		const info = this.getWorkspaceInfo()

		return info.isRemote
	}

	public get remoteUserAndHost(): string | undefined {
		const info = this.getWorkspaceInfo()

		return info.remoteUserAndHost
	}

	public getWorkspaceInfo(): WorkspaceInfo {
		const workspaceFolders = this.iWorkspace.workspaceFolders
		const inWorkspace = !!workspaceFolders && workspaceFolders.length > 0
		const multiRoot = inWorkspace && workspaceFolders.length > 1
		const workspaceName = inWorkspace ? 'workspace' : undefined // VSCode doesn't expose workspace name directly
		
		let primaryUri: IUri | undefined
		let primaryName: string | undefined
		const multiRootByIndex: IUri[] = []
		const multiRootByName: { [key: string]: IUri } = {}
		let safeWorkspaceName: string = 'default'
		let isRemote: boolean = false
		let remoteUserAndHost: string | undefined

		if (inWorkspace && workspaceFolders) {
			primaryUri = workspaceFolders[0].uri
			primaryName = workspaceFolders[0].name
			safeWorkspaceName = workspaceName ?? primaryName ?? 'default_workspace'

			workspaceFolders.forEach((folder: IWorkspaceFolder) => {
				if (folder) {
					multiRootByIndex.push(folder.uri)
					multiRootByName[folder.name] = folder.uri

					// Check for remote workspace
					if (folder.uri?.scheme && folder.uri.scheme !== 'file') {
						isRemote = true
						remoteUserAndHost = folder.name
					}
				}
			})
		}
		else {
			safeWorkspaceName = 'no_workspace_open' // Or handle as per application needs
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
	}

}
