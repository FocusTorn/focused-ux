import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock the ConfigLoader service
vi.mock('../../../src/services/ConfigLoader.service.js', () => ({
    loadAliasConfig: vi.fn(),
    clearAllCaches: vi.fn(),
    resolveProjectForAlias: vi.fn()
}))

// Mock CLI module to allow importing showDynamicHelp
vi.mock('../../../src/cli.js', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        showDynamicHelp: actual.showDynamicHelp
    }
})

// Mock console methods
const mockConsoleLog = vi.fn()
const mockConsoleError = vi.fn()

describe('JSON Config Loading Tests', () => {
    let originalConsoleLog: typeof console.log
    let originalConsoleError: typeof console.error

    beforeEach(() => {
        originalConsoleLog = console.log
        originalConsoleError = console.error
        
        // Mock console methods
        console.log = mockConsoleLog
        console.error = mockConsoleError
        
        // Reset all mocks
        vi.clearAllMocks()
    })

    afterEach(() => {
        console.log = originalConsoleLog
        console.error = originalConsoleError
        
        // Restore console methods
        vi.restoreAllMocks()
    })

    describe('JSON config loading through ConfigLoader', () => {
        it('should load valid JSON config successfully', async () => {
            const mockConfig = {
                nxPackages: {
                    'test': '@fux/test-package',
                    'testc': { name: 'test-package', suffix: 'core' }
                },
                nxTargets: {
                    'b': 'build',
                    't': 'test'
                },
                commands: {
                    'help': 'Show help information'
                }
            }

            // Mock ConfigLoader.loadAliasConfig
            const { loadAliasConfig } = await import('../../../src/services/ConfigLoader.service.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Import and call HelpCommand directly
            const { HelpCommand } = await import('../../../src/commands/HelpCommand.js')
            const helpCommand = new HelpCommand()
            helpCommand.execute()
            
            // Should display help with the loaded config
            expect(mockConsoleLog).toHaveBeenCalledWith('PAE - Project Alias Expander')
            expect(loadAliasConfig).toHaveBeenCalled()
        })

        it('should handle JSON config loading errors', async () => {
            // Mock ConfigLoader.loadAliasConfig to throw error
            const { loadAliasConfig } = await import('../../../src/services/ConfigLoader.service.js')
            vi.mocked(loadAliasConfig).mockImplementation(() => {
                throw new Error('No configuration file found. Please ensure .pae.json exists in the project root.')
            })

            // Import and call HelpCommand directly
            const { HelpCommand } = await import('../../../src/commands/HelpCommand.js')
            const helpCommand = new HelpCommand()
            helpCommand.execute()
            
            // Should show fallback help mode
            expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  FALLBACK HELP MODE')
            expect(mockConsoleLog).toHaveBeenCalledWith('   Configuration loading failed - showing static help only.')
            expect(mockConsoleLog).toHaveBeenCalledWith('   This usually means:')
            expect(mockConsoleLog).toHaveBeenCalledWith('   • You\'re not in the project root directory')
            expect(mockConsoleLog).toHaveBeenCalledWith('   • The .pae.json file is missing or corrupted')
            expect(mockConsoleLog).toHaveBeenCalledWith('   • There\'s a syntax error in .pae.json')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('   Current working directory:', process.cwd())
            expect(mockConsoleLog).toHaveBeenCalledWith('   Expected config location: .pae.json')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('   To debug this issue, run: pae <command> -d')
        })

        it('should handle invalid JSON config gracefully', async () => {
            // Mock ConfigLoader.loadAliasConfig to throw JSON parsing error
            const { loadAliasConfig } = await import('../../../src/services/ConfigLoader.service.js')
            vi.mocked(loadAliasConfig).mockImplementation(() => {
                throw new Error('Failed to load configuration from .pae.json: Unexpected token } in JSON at position 1')
            })

            // Import and call HelpCommand directly
            const { HelpCommand } = await import('../../../src/commands/HelpCommand.js')
            const helpCommand = new HelpCommand()
            helpCommand.execute()
            
            // Should show fallback help mode
            expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  FALLBACK HELP MODE')
            expect(mockConsoleLog).toHaveBeenCalledWith('   Configuration loading failed - showing static help only.')
        })

        it('should handle missing .pae.json file', async () => {
            // Mock ConfigLoader.loadAliasConfig to throw file not found error
            const { loadAliasConfig } = await import('../../../src/services/ConfigLoader.service.js')
            vi.mocked(loadAliasConfig).mockImplementation(() => {
                throw new Error('No configuration file found. Please ensure .pae.json exists in the project root.')
            })

            // Import and call HelpCommand directly
            const { HelpCommand } = await import('../../../src/commands/HelpCommand.js')
            const helpCommand = new HelpCommand()
            helpCommand.execute()
            
            // Should show fallback help mode with specific error message
            expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  FALLBACK HELP MODE')
            expect(mockConsoleLog).toHaveBeenCalledWith('   Configuration loading failed - showing static help only.')
        })
    })

    describe('JSON config validation', () => {
        it('should handle config with missing required fields', async () => {
            // Mock ConfigLoader.loadAliasConfig to throw validation error
            const { loadAliasConfig } = await import('../../../src/services/ConfigLoader.service.js')
            vi.mocked(loadAliasConfig).mockImplementation(() => {
                throw new Error('Configuration validation failed in .pae.json:\nMissing required field: nxPackages')
            })

            // Import and call HelpCommand directly
            const { HelpCommand } = await import('../../../src/commands/HelpCommand.js')
            const helpCommand = new HelpCommand()
            helpCommand.execute()
            
            // Should show fallback help mode
            expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  FALLBACK HELP MODE')
            expect(mockConsoleLog).toHaveBeenCalledWith('   Configuration loading failed - showing static help only.')
        })

        it('should handle config with invalid nxPackages structure', async () => {
            // Mock ConfigLoader.loadAliasConfig to throw validation error
            const { loadAliasConfig } = await import('../../../src/services/ConfigLoader.service.js')
            vi.mocked(loadAliasConfig).mockImplementation(() => {
                throw new Error('Configuration validation failed in .pae.json:\nPackage alias \'invalid\' missing required \'name\' property')
            })

            // Import and call HelpCommand directly
            const { HelpCommand } = await import('../../../src/commands/HelpCommand.js')
            const helpCommand = new HelpCommand()
            helpCommand.execute()
            
            // Should show fallback help mode
            expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  FALLBACK HELP MODE')
            expect(mockConsoleLog).toHaveBeenCalledWith('   Configuration loading failed - showing static help only.')
        })
    })

    describe('Real-world JSON config scenarios', () => {
        it('should work with actual project config structure', async () => {
            const realConfig = {
                nxPackages: {
                    'ccp': { name: 'context-cherry-picker', suffix: 'ext', full: true },
                    'ccpc': { name: 'context-cherry-picker', suffix: 'core' },
                    'dc': { name: 'dynamicons', suffix: 'ext', full: true },
                    'dcc': { name: 'dynamicons', suffix: 'core' },
                    'gw': { name: 'ghost-writer', suffix: 'ext', full: true },
                    'gwc': { name: 'ghost-writer', suffix: 'core' },
                    'pb': { name: 'project-butler', suffix: 'ext', full: true },
                    'pbc': { name: 'project-butler', suffix: 'core' },
                    'nh': { name: 'note-hub', suffix: 'ext', full: true },
                    'nhc': { name: 'note-hub', suffix: 'core' },
                    'vp': '@fux/vsix-packager',
                    'vsct': '@fux/vscode-test-cli-config',
                    'aka': '@fux/project-alias-expander',
                    'ms': '@fux/mock-strategy',
                    'audit': '@fux/structure-auditor',
                    'cmo': '@fux/cursor-memory-optimizer',
                    'vpack': '@fux/vpack',
                    'vscte': '@fux/vscode-test-executor',
                    'fttc': '@fux/ft-typescript',
                    'reco': '@fux/recommended'
                },
                nxTargets: {
                    'b': 'build',
                    'p': 'package',
                    'pd': 'package:dev',
                    'pub': 'publish',
                    'ct': 'check-types',
                    'ctd': 'check-types:deps',
                    'l': 'lint',
                    'lf': 'lint:deps',
                    'v': 'validate',
                    'vf': 'validate:deps',
                    'a': 'audit',
                    'aa': 'audit:all',
                    'at': 'audit:test',
                    'ac': 'audit:code',
                    't': 'test',
                    'tc': 'test:coverage-tests',
                    'td': 'test:deps',
                    'tdc': 'test:deps:coverage-tests',
                    'ti': 'test:integration',
                    'tf': 'test:file',
                    'c': 'clean',
                    'cc': 'clean:cache',
                    'cd': 'clean:dist',
                    's': 'status',
                    'o': 'optimize',
                    'm': 'monitor'
                },
                'feature-nxTargets': {
                    'b': { 'run-from': 'ext', 'run-target': 'build' },
                    't': { 'run-from': 'ext', 'run-target': 'test:deps --output-style=stream' },
                    'ti': { 'run-from': 'ext', 'run-target': 'test:integration' },
                    'tsc': { 'run-from': 'ext', 'run-target': 'type-check' },
                    'l': { 'run-from': 'ext', 'run-target': 'lint:deps --output-style=stream' },
                    'ct': { 'run-from': 'ext', 'run-target': 'check-types:deps --output-style=stream' }
                },
                'expandable-flags': {
                    's': '--skip-nx-cache',
                    'f': '--fix',
                    'c': '--coverage',
                    'watch': '--watch'
                },
                commands: {
                    'install': 'Install PAE scripts to native modules directory (use --local for dist-based install)',
                    'load': 'Load PAE module into active PowerShell session',
                    'help': 'Show this help with all available aliases and flags (deprecated)'
                }
            }

            // Mock ConfigLoader.loadAliasConfig
            const { loadAliasConfig } = await import('../../../src/services/ConfigLoader.service.js')
            vi.mocked(loadAliasConfig).mockReturnValue(realConfig)

            // Import and call HelpCommand directly
            const { HelpCommand } = await import('../../../src/commands/HelpCommand.js')
            const helpCommand = new HelpCommand()
            helpCommand.execute()
            
            // Should display help with the loaded config
            expect(mockConsoleLog).toHaveBeenCalledWith('PAE - Project Alias Expander')
            expect(loadAliasConfig).toHaveBeenCalled()
        })
    })
})