export interface IPoetryShellService {
    /**
     * Enter Poetry shell in the specified directory
     * @param directoryPath - Path to the directory (optional, uses current if not provided)
     * @returns Promise that resolves when poetry shell command is ready
     */
    enterPoetryShell: (filePath?: string) => Promise<IPoetryShellCommand>;
}
export interface IPoetryShellCommand {
    command: string;
    shouldShowTerminal: boolean;
}
//# sourceMappingURL=IPoetryShellService.d.ts.map