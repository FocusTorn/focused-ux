import type { AliasConfig } from '../_types/index.js'
import { InstallCommand } from './InstallCommand.js'
import { HelpCommand } from './HelpCommand.js'
import { AliasCommand } from './AliasCommand.js'
import { ExpandableCommand } from './ExpandableCommand.js'

export class CommandRouter {
    private installCommand: InstallCommand
    private helpCommand: HelpCommand
    private aliasCommand: AliasCommand
    private expandableCommand: ExpandableCommand
    private debug: (message: string, ...args: unknown[]) => void
    private error: (message: string, ...args: unknown[]) => void
    private getContextAwareFlags: (
        config: AliasConfig,
        target: string,
        expandedTarget: string
    ) => Record<string, any>

    constructor(
        debug: (message: string, ...args: unknown[]) => void,
        error: (message: string, ...args: unknown[]) => void,
        getContextAwareFlags: (
            config: AliasConfig,
            target: string,
            expandedTarget: string
        ) => Record<string, any>
    ) {
        this.debug = debug
        this.error = error
        this.getContextAwareFlags = getContextAwareFlags

        this.installCommand = new InstallCommand(debug, (message: string) =>
            console.log(`✅ ${message}`)
        )
        this.helpCommand = new HelpCommand()
        this.aliasCommand = new AliasCommand(debug, error, getContextAwareFlags)
        this.expandableCommand = new ExpandableCommand(debug)
    }

    async routeCommand(command: string, args: string[], config: AliasConfig): Promise<number> {
        this.debug('Routing command', { command, args })

        switch (command) {
            case 'install':
                return await this.installCommand.execute(args)

            case 'help':
            case '--help':
            case '-h':
                this.helpCommand.execute(config)
                return 0

            default:
                // Check if it's an alias command
                return await this.aliasCommand.execute([command, ...args], config)
        }
    }

    async routeAlias(alias: string, args: string[], config: AliasConfig): Promise<number> {
        this.debug('Routing alias', { alias, args })

        // Check if it's an expandable command first
        if (config['expandable-commands']?.[alias]) {
            return await this.expandableCommand.execute(alias, args, config)
        }

        // Otherwise route as alias command
        return await this.aliasCommand.execute([alias, ...args], config)
    }
}
