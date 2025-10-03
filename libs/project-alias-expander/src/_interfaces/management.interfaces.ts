// Management interfaces - consolidated alias and pae-manager interfaces
import type {
    AliasConfig,
    FlagExpansion,
    IExpandableProcessorService,
    ICommandExecutionService
} from '../_types/index.js'

// Alias management service interfaces
export interface IAliasManagerService {
    processAliases(): Promise<void>
    generateLocalFiles(): void
    generateDirectToNativeModules(): void
    installAliases(): Promise<void>
    refreshAliasesDirect(): Promise<void>
}

export interface IPAEDependencies {
    expandableProcessor: IExpandableProcessorService
    commandExecution: ICommandExecutionService
    aliasManager: IAliasManagerService
}

export interface IPAEManagerService {
    // Alias management operations
    generateLocalFiles(): void
    installAliases(): Promise<void>
    refreshAliasesDirect(): Promise<void>
    
    // Command execution operations
    runNx(argv: string[]): Promise<number>
    runCommand(command: string, args: string[]): Promise<number>
    runMany(runType: 'ext' | 'core' | 'all', targets: string[], flags: string[], config: AliasConfig): Promise<number>
    
    // Expandable processing operations
    expandTemplate(template: string, variables: Record<string, string>): string
    detectShellType(): 'pwsh' | 'linux' | 'cmd'
    processTemplateArray(templates: Array<{ position: 'start' | 'prefix' | 'pre-args' | 'suffix' | 'end', template: string }>, variables: Record<string, string>): { start: string[], end: string[] }
    processShellSpecificTemplate(expandable: any, variables: Record<string, string>): { start: string[], end: string[] }
    parseExpandableFlag(arg: string): { key: string, value: string | undefined }
    expandFlags(args: string[], expandables: Record<string, any>): FlagExpansion
    constructWrappedCommand(baseCommand: string[], startTemplates: string[], endTemplates: string[]): string[]
}
