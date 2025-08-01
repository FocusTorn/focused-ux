import type { IWorkspaceUtilsService, IWorkspace } from '@fux/shared'
import * as path from 'node:path'

export class WorkspaceUtilsAdapter implements IWorkspaceUtilsService {

	constructor(private readonly iWorkspace: IWorkspace) {}

	public getWorkspaceInfo(): { primaryName?: string, workspaceName?: string } {
		const workspaceFolders = this.iWorkspace.workspaceFolders

		if (!workspaceFolders || workspaceFolders.length === 0) {
			return {}
		}

		const primaryFolder = workspaceFolders[0]
		const primaryName = primaryFolder ? path.basename(primaryFolder.uri.fsPath) : undefined

		// The concept of a separate workspaceName is less relevant in the shared IWorkspace interface.
		// We can treat the primary folder name as the workspace name for simplicity.
		const workspaceName = primaryName

		return { primaryName, workspaceName }
	}

}
