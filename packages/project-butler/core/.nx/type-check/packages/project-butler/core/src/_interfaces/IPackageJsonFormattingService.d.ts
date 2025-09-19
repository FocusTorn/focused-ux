export interface IPackageJsonFormattingService {
    /**
     * Format a package.json file according to .FocusedUX configuration
     * @param packageJsonPath - Path to the package.json file
     * @param workspaceRoot - Path to the workspace root (for .FocusedUX config)
     * @returns Promise that resolves when formatting is complete
     */
    formatPackageJson: (packageJsonPath: string, workspaceRoot: string) => Promise<void>;
}
export interface IPackageJsonConfig {
    ProjectButler: {
        'packageJson-order': string[];
    };
}
export interface IPackageJsonData {
    [key: string]: unknown;
}
//# sourceMappingURL=IPackageJsonFormattingService.d.ts.map