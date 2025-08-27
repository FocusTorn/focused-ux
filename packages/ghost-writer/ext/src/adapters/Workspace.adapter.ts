import type { workspace as vscodeWorkspace, WorkspaceConfiguration } from 'vscode'

export class WorkspaceAdapter {

	constructor(private readonly workspace: typeof vscodeWorkspace) {}

	getConfiguration(section: string): WorkspaceConfiguration {
		return this.workspace.getConfiguration(section)
	}

}
