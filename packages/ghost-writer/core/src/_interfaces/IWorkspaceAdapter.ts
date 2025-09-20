export interface IWorkspaceAdapter {
    getConfiguration: (section: string) => any // vscode.WorkspaceConfiguration
}
