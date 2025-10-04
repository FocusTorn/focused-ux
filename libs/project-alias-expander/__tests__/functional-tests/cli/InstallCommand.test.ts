import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock execa before importing
vi.mock('execa', () => ({
    execa: vi.fn().mockImplementation((command, args) => {
        // Handle different execa calls
        if (command === 'powershell' && args && args.includes('Get-ItemProperty')) {
            // This is the --get flag call
            return Promise.resolve({
                stdout: 'local'
            })
        }
        // Default response for other calls
        return Promise.resolve({
            stdout: 'C:\\Users\\test\\Documents\\PowerShell\\profile.ps1'
        })
    })
}))

// Mock fs module
vi.mock('fs', () => ({
    existsSync: vi.fn().mockReturnValue(false),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn().mockReturnValue('# PowerShell Profile\n'),
    appendFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    rmSync: vi.fn()
}))

// Mock ora spinner
vi.mock('ora', () => ({
    default: vi.fn().mockImplementation(() => ({
        start: vi.fn().mockReturnThis(),
        stop: vi.fn(),
        text: vi.fn()
    }))
}))

// Mock shell detection
vi.mock('../../../src/shell.js', () => ({
    detectShell: vi.fn().mockReturnValue('powershell')
}))

// Mock config module
vi.mock('../../../src/services/ConfigLoader.service.js', () => ({
    default: {},
    resolveProjectForAlias: vi.fn(),
    loadAliasConfig: vi.fn(),
    clearAllCaches: vi.fn()
}))

// Mock services
vi.mock('../../../src/services/index.js', () => ({
    commandExecution: {
        executeCommand: vi.fn(),
        shutdownProcessPool: vi.fn()
    },
    expandableProcessor: {
        processExpandables: vi.fn(),
        detectShellType: vi.fn().mockReturnValue('pwsh')
    },
    aliasManager: {
        generateLocalFiles: vi.fn(),
        generateDirectToNativeModules: vi.fn()
    }
}))

describe('InstallCommand Tests', () => {
    let originalArgv: string[]
    let originalEnv: NodeJS.ProcessEnv

    beforeEach(() => {
        // Save original state
        originalArgv = process.argv
        originalEnv = { ...process.env }
        
        // Set test environment variables
        process.env.VITEST = 'true'
        process.env.NODE_ENV = 'test'
        
        // Mock console methods to avoid noise during tests
        vi.spyOn(console, 'log').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        
        // Reset all mocks
        vi.clearAllMocks()
    })

    afterEach(() => {
        // Restore original state
        process.argv = originalArgv
        process.env = originalEnv
        
        // Restore console methods
        vi.restoreAllMocks()
    })

    it('should handle all install command variations', async () => {
        // Import fresh module for each test to avoid isolation issues
        const { main } = await import('../../../src/cli.js')
        
        // Test --local flag
        process.argv = ['node', 'cli.js', 'install', '--local']
        const localResult = await main()
        expect(localResult).toBe(0)
        
        // Test --get flag
        process.argv = ['node', 'cli.js', 'install', '--get']
        const getResult = await main()
        expect(getResult).toBe(0)
        
        // Test --global flag
        process.argv = ['node', 'cli.js', 'install', '--global']
        const globalResult = await main()
        expect(globalResult).toBe(0)
        
        // Test no flags (default)
        process.argv = ['node', 'cli.js', 'install']
        const defaultResult = await main()
        expect(defaultResult).toBe(0)
    })
})