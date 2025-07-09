import type { WorkspaceConfiguration, Uri } from 'vscode'

export interface IWorkspace {
	getConfiguration: (section?: string, resource?: Uri) => WorkspaceConfiguration
}