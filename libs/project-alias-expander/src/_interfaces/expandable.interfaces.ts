// Expandable processing service interfaces
import type { ExpandableValue, FlagExpansion, TemplateProcessingResult } from '../_types/index.js'

export interface IExpandableProcessorService {
    expandTemplate(template: string, variables: Record<string, string>): string
    detectShellType(): 'pwsh' | 'linux' | 'cmd'
    processTemplateArray(templates: Array<{ position: 'start' | 'prefix' | 'pre-args' | 'suffix' | 'end', template: string }>, variables: Record<string, string>): TemplateProcessingResult
    processShellSpecificTemplate(expandable: ExpandableValue, variables: Record<string, string>): TemplateProcessingResult
    parseExpandableFlag(arg: string): { key: string, value: string | undefined }
    expandFlags(args: string[], expandables: Record<string, ExpandableValue>): FlagExpansion
    constructWrappedCommand(baseCommand: string[], startTemplates: string[], endTemplates: string[]): string[]
}