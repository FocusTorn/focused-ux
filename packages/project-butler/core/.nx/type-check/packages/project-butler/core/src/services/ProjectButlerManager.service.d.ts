import type { IProjectButlerManagerService, IProjectButlerDependencies } from '../_interfaces/IProjectButlerManagerService.js'
export declare class ProjectButlerManagerService implements IProjectButlerManagerService {

    private readonly dependencies
    constructor(dependencies: IProjectButlerDependencies)
    formatPackageJson(packageJsonPath: string, workspaceRoot: string): Promise<void>
    updateTerminalPath(filePath: string): Promise<void>
    createBackup(filePath: string): Promise<void>
    enterPoetryShell(filePath?: string): Promise<void>

}
//# sourceMappingURL=ProjectButlerManager.service.d.ts.map