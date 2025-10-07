// Configuration interfaces - consolidated config and expandable interfaces
import type { AliasConfig } from '../_types/index.js'
import type { ExpandableValue, FlagExpansion, TemplateProcessingResult } from '../_types/index.js'

// Configuration interfaces
export interface IConfigLoader {
    loadAliasConfig(): AliasConfig
}

export interface IProjectResolver {
    resolveProjectForAlias(
        aliasValue: string | import('../_types/config.types.js').PackageDefinition
    ): { project: string; isFull: boolean }
}

// Expandable processing service interfaces
export interface IExpandableProcessorService {
    expandTemplate(template: string, variables: Record<string, string>): string
    detectShellType(): 'pwsh' | 'linux' | 'cmd'
    processTemplateArray(
        templates: Array<{
            position: 'start' | 'prefix' | 'pre-args' | 'suffix' | 'end'
            template: string
        }>,
        variables: Record<string, string>
    ): TemplateProcessingResult
    processShellSpecificTemplate(
        expandable: ExpandableValue,
        variables: Record<string, string>
    ): TemplateProcessingResult
    parseExpandableFlag(arg: string): { key: string; value: string | undefined }
    expandFlags(args: string[], expandables: Record<string, ExpandableValue>): FlagExpansion
    constructWrappedCommand(
        baseCommand: string[],
        startTemplates: string[],
        endTemplates: string[]
    ): string[]
}
