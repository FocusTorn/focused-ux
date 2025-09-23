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
    formatPackageJson: (packageJsonPath: string, workspaceRoot: string) => Promise<void>

    /**
	 * Update terminal path to the current file or folder location
	 * @param filePath - Path to the file or folder
	 */
    updateTerminalPath: (filePath: string) => Promise<void>

    /**
	 * Create a backup of the selected file
	 * @param filePath - Path to the file to backup
	 */
    createBackup: (filePath: string) => Promise<void>

    /**
	 * Enter Poetry shell in the current directory
	 * @param filePath - Path to the file or folder (optional)
	 */
    enterPoetryShell: (filePath?: string) => Promise<void>

    // Complex orchestration methods
    /**
	 * Complex orchestration: Format package.json and create backup in one operation
	 * @param packageJsonPath - Path to the package.json file
	 * @param workspaceRoot - Path to the workspace root
	 */
    formatPackageJsonWithBackup: (packageJsonPath: string, workspaceRoot: string) => Promise<{ backupPath: string; formatted: boolean }>

    /**
	 * Complex orchestration: Complete project setup workflow
	 * @param packageJsonPath - Path to the package.json file
	 * @param workspaceRoot - Path to the workspace root
	 * @param filePath - Path to the file or folder for terminal
	 */
    completeProjectSetupWorkflow: (packageJsonPath: string, workspaceRoot: string, filePath: string) => Promise<{ backupPath: string; formatted: boolean; terminalCommand: string }>

    /**
	 * Complex orchestration: Poetry environment setup with terminal navigation
	 * @param filePath - Path to the file or folder
	 * @param packageJsonPath - Path to the package.json file (optional)
	 * @param workspaceRoot - Path to the workspace root (optional)
	 */
    poetryEnvironmentSetup: (filePath: string, packageJsonPath?: string, workspaceRoot?: string) => Promise<{ poetryCommand: string; terminalCommand: string; backupPath?: string }>
}

export interface IProjectButlerDependencies {
    packageJsonFormatting: IPackageJsonFormattingService
    terminalManagement: ITerminalManagementService
    backupManagement: IBackupManagementService
    poetryShell: IPoetryShellService
}
