import { BACKUP_SUFFIX } from "../_config/constants.js"
class BackupManagementService {

    constructor(fileSystem, path) {
        this.fileSystem = fileSystem
        this.path = path
    }
    async createBackup(filePath, _options = {}) {
        const sourcePath = filePath
        const baseName = this.path.basename(sourcePath)
        const directory = this.path.dirname(sourcePath)
        let backupNumber = 1
        let backupFileName
        let destinationPath
        let fileExists = false

        do {
            backupFileName = `${baseName}${BACKUP_SUFFIX}${backupNumber > 1 ? backupNumber : ""}`
            destinationPath = this.path.join(directory, backupFileName)
            try {
                await this.fileSystem.stat(destinationPath)
                fileExists = true
                backupNumber++
            } catch (_error) {
                fileExists = false
            }
        } while (fileExists)
        await this.fileSystem.copyFile(sourcePath, destinationPath)
        return destinationPath
    }

}
export {
    BackupManagementService
}
