import type { IPackageJsonFormattingService, IPackageJsonData } from '../_interfaces/IPackageJsonFormattingService.js'
import type { IFileSystemAdapter } from '../_interfaces/IFileSystemAdapter.js'
import type { IYamlAdapter } from '../_interfaces/IYamlAdapter.js'
export declare class PackageJsonFormattingService implements IPackageJsonFormattingService {

    private readonly fileSystem
    private readonly yaml
    constructor(fileSystem: IFileSystemAdapter, yaml: IYamlAdapter)
    formatPackageJson(packageJsonPath: string, workspaceRoot: string): Promise<void>
    getUnknownKeys(packageData: IPackageJsonData, masterOrder: string[]): string[]

}
//# sourceMappingURL=PackageJsonFormatting.service.d.ts.map