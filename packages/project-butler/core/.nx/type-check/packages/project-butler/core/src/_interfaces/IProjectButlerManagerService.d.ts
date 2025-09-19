import type { IPackageJsonFormattingService } from './IPackageJsonFormattingService.js'
import type { ITerminalManagementService } from './ITerminalManagementService.js'
import type { IBackupManagementService } from './IBackupManagementService.js'
import type { IPoetryShellService } from './IPoetryShellService.js'
export interface IProjectButlerManagerService {
    /**
     * Format package.json using .FocusedUX configuration
     * @param packageJsonPath - Path to the package.json file
     * @param workspaceRoot - Path to the workspace root
     */
    formatPackageJson: (packageJsonPath: string, workspaceRoot: string) => Promise<void>;
    /**
     * Update terminal path to the current file or folder location
     * @param filePath - Path to the file or folder
     */
    updateTerminalPath: (filePath: string) => Promise<void>;
    /**
     * Create a backup of the selected file
     * @param filePath - Path to the file to backup
     */
    createBackup: (filePath: string) => Promise<void>;
    /**
     * Enter Poetry shell in the current directory
     * @param filePath - Path to the file or folder (optional)
     */
    enterPoetryShell: (filePath?: string) => Promise<void>;
}
export interface IProjectButlerDependencies {
    packageJsonFormatting: IPackageJsonFormattingService;
    terminalManagement: ITerminalManagementService;
    backupManagement: IBackupManagementService;
    poetryShell: IPoetryShellService;
}
//# sourceMappingURL=IProjectButlerManagerService.d.ts.map