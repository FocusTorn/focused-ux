import type { ExpandableValue } from '../_types/expandable.types.js'

export class TemplateProcessor {
    /**
     * Process template with {{variable}} syntax
     */
    processTemplate(template: string, variables: Record<string, string>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
            return variables[variable] || match
        })
    }

    /**
     * Process expandable value with new structure
     */
    processExpandableValue(value: ExpandableValue, variables: Record<string, string>): string {
        if (typeof value === 'string') {
            return value
        }

        // Handle new simplified defaults structure
        const defaultValue = value.default || ''
        const processedTemplate = this.processTemplate(value.template || '', {
            ...variables,
            value: defaultValue,
            // Map common variable names
            style: variables.style || defaultValue,
            bailOn: variables.bailOn || defaultValue,
            echoVariant: variables.echoVariant || defaultValue,
        })

        return processedTemplate
    }

    /**
     * Process mutation expressions with {{variable}} syntax
     */
    processMutation(mutation: string, variables: Record<string, string>): string {
        return mutation.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
            return variables[variable] || match
        })
    }

    /**
     * Validate template syntax
     */
    validateTemplate(template: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = []

        // Check for old syntax: single {variable} pattern (not {{variable}})
        // Use negative lookbehind to ensure { is not preceded by another {
        const oldSyntaxPattern = /(?<!\{)\{[a-zA-Z_][a-zA-Z0-9_]*\}/g
        if (oldSyntaxPattern.test(template)) {
            errors.push(`Template uses old syntax '{variable}'. Use '{{variable}}' instead.`)
        }

        return {
            isValid: errors.length === 0,
            errors,
        }
    }

    /**
     * Extract variables from template
     */
    extractVariables(template: string): string[] {
        const matches = template.match(/\{\{(\w+)\}\}/g)
        if (!matches) return []

        return matches.map((match) => match.slice(2, -2)) // Remove {{ and }}
    }

    /**
     * Convert old template syntax to new syntax
     */
    convertToNewSyntax(template: string): string {
        return template.replace(/\{(\w+)\}/g, '{{$1}}')
    }
}
