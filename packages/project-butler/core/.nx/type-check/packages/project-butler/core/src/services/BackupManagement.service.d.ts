import type { IBackupManagementService, IBackupOptions } from '../_interfaces/IBackupManagementService.js'
import type { IFileSystemAdapter } from '../_interfaces/IFileSystemAdapter.js'
import type { IPathAdapter } from '../_interfaces/IPathAdapter.js'
export declare class BackupManagementService implements IBackupManagementService {

    private readonly fileSystem
    private readonly path
    constructor(fileSystem: IFileSystemAdapter, path: IPathAdapter)
    createBackup(filePath: string, _options?: IBackupOptions): Promise<string>

}
//# sourceMappingURL=BackupManagement.service.d.ts.map