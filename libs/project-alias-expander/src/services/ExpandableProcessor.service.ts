import type { 
    ExpandableValue, 
    TemplateObject, 
    ShellType, 
    FlagExpansion, 
    TemplateProcessingResult,
    ShellDetectionResult,
    IExpandableProcessorService
} from '../_types/index.js'
import { detectShell } from '../shell.js'

export class ExpandableProcessorService implements IExpandableProcessorService {
    expandTemplate(template: string, variables: Record<string, string>): string {
        return template.replace(/\{(\w+)\}/g, (match, varName) => {
            return variables[varName] || match
        })
    }

    detectShellType(): ShellType {
        const shell = detectShell()
        if (shell === 'powershell') {
            return 'pwsh'
        } else if (shell === 'gitbash') {
            return 'linux'
        } else {
            // Default to cmd for unknown shells on Windows, linux for others
            return process.platform === 'win32' ? 'cmd' : 'linux'
        }
    }

    processTemplateArray(templates: TemplateObject[], variables: Record<string, string>): TemplateProcessingResult {
        const start: string[] = []
        const end: string[] = []
        let endCount = 0
        
        for (const templateObj of templates) {
            // Merge template-level defaults with top-level variables
            const templateVariables = { ...variables }
            if (templateObj.defaults) {
                // Check for conflicts between top-level and template-level defaults
                for (const key of Object.keys(templateObj.defaults)) {
                    if (key in templateVariables) {
                        throw new Error(`Variable conflict: '${key}' is defined in both top-level and template-level defaults`)
                    }
                }
                // Merge template defaults into variables
                Object.assign(templateVariables, templateObj.defaults)
            }
            
            const expanded = this.expandTemplate(templateObj.template, templateVariables)
            
            if (templateObj.position === 'end') {
                endCount++
                if (endCount > 1) {
                    throw new Error('Only one "end" position template is allowed per expandable')
                }
                end.push(expanded)
            } else {
                start.push(expanded)
            }
        }
        
        return { start, end }
    }

    processShellSpecificTemplate(expandable: ExpandableValue, variables: Record<string, string>): TemplateProcessingResult {
        if (typeof expandable === 'string') {
            return { start: [], end: [] }
        }

        const shellType = this.detectShellType()
        const shellTemplateKey = `${shellType}-template` as keyof typeof expandable
        
        // Check if shell-specific template exists
        if (shellTemplateKey in expandable) {
            const shellTemplate = expandable[shellTemplateKey]
            
            if (Array.isArray(shellTemplate)) {
                // Handle array templates (like pwsh-template)
                return this.processTemplateArray(shellTemplate, variables)
            } else if (typeof shellTemplate === 'object' && shellTemplate !== null) {
                // Handle single object template
                const templateVariables = { ...variables }
                if (shellTemplate.defaults) {
                    // Check for conflicts between top-level and template-level defaults
                    for (const key of Object.keys(shellTemplate.defaults)) {
                        if (key in templateVariables) {
                            throw new Error(`Variable conflict: '${key}' is defined in both top-level and template-level defaults`)
                        }
                    }
                    // Merge template defaults into variables
                    Object.assign(templateVariables, shellTemplate.defaults)
                }
                
                const expanded = this.expandTemplate(shellTemplate.template, templateVariables)
                if (shellTemplate.position === 'end') {
                    return { start: [], end: [expanded] }
                } else {
                    return { start: [expanded], end: [] }
                }
            } else if (typeof shellTemplate === 'string') {
                // Handle string template
                const expanded = this.expandTemplate(shellTemplate, variables)
                return { start: [expanded], end: [] }
            }
        }
        
        // Fallback to generic template if no shell-specific template found
        if (expandable.template) {
            const expanded = this.expandTemplate(expandable.template, variables)
            const position = expandable.position || 'suffix'
            
            if (position === 'end') {
                return { start: [], end: [expanded] }
            } else {
                return { start: [expanded], end: [] }
            }
        }
        
        return { start: [], end: [] }
    }

    parseExpandableFlag(arg: string): { key: string, value: string | undefined } {
        const match = arg.match(/^-([^=:]+)[=:](.+)$/)
        if (match) {
            return { key: match[1], value: match[2] }
        }
        return { key: arg.slice(1), value: undefined }
    }

