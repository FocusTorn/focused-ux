import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock config module
vi.mock('../../../src/config.js', () => ({
    loadAliasConfig: vi.fn(),
    clearAllCaches: vi.fn()
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

describe('HelpCommand Tests', () => {
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

    describe('showDynamicHelp() function', () => {
        it('should display help with valid configuration', async () => {
            // Mock successful config loading
            const mockConfig = {
                nxPackages: {
                    desc: 'Test project aliases',
                    dc: 'dynamicons',
                    pbc: 'project-butler-core'
                },
                nxTargets: {
                    desc: 'Test target shortcuts',
                    b: 'build',
                    t: 'test'
                }
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Import and call showDynamicHelp directly
            const { showDynamicHelp } = await import('../../../src/cli.js')
            showDynamicHelp()
            
            // The function should display basic help structure
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('PAE - Project Alias Expander')
            expect(mockConsoleLog).toHaveBeenCalledWith('Usage: pae <alias> [target] [flags]')
            expect(mockConsoleLog).toHaveBeenCalledWith('       pae <command> [args]')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('Commands:')
            expect(mockConsoleLog).toHaveBeenCalledWith('  install                      Install PAE scripts to native modules directory (use --local for dist-based install)')
            expect(mockConsoleLog).toHaveBeenCalledWith('  load                         Load PAE module into active PowerShell session')
            expect(mockConsoleLog).toHaveBeenCalledWith('  remove                       Remove all traces of PAE')
            expect(mockConsoleLog).toHaveBeenCalledWith('  help                         Show this help with all available aliases and flags (deprecated)')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('Flags:')
            expect(mockConsoleLog).toHaveBeenCalledWith('  -h, --help         Show this help message')
            expect(mockConsoleLog).toHaveBeenCalledWith('  -d, --debug        Enable debug logging')
            expect(mockConsoleLog).toHaveBeenCalledWith('  -echo              Echo commands instead of executing')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('Environment Variables:')
            expect(mockConsoleLog).toHaveBeenCalledWith('  PAE_DEBUG=1        Enable debug logging')
            expect(mockConsoleLog).toHaveBeenCalledWith('  PAE_ECHO=1         Echo commands instead of executing')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  FALLBACK HELP MODE')
        })

        it('should display fallback help when configuration loading fails', async () => {
            // Mock config loading failure
            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockImplementation(() => {
                throw new Error('Config loading failed')
            })

            // Import and call showDynamicHelp directly
            const { showDynamicHelp } = await import('../../../src/cli.js')
            showDynamicHelp()
            
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('PAE - Project Alias Expander')
            expect(mockConsoleLog).toHaveBeenCalledWith('Usage: pae <alias> [target] [flags]')
            expect(mockConsoleLog).toHaveBeenCalledWith('       pae <command> [args]')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('Commands:')
            expect(mockConsoleLog).toHaveBeenCalledWith('  install                      Install PAE scripts to native modules directory (use --local for dist-based install)')
            expect(mockConsoleLog).toHaveBeenCalledWith('  load                         Load PAE module into active PowerShell session')
            expect(mockConsoleLog).toHaveBeenCalledWith('  remove                       Remove all traces of PAE')
            expect(mockConsoleLog).toHaveBeenCalledWith('  help                         Show this help with all available aliases and flags (deprecated)')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('Flags:')
            expect(mockConsoleLog).toHaveBeenCalledWith('  -h, --help         Show this help message')
            expect(mockConsoleLog).toHaveBeenCalledWith('  -d, --debug        Enable debug logging')
            expect(mockConsoleLog).toHaveBeenCalledWith('  -echo              Echo commands instead of executing')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('Environment Variables:')
            expect(mockConsoleLog).toHaveBeenCalledWith('  PAE_DEBUG=1        Enable debug logging')
            expect(mockConsoleLog).toHaveBeenCalledWith('  PAE_ECHO=1         Echo commands instead of executing')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  FALLBACK HELP MODE')
            expect(mockConsoleLog).toHaveBeenCalledWith('   Configuration loading failed - showing static help only.')
            expect(mockConsoleLog).toHaveBeenCalledWith('   This usually means:')
            expect(mockConsoleLog).toHaveBeenCalledWith('   • You\'re not in the project root directory')
            expect(mockConsoleLog).toHaveBeenCalledWith('   • The config.json file is missing or corrupted')
            expect(mockConsoleLog).toHaveBeenCalledWith('   • There\'s a syntax error in libs/project-alias-expander/config.json')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('   Current working directory:', process.cwd())
            expect(mockConsoleLog).toHaveBeenCalledWith('   Expected config location: libs/project-alias-expander/config.json')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('   To debug this issue, run: pae <command> -d')
            expect(mockConsoleLog).toHaveBeenCalledWith('')
        })
    })

    describe('help command error handling', () => {
        it('should handle configuration loading errors gracefully', async () => {
            // Mock config loading failure
            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockImplementation(() => {
                throw new Error('Config loading failed')
            })

            // Import and call showDynamicHelp directly
            const { showDynamicHelp } = await import('../../../src/cli.js')
            showDynamicHelp()
            
            expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  FALLBACK HELP MODE')
            expect(mockConsoleLog).toHaveBeenCalledWith('   Configuration loading failed - showing static help only.')
        })

        it('should handle null configuration gracefully', async () => {
            // Mock null config
            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(null as any)

            // Import and call showDynamicHelp directly
            const { showDynamicHelp } = await import('../../../src/cli.js')
            showDynamicHelp()
            
            expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  FALLBACK HELP MODE')
        })

        it('should handle undefined configuration gracefully', async () => {
            // Mock undefined config
            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(undefined as any)

            // Import and call showDynamicHelp directly
            const { showDynamicHelp } = await import('../../../src/cli.js')
            showDynamicHelp()
            
            expect(mockConsoleLog).toHaveBeenCalledWith('⚠️  FALLBACK HELP MODE')
        })

        it('should handle malformed configuration gracefully', async () => {
            // Mock malformed config
            const mockConfig = {
                nxPackages: 'invalid', // Should be object
                nxTargets: null,
                'feature-nxTargets': undefined
            }

            const { loadAliasConfig } = await import('../../../src/config.js')
            vi.mocked(loadAliasConfig).mockReturnValue(mockConfig)

            // Import and call showDynamicHelp directly
            const { showDynamicHelp } = await import('../../../src/cli.js')
            showDynamicHelp()
            
            // Should not crash and should show basic help structure
            expect(mockConsoleLog).toHaveBeenCalledWith('')
            expect(mockConsoleLog).toHaveBeenCalledWith('PAE - Project Alias Expander')
        })
    })
})