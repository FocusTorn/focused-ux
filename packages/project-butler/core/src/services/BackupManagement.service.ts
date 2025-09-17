import type { IBackupManagementService, IBackupOptions } from '../_interfaces/IBackupManagementService.js'
import type { IFileSystemAdapter } from '../_interfaces/IFileSystemAdapter.js'
import type { IPathAdapter } from '../_interfaces/IPathAdapter.js'
import { BACKUP_SUFFIX } from '../_config/constants.js'

// These interfaces are defined in the _interfaces directory

export class BackupManagementService implements IBackupManagementService {

	constructor(
		private readonly fileSystem: IFileSystemAdapter,
		private readonly path: IPathAdapter,
	) {}

	async createBackup(filePath: string, _options: IBackupOptions = {}): Promise<string> {
		const sourcePath = filePath
		const baseName = this.path.basename(sourcePath)
		const directory = this.path.dirname(sourcePath)
		let backupNumber = 1
		let backupFileName: string
		let destinationPath: string
		let fileExists = false

		do {
			backupFileName = `${baseName}${BACKUP_SUFFIX}${backupNumber > 1 ? backupNumber : ''}`
			destinationPath = this.path.join(directory, backupFileName)
			try {
				await this.fileSystem.stat(destinationPath)
				fileExists = true
				backupNumber++
			}
			catch (_error: any) {
				fileExists = false
			}
		} while (fileExists)

		await this.fileSystem.copyFile(sourcePath, destinationPath)
		
		return destinationPath
	}

}
