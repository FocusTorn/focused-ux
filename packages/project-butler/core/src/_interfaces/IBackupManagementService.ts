export interface IBackupManagementService {
    /**
	 * Create a backup of the specified file
	 * @param filePath - Path to the file to backup
	 * @returns Promise that resolves with the backup file path
	 */
    createBackup: (filePath: string) => Promise<string>
}

export interface IBackupOptions {
    prefix?: string
    suffix?: string
    directory?: string
}
