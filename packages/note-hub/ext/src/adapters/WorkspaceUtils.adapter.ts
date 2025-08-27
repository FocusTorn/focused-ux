import type { IWorkspaceUtilsService, IWorkspace } from '@fux/note-hub-core'

export class WorkspaceUtilsAdapter implements IWorkspaceUtilsService {

	constructor(private workspace: IWorkspace) {}

	get workspaceName(): string | undefined {
		const info = this.getWorkspaceInfo()

		return info.workspaceName
	}

	get multiRoot(): boolean {
		const info = this.getWorkspaceInfo()

		return info.multiRoot
	}

	get primaryUri(): any | undefined {
		const info = this.getWorkspaceInfo()

		return info.primaryUri
	}

	get primaryName(): string | undefined {
		const info = this.getWorkspaceInfo()

		return info.primaryName
	}

	get multiRootByIndex(): any[] {
		const info = this.getWorkspaceInfo()

		return info.multiRootByIndex
	}

	get multiRootByName(): { [key: string]: any } {
		const info = this.getWorkspaceInfo()

		return info.multiRootByName
	}

	get workspaceFolders(): readonly any[] | undefined {
		const info = this.getWorkspaceInfo()

		return info.workspaceFolders
	}

	get safeWorkspaceName(): string {
		const info = this.getWorkspaceInfo()

		return info.safeWorkspaceName
	}

	get isRemote(): boolean {
		const info = this.getWorkspaceInfo()

		return info.isRemote
	}

	get remoteUserAndHost(): string | undefined {
		const info = this.getWorkspaceInfo()

		return info.remoteUserAndHost
	}

	getWorkspaceInfo(): any {
		// Mock implementation for now
		return {
			inWorkspace: false,
			workspaceName: undefined,
			multiRoot: false,
			primaryUri: undefined,
			primaryName: undefined,
			multiRootByIndex: [],
			multiRootByName: {},
			workspaceFolders: undefined,
			safeWorkspaceName: 'default',
			isRemote: false,
			remoteUserAndHost: undefined,
		}
	}

}
