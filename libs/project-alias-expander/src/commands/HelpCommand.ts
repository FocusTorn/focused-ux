import type { AliasConfig } from '../_types/index.js'
import { ConfigLoader } from '../services/ConfigLoader.service.js'

export class HelpCommand {

    async execute(config?: AliasConfig): Promise<void> {
        try {
            // Try to load config from JSON, or use provided config
            const helpConfig = config || await ConfigLoader.getInstance().loadConfig()

            if (!helpConfig) {
                throw new Error('Failed to load configuration')
            }
            
            console.log('')
            console.log('PAE - Project Alias Expander')
            console.log('Usage: pae <alias> [target] [flags]')
            console.log('       pae <command> [args]')
            console.log('')
            
            // Show available aliases
            if (helpConfig.nxPackages && Object.keys(helpConfig.nxPackages).length > 0) {
                const desc = helpConfig.nxPackages.desc || 'Project aliases'
                const dimmed = '\x1b[2m'
                const reset = '\x1b[0m'

                console.log(`Available Aliases: ${dimmed}${desc}${reset}`)
                Object.entries(helpConfig.nxPackages).forEach(([alias, project]) => {
                    if (alias !== 'desc') {
                        const projectName = typeof project === 'string' ? project : (project as any).name

                        console.log(`  ${alias.padEnd(8)} → ${projectName}`)
                    }
                })
                console.log('')
            }
            
            // Show available targets
            if (helpConfig.nxTargets && Object.keys(helpConfig.nxTargets).length > 0) {
                const desc = helpConfig.nxTargets.desc || 'Target shortcuts'
                const dimmed = '\x1b[2m'
                const reset = '\x1b[0m'

                console.log(`Available Targets: ${dimmed}${desc}${reset}`)
                Object.entries(helpConfig.nxTargets).forEach(([shortcut, target]) => {
                    if (shortcut !== 'desc') {
                        console.log(`  ${shortcut.padEnd(8)} → ${target}`)
                    }
                })
                console.log('')
            }
            
            // Show feature targets
            if (helpConfig['feature-nxTargets'] && Object.keys(helpConfig['feature-nxTargets']).length > 0) {
                const desc = helpConfig['feature-nxTargets'].desc || 'Feature-specific targets'
                const dimmed = '\x1b[2m'
                const reset = '\x1b[0m'

                console.log(`Feature Targets: ${dimmed}${desc}${reset}`)
                Object.entries(helpConfig['feature-nxTargets']).forEach(([alias, config]) => {
                    if (alias !== 'desc') {
                        console.log(`  ${alias.padEnd(8)} → ${(config as any)['run-target']} (from ${(config as any)['run-from']})`)
                    }
                })
                console.log('')
            }
            
            // Show expandable flags
            if (helpConfig['expandable-flags'] && Object.keys(helpConfig['expandable-flags']).length > 0) {
                const desc = helpConfig['expandable-flags'].desc || 'Flag expansions'
                const dimmed = '\x1b[2m'
                const reset = '\x1b[0m'

                console.log(`expandable Flags: ${dimmed}${desc}${reset}`)
                Object.entries(helpConfig['expandable-flags']).forEach(([flag, expansion]) => {
                    if (flag !== 'desc') {
                        const expansionStr = typeof expansion === 'string' ? expansion : (expansion as any).template || 'template'

                        console.log(`  -${flag.padEnd(8)} → ${expansionStr}`)
                    }
                })
                console.log('')
            }
            
            // Show expandable templates
            if (helpConfig['expandable-templates'] && Object.keys(helpConfig['expandable-templates']).length > 0) {
                const desc = helpConfig['expandable-templates'].desc || 'Template expansions'
                const dimmed = '\x1b[2m'
                const reset = '\x1b[0m'

                console.log(`expandable Templates: ${dimmed}${desc}${reset}`)
                Object.entries(helpConfig['expandable-templates']).forEach(([template, config]) => {
                    if (template !== 'desc') {
                        console.log(`  -${template.padEnd(8)} → ${(config as any)['pwsh-template'] ? 'PowerShell template' : 'Template'}`)
                    }
                })
                console.log('')
            }
            
            // Show expandable commands
            if (helpConfig['expandable-commands'] && Object.keys(helpConfig['expandable-commands']).length > 0) {
                const desc = helpConfig['expandable-commands'].desc || 'Command expansions'
                const dimmed = '\x1b[2m'
                const reset = '\x1b[0m'

                console.log(`expandable Commands: ${dimmed}${desc}${reset}`)
                Object.entries(helpConfig['expandable-commands']).forEach(([alias, command]) => {
                    if (alias !== 'desc') {
                        console.log(`  ${alias.padEnd(8)} → ${command}`)
                    }
                })
                console.log('')
            }
            
            // Show commands
            if (helpConfig.commands && Object.keys(helpConfig.commands).length > 0) {
                const desc = helpConfig.commands.desc || 'PAE commands'
                const dimmed = '\x1b[2m'
                const reset = '\x1b[0m'

                console.log(`Commands: ${dimmed}${desc}${reset}`)
                Object.entries(helpConfig.commands).forEach(([command, description]) => {
                    if (command !== 'desc') {
                        console.log(`  ${command.padEnd(25)} ${description}`)
                    }
                })
                console.log('')
            }
            console.log('Flags:')
            console.log('  -h, --help         Show this help message')
            console.log('  -d, --debug        Enable debug logging')
            console.log('  -echo              Echo commands instead of executing')
            console.log('')
            console.log('Environment Variables:')
            console.log('  PAE_DEBUG=1        Enable debug logging')
            console.log('  PAE_ECHO=1         Echo commands instead of executing')
            console.log('')
        } catch (_error) {
            // Fallback to static help if config loading fails
            console.log('')
            console.log('PAE - Project Alias Expander')
            console.log('Usage: pae <alias> [target] [flags]')
            console.log('       pae <command> [args]')
            console.log('')
            console.log('Commands:')
            console.log('  install                      Install PAE scripts to native modules directory (use --local for dist-based install)')
            console.log('  load                         Load PAE module into active PowerShell session')
            console.log('  remove                       Remove all traces of PAE')
            console.log('  help                         Show this help with all available aliases and flags (deprecated)')
            console.log('')
            console.log('Flags:')
            console.log('  -h, --help         Show this help message')
            console.log('  -d, --debug        Enable debug logging')
            console.log('  -echo              Echo commands instead of executing')
            console.log('')
            console.log('Environment Variables:')
            console.log('  PAE_DEBUG=1        Enable debug logging')
            console.log('  PAE_ECHO=1         Echo commands instead of executing')
            console.log('')
            console.log('⚠️  FALLBACK HELP MODE')
            console.log('   Configuration loading failed - showing static help only.')
            console.log('   This usually means:')
            console.log('   • You\'re not in the project root directory')
            console.log('   • The .pae.json file is missing or corrupted')
            console.log('   • There\'s a syntax error in .pae.json')
            console.log('')
            console.log('   Current working directory:', process.cwd())
            console.log('   Expected config location: .pae.json')
            console.log('')
            console.log('   To debug this issue, run: pae <command> -d')
            console.log('')
        }
    }

}
