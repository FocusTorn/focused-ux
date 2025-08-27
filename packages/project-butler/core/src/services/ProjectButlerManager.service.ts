import type { IProjectButlerManagerService, IProjectButlerDependencies } from '../_interfaces/IProjectButlerManagerService.js'

export class ProjectButlerManagerService implements IProjectButlerManagerService {

	constructor(private readonly dependencies: IProjectButlerDependencies) {}

	async formatPackageJson(packageJsonPath: string, workspaceRoot: string): Promise<void> {
		await this.dependencies.packageJsonFormatting.formatPackageJson(packageJsonPath, workspaceRoot)
	}

	async updateTerminalPath(filePath: string): Promise<void> {
		await this.dependencies.terminalManagement.updateTerminalPath(filePath)
	}

	async createBackup(filePath: string): Promise<void> {
		await this.dependencies.backupManagement.createBackup(filePath)
	}

	async enterPoetryShell(filePath?: string): Promise<void> {
		await this.dependencies.poetryShell.enterPoetryShell(filePath)
	}

}
