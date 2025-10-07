import type { AliasConfig } from '../_types/config.types.js'

export interface CommandResolution {
    type: 'reserved' | 'expandable' | 'package'
    command: string
    execution?: string
}

export class CommandResolutionService {
    private readonly reservedCommands = ['install', 'remove', 'refresh', 'help', 'load']

    resolveCommand(command: string, config: AliasConfig): CommandResolution {
        // 1. Check reserved commands first
        if (this.isReservedCommand(command)) {
            return { type: 'reserved', command }
        }

        // 2. Check expandable commands
        if (config['expandable-commands']?.[command]) {
            return {
                type: 'expandable',
                command,
                execution: config['expandable-commands'][command],
            }
        }

        // 3. Process as package alias
        return { type: 'package', command }
    }

    private isReservedCommand(command: string): boolean {
        return this.reservedCommands.includes(command)
    }

    /**
     * Validates that no reserved commands are used as expandable commands
     */
    validateExpandableCommands(config: AliasConfig): string[] {
        const errors: string[] = []
        const expandableCommands = Object.keys(config['expandable-commands'] || {})

        // Check for reserved command conflicts
        const conflicts = expandableCommands.filter((cmd) => this.reservedCommands.includes(cmd))
        if (conflicts.length > 0) {
            errors.push(
                `Reserved commands cannot be used as expandable commands: ${conflicts.join(', ')}`
            )
        }

        return errors
    }
}
