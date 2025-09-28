// PAE Manager Service interfaces
import type { 
    IExpandableProcessorService, 
    ICommandExecutionService, 
    IAliasManagerService 
} from '../_types/index.js'
import type { AliasConfig, FlagExpansion } from '../_types/index.js'

export interface IPAEDependencies {
    expandableProcessor: IExpandableProcessorService
    commandExecution: ICommandExecutionService
    aliasManager: IAliasManagerService
}

export interface IPAEManagerService {
    // Alias management operations
    generateLocalFiles(): void
    installAliases(): void
    refreshAliases(): void
    refreshAliasesDirect(): void
    
    // Command execution operations
    runNx(argv: string[]): number
    runCommand(command: string, args: string[]): number
    runMany(runType: 'ext' | 'core' | 'all', targets: string[], flags: string[], config: AliasConfig): number
    
    // Expandable processing operations
    expandTemplate(template: string, variables: Record<string, string>): string
    detectShellType(): 'pwsh' | 'linux' | 'cmd'
    processTemplateArray(templates: Array<{ position: 'start' | 'prefix' | 'pre-args' | 'suffix' | 'end', template: string }>, variables: Record<string, string>): { start: string[], end: string[] }
    processShellSpecificTemplate(expandable: any, variables: Record<string, string>): { start: string[], end: string[] }
    parseExpandableFlag(arg: string): { key: string, value: string | undefined }
    expandFlags(args: string[], expandables: Record<string, any>): FlagExpansion
    constructWrappedCommand(baseCommand: string[], startTemplates: string[], endTemplates: string[]): string[]
}
