export interface VscodeTestExecutorSchema {
    /** Path to the TypeScript config for integration tests */
    tsConfig: string
    
    /** Path to the VS Code test config file */
    config: string
    
    /** Test timeout in milliseconds */
    timeout?: number
    
    /** Whether to filter noisy output */
    filterOutput?: boolean
    
    /** Patterns to filter out from output when filterOutput is true */
    filterPatterns?: string[]
    
    /** Additional arguments to pass to vscode-test */
    additionalArgs?: string[]
}
