import { IPackageJsonFormattingService } from './IPackageJsonFormattingService'
import { ITerminalManagementService } from './ITerminalManagementService'
import { IBackupManagementService } from './IBackupManagementService'
import { IPoetryShellService } from './IPoetryShellService'

export interface IProjectMaidManagerService {
	/**
	 * Format package.json using .FocusedUX configuration
	 * @param packageJsonPath - Path to the package.json file
	 * @param workspaceRoot - Path to the workspace root
	 */
	formatPackageJson(packageJsonPath: string, workspaceRoot: string): Promise<void>

	/**
	 * Update terminal path to the current file or folder location
	 * @param filePath - Path to the file or folder
	 */
	updateTerminalPath(filePath: string): Promise<void>

	/**
	 * Create a backup of the selected file
	 * @param filePath - Path to the file to backup
	 */
	createBackup(filePath: string): Promise<void>

	/**
	 * Enter Poetry shell in the current directory
	 * @param filePath - Path to the file or folder (optional)
	 */
	enterPoetryShell(filePath?: string): Promise<void>
}

export interface IProjectMaidDependencies {
	packageJsonFormatting: IPackageJsonFormattingService
	terminalManagement: ITerminalManagementService
	backupManagement: IBackupManagementService
	poetryShell: IPoetryShellService
} 