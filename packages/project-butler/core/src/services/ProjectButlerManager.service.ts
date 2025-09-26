import type { IProjectButlerManagerService, IProjectButlerDependencies } from '../_interfaces/IProjectButlerManagerService.js'
import { ERROR_MESSAGES } from '../_config/constants.js'

export class ProjectButlerManagerService implements IProjectButlerManagerService {

    constructor(private readonly dependencies: IProjectButlerDependencies) {}

    async formatPackageJson(packageJsonPath: string, workspaceRoot: string): Promise<void> {
        try {
            // Validate input parameters
            this.validatePackageJsonParameters(packageJsonPath, workspaceRoot)
            
            await this.dependencies.packageJsonFormatting.formatPackageJson(packageJsonPath, workspaceRoot)
        } catch (error: any) {
            throw new Error(`${ERROR_MESSAGES.PACKAGE_JSON_PARSE_ERROR}: ${error.message}`)
        }
    }

    async updateTerminalPath(filePath: string): Promise<void> {
        try {
            // Validate input parameters
            this.validateFilePath(filePath)
            
            await this.dependencies.terminalManagement.updateTerminalPath(filePath)
        } catch (error: any) {
            throw new Error(`${ERROR_MESSAGES.TERMINAL_PATH_UPDATE_FAILED}: ${error.message}`)
        }
    }

    async createBackup(filePath: string): Promise<void> {
        try {
            // Validate input parameters
            this.validateFilePath(filePath)
            
            await this.dependencies.backupManagement.createBackup(filePath)
        } catch (error: any) {
            throw new Error(`${ERROR_MESSAGES.BACKUP_CREATION_FAILED}: ${error.message}`)
        }
    }

    async enterPoetryShell(filePath?: string): Promise<void> {
        try {
            if (filePath) {
                this.validateFilePath(filePath)
            }
            
            await this.dependencies.poetryShell.enterPoetryShell(filePath)
        } catch (error: any) {
            throw new Error(`${ERROR_MESSAGES.POETRY_SHELL_FAILED}: ${error.message}`)
        }
    }

    /**
     * Complex orchestration: Format package.json and create backup in one operation
     */
    async formatPackageJsonWithBackup(packageJsonPath: string, workspaceRoot: string): Promise<{ backupPath: string; formatted: boolean }> {
        try {
            // Step 1: Validate input parameters
            this.validatePackageJsonParameters(packageJsonPath, workspaceRoot)
            
            // Step 2: Create backup before formatting
            const backupPath = await this.dependencies.backupManagement.createBackup(packageJsonPath)
            
            // Step 3: Format package.json
            await this.dependencies.packageJsonFormatting.formatPackageJson(packageJsonPath, workspaceRoot)
            
            return {
                backupPath,
                formatted: true
            }
        } catch (error: any) {
            throw new Error(`Format package.json with backup failed: ${error.message}`)
        }
    }

    /**
     * Complex orchestration: Complete project setup workflow
     */
    async completeProjectSetupWorkflow(
        packageJsonPath: string,
        workspaceRoot: string,
        filePath: string
    ): Promise<{ backupPath: string; formatted: boolean; terminalCommand: string }> {
        try {
            // Step 1: Validate all input parameters
            this.validatePackageJsonParameters(packageJsonPath, workspaceRoot)
            this.validateFilePath(filePath)
            
            // Step 2: Create backup of package.json
            const backupPath = await this.dependencies.backupManagement.createBackup(packageJsonPath)
            
            // Step 3: Format package.json
            await this.dependencies.packageJsonFormatting.formatPackageJson(packageJsonPath, workspaceRoot)
            
            // Step 4: Generate terminal command for navigation
            const terminalCommand = await this.dependencies.terminalManagement.updateTerminalPath(filePath)
            
            return {
                backupPath,
                formatted: true,
                terminalCommand: terminalCommand.command
            }
        } catch (error: any) {
            throw new Error(`Complete project setup workflow failed: ${error.message}`)
        }
    }

    /**
     * Complex orchestration: Poetry environment setup with terminal navigation
     */
    async poetryEnvironmentSetup(
        filePath: string,
        packageJsonPath?: string,
        workspaceRoot?: string
    ): Promise<{ poetryCommand: string; terminalCommand: string; backupPath?: string }> {
        try {
            // Step 1: Validate required parameters
            this.validateFilePath(filePath)
            
            let backupPath: string | undefined
            
            // Step 2: If package.json path provided, create backup and format
            if (packageJsonPath && workspaceRoot) {
                this.validatePackageJsonParameters(packageJsonPath, workspaceRoot)
                backupPath = await this.dependencies.backupManagement.createBackup(packageJsonPath)
                await this.dependencies.packageJsonFormatting.formatPackageJson(packageJsonPath, workspaceRoot)
            }
            
            // Step 3: Generate Poetry shell command
            const poetryCommand = await this.dependencies.poetryShell.enterPoetryShell(filePath)
            
            // Step 4: Generate terminal navigation command
            const terminalCommand = await this.dependencies.terminalManagement.updateTerminalPath(filePath)
            
            return {
                poetryCommand: poetryCommand.command,
                terminalCommand: terminalCommand.command,
                backupPath
            }
        } catch (error: any) {
            throw new Error(`Poetry environment setup failed: ${error.message}`)
        }
    }

    // Private validation methods
    private validatePackageJsonParameters(packageJsonPath: string, workspaceRoot: string): void {
        if (!packageJsonPath?.trim()) {
            throw new Error(ERROR_MESSAGES.INVALID_FILE_PATH)
        }
        
        if (!workspaceRoot?.trim()) {
            throw new Error(ERROR_MESSAGES.INVALID_FILE_PATH)
        }
    }

    private validateFilePath(filePath: string): void {
        if (!filePath?.trim()) {
            throw new Error(ERROR_MESSAGES.INVALID_FILE_PATH)
        }
    }

}