    expandFlags(args: string[], expandables: Record<string, ExpandableValue> = {}): FlagExpansion {
        const start: string[] = []
        const prefix: string[] = []
        const preArgs: string[] = []
        const suffix: string[] = []
        const end: string[] = []
        const remainingArgs: string[] = []

        for (const arg of args) {
            if (arg.startsWith('--')) {
                remainingArgs.push(arg)
                continue
            }
            
            if (arg.startsWith('-') && arg.length > 1) {
                const { key, value } = this.parseExpandableFlag(arg)
                
                // Handle special flags
                if (key === 'echo') {
                    process.env.PAE_ECHO = '1'
                    continue
                }
                
                // Check if this is an expandable
                if (expandables[key]) {
                    const expandable = expandables[key]
                    const baseVariables = typeof expandable === 'object' ? expandable.defaults || {} : {}
                    const variables = { ...baseVariables }
                    if (value !== undefined) {
                        // If there's a custom value, use it to override the first default variable
                        // or use the flag key if no defaults exist
                        const defaultKeys = Object.keys(baseVariables)
                        if (defaultKeys.length > 0) {
                            variables[defaultKeys[0]] = value
                        } else {
                            variables[key] = value
                        }
                    }
                    
                    if (typeof expandable === 'string') {
                        // Simple string expansion - default to suffix position
                        suffix.push(expandable)
                    } else {
                        // Check if this expandable has shell-specific templates
                        const hasShellSpecificTemplate = expandable['pwsh-template'] || expandable['linux-template'] || expandable['cmd-template']
                        
                        if (hasShellSpecificTemplate) {
                            // Use new shell-specific template processing
                            const { start: templateStart, end: templateEnd } = this.processShellSpecificTemplate(expandable, variables)
                            
                            // Add start templates
                            start.push(...templateStart)
                            
                            // Add end templates
                            end.push(...templateEnd)
                        } else {
                            // Handle legacy template processing
                            if (expandable.template) {
                                const expanded = this.expandTemplate(expandable.template, variables)
                                const position = expandable.position || 'suffix'
                                
                                switch (position) {
                                    case 'start':
                                        start.push(expanded)
                                        break
                                    case 'prefix':
                                        prefix.push(expanded)
                                        break
                                    case 'pre-args':
                                        preArgs.push(expanded)
                                        break
                                    case 'suffix':
                                    default:
                                        suffix.push(expanded)
                                        break
                                }
                            }
                        }
                    }
                    continue
                }
                
                // Handle short bundle flags like -fs or -sf
                // Only split into individual characters if the entire key is not an expandable
                const shorts = key.split('')
                let hasExpandable = false
                
                // Check if any of the individual characters are expandables
                for (const s of shorts) {
                    if (expandables[s]) {
                        hasExpandable = true
                        break
                    }
                }
                
                // If no individual characters are expandables, treat the entire key as a single flag
                if (!hasExpandable) {
                    remainingArgs.push(arg)
                    continue
                }
                
                // Process individual characters
                for (const s of shorts) {
                    if (expandables[s]) {
                        const expandable = expandables[s]
                        
                        if (typeof expandable === 'string') {
                            suffix.push(expandable)
                        } else {
                            // Check if this expandable has shell-specific templates
                            const hasShellSpecificTemplate = expandable['pwsh-template'] || expandable['linux-template'] || expandable['cmd-template']
                            
                            if (hasShellSpecificTemplate) {
                                // Use new shell-specific template processing for short flags too
                                const { start: templateStart, end: templateEnd } = this.processShellSpecificTemplate(expandable, expandable.defaults || {})
                                
                                // Add start templates
                                start.push(...templateStart)
                                
                                // Add end templates
                                end.push(...templateEnd)
                            } else {
                                // Handle legacy template processing for backward compatibility
                                if (expandable.template) {
                                    const expanded = this.expandTemplate(expandable.template, expandable.defaults || {})
                                    const position = expandable.position || 'suffix'
                                    
                                    switch (position) {
                                        case 'prefix':
                                            prefix.push(expanded)
                                            break
                                        case 'pre-args':
                                            preArgs.push(expanded)
                                            break
                                        case 'suffix':
                                        default:
                                            suffix.push(expanded)
                                            break
                                    }
                                }
                            }
                        }
                    } else {
                        remainingArgs.push(`-${s}`)
                    }
                }
                continue
            }
            
            remainingArgs.push(arg)
        }
        
        return { start, prefix, preArgs, suffix, end, remainingArgs }
    }

    constructWrappedCommand(baseCommand: string[], startTemplates: string[], endTemplates: string[]): string[] {
        // If we have start templates, we need to wrap the command
        if (startTemplates.length > 0) {
            // For now, just prepend start templates and append end templates
            // This is a simplified approach - in a real implementation, you might need
            // more sophisticated command wrapping logic
            return [...startTemplates, ...baseCommand, ...endTemplates]
        }
        
        // No wrapping needed, just append end templates
        return [...baseCommand, ...endTemplates]
    }
}

// Export a singleton instance for convenience
export const expandableProcessor = new ExpandableProcessorService()