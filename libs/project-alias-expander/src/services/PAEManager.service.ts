import type {
    IPAEDependencies,
    IPAEManagerService,
    IExpandableProcessorService,
    ICommandExecutionService,
    IAliasManagerService,
    AliasConfig,
    ExpandableValue,
    FlagExpansion
} from '../_types/index.js'
import { expandableProcessor } from './ExpandableProcessor.service.js'
import { commandExecution } from './CommandExecution.service.js'
import { aliasManager } from './AliasManager.service.js'

export class PAEManagerService implements IPAEManagerService {

    constructor(private readonly dependencies: IPAEDependencies) {}

    // Alias management operations - delegated to AliasManagerService
    async generateLocalFiles(): Promise<void> {
        return this.dependencies.aliasManager.generateLocalFiles()
    }

    async installAliases(): Promise<void> {
        return this.dependencies.aliasManager.installAliases()
    }

    async refreshAliasesDirect(): Promise<void> {
        return this.dependencies.aliasManager.refreshAliasesDirect()
    }

    // Command execution operations - delegated to CommandExecutionService
    async runNx(argv: string[]): Promise<number> {
        return this.dependencies.commandExecution.runNx(argv)
    }

    async runCommand(command: string, args: string[]): Promise<number> {
        return this.dependencies.commandExecution.runCommand(command, args)
    }

    async runMany(runType: 'ext' | 'core' | 'all', targets: string[], flags: string[], config: AliasConfig): Promise<number> {
        return this.dependencies.commandExecution.runMany(runType, targets, flags, config)
    }

    // Expandable processing operations - delegated to ExpandableProcessorService
    expandTemplate(template: string, variables: Record<string, string>): string {
        return this.dependencies.expandableProcessor.expandTemplate(template, variables)
    }

    detectShellType(): 'pwsh' | 'linux' | 'cmd' {
        return this.dependencies.expandableProcessor.detectShellType()
    }

    processTemplateArray(templates: Array<{ position: 'start' | 'prefix' | 'pre-args' | 'suffix' | 'end', template: string }>, variables: Record<string, string>): { start: string[], end: string[] } {
        return this.dependencies.expandableProcessor.processTemplateArray(templates, variables)
    }

    processShellSpecificTemplate(expandable: ExpandableValue, variables: Record<string, string>): { start: string[], end: string[] } {
        return this.dependencies.expandableProcessor.processShellSpecificTemplate(expandable, variables)
    }

    parseExpandableFlag(arg: string): { key: string, value: string | undefined } {
        return this.dependencies.expandableProcessor.parseExpandableFlag(arg)
    }

    expandFlags(args: string[], expandables: Record<string, ExpandableValue>): FlagExpansion {
        return this.dependencies.expandableProcessor.expandFlags(args, expandables)
    }

    constructWrappedCommand(baseCommand: string[], startTemplates: string[], endTemplates: string[]): string[] {
        return this.dependencies.expandableProcessor.constructWrappedCommand(baseCommand, startTemplates, endTemplates)
    }

}

// Create default dependencies with singleton services
const defaultDependencies: IPAEDependencies = {
    expandableProcessor,
    commandExecution,
    aliasManager
}

// Export singleton instance with default dependencies
export const paeManager = new PAEManagerService(defaultDependencies)
