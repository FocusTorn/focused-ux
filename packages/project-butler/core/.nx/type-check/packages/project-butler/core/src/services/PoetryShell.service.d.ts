import type { IPoetryShellService, IPoetryShellCommand } from '../_interfaces/IPoetryShellService.js'
import type { IFileSystemAdapter } from '../_interfaces/IFileSystemAdapter.js'
import type { IPathAdapter } from '../_interfaces/IPathAdapter.js'
export declare class PoetryShellService implements IPoetryShellService {

    private readonly fileSystem
    private readonly path
    constructor(fileSystem: IFileSystemAdapter, path: IPathAdapter)
    enterPoetryShell(filePath?: string): Promise<IPoetryShellCommand>

}
//# sourceMappingURL=PoetryShell.service.d.ts.map