class ProjectButlerManagerService {

    constructor(dependencies) {
        this.dependencies = dependencies
    }
    async formatPackageJson(packageJsonPath, workspaceRoot) {
        await this.dependencies.packageJsonFormatting.formatPackageJson(packageJsonPath, workspaceRoot)
    }
    async updateTerminalPath(filePath) {
        await this.dependencies.terminalManagement.updateTerminalPath(filePath)
    }
    async createBackup(filePath) {
        await this.dependencies.backupManagement.createBackup(filePath)
    }
    async enterPoetryShell(filePath) {
        await this.dependencies.poetryShell.enterPoetryShell(filePath)
    }

}
export {
    ProjectButlerManagerService
}
