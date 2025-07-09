import type { WorkspaceConfiguration, Uri } from 'vscode'
import { workspace as VsCodeWorkspace } from 'vscode'
import type { IWorkspace } from '@fux/dynamicons-core'

export class WorkspaceAdapter implements IWorkspace {

	public getConfiguration(section?: string, resource?: Uri): WorkspaceConfiguration {
		return VsCodeWorkspace.getConfiguration(section, resource)
	}

}
