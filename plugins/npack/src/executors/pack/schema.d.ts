export interface PackExecutorSchema {
    targetPath?: string
    targetName?: string
    outputPath?: string
    keepTemp?: boolean
    tempPath?: string
    freshTemp?: boolean
    includeFiles?: string[]
    excludeFiles?: string[]
    dev?: boolean
    installGlobal?: boolean
}