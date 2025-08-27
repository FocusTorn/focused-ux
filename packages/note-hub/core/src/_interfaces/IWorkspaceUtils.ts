export interface IWorkspaceUtilsService {
	getWorkspaceInfo: () => {
		primaryName: string
		workspaceName: string
		workspaceFolders: any[]
	}
}
