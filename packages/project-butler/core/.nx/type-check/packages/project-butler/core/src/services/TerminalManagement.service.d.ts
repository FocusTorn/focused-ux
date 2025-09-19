import type { ITerminalManagementService, ITerminalCommand } from '../_interfaces/ITerminalManagementService.js'
import type { IFileSystemAdapter } from '../_interfaces/IFileSystemAdapter.js'
import type { IPathAdapter } from '../_interfaces/IPathAdapter.js'
export declare class TerminalManagementService implements ITerminalManagementService {

    private readonly fileSystem
    private readonly path
    constructor(fileSystem: IFileSystemAdapter, path: IPathAdapter)
    updateTerminalPath(filePath: string): Promise<ITerminalCommand>

}
//# sourceMappingURL=TerminalManagement.service.d.ts.map