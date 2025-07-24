export interface IWorkspaceUtilsService {
  getWorkspaceInfo: () => { primaryName?: string; workspaceName?: string };
} 