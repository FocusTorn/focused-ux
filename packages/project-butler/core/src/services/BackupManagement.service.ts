import { IBackupManagementService, IBackupOptions } from '../_interfaces/IBackupManagementService'
import { IFileSystemAdapter } from '../_interfaces/IFileSystemAdapter'
import { IPathAdapter } from '../_interfaces/IPathAdapter'

// These interfaces are defined in the _interfaces directory

export class BackupManagementService implements IBackupManagementService {
	constructor(
		private readonly fileSystem: IFileSystemAdapter,
		private readonly path: IPathAdapter
	) {}

	async createBackup(filePath: string, options: IBackupOptions = {}): Promise<string> {
		const sourcePath = filePath
		const baseName = this.path.basename(sourcePath)
		const directory = this.path.dirname(sourcePath)
		let backupNumber = 1
		let backupFileName: string
		let destinationPath: string
		let fileExists = false

		do {
			backupFileName = `${baseName}.bak${backupNumber > 1 ? backupNumber : ''}`
			destinationPath = this.path.join(directory, backupFileName)
			try {
				await this.fileSystem.stat(destinationPath)
				fileExists = true
				backupNumber++
			} catch (_error: any) {
				fileExists = false
			}
		} while (fileExists)

		await this.fileSystem.copyFile(sourcePath, destinationPath)
		
		return destinationPath
	}
} 