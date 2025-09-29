// Expandable system types
export type ExpandableValue = string | {
    position?: 'start' | 'prefix' | 'pre-args' | 'suffix' | 'end'
    defaults?: Record<string, string>
    template?: string
    mutation?: string
    'pwsh-template'?: string | TemplateObject | TemplateObject[]
    'linux-template'?: string | TemplateObject | TemplateObject[]
    'cmd-template'?: string | TemplateObject | TemplateObject[]
}

export type TemplateObject = {
    position: 'start' | 'prefix' | 'pre-args' | 'suffix' | 'end'
    template: string
    defaults?: Record<string, string>
}

export type ShellType = 'pwsh' | 'linux' | 'cmd'

export interface FlagExpansion {
    start: string[]
    prefix: string[]
    preArgs: string[]
    suffix: string[]
    end: string[]
    remainingArgs: string[]
}

export interface TemplateProcessingResult {
    start: string[]
    end: string[]
}
