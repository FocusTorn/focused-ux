import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    LibTestMocks,
    setupLibTestEnvironment,
    createLibMockBuilder,
    setupShellOutputControl,
    conditionalWriteHost,
    conditionalEcho,
    wrapPowerShellScriptWithOutputControl,
    wrapBashScriptWithOutputControl,
    testShellOutputControl,
    setupCliConfigScenario,
} from '../../src/lib/index.js'

describe('Shared Library Package Coverage Tests', () => {
    let mocks: LibTestMocks

    beforeEach(() => {
        mocks = setupLibTestEnvironment()
    })

    describe('Uncovered Lines', () => {
        it('should cover Windows path edge case - empty path (lines 283, 292)', () => {
            const builder = createLibMockBuilder(mocks)
            
            builder.windowsPath()
            
            // Set up basename mock for Windows paths
            mocks.path.basename.mockImplementation((path: string) => path.split('\\').pop() || '')
            
            // Test edge cases for empty paths
            expect(mocks.path.dirname('')).toBe('.')
            expect(mocks.path.basename('')).toBe('')
            
            // Test single character paths
            expect(mocks.path.dirname('a')).toBe('.')
            expect(mocks.path.basename('a')).toBe('a')
            
            // Test paths with only separators
            expect(mocks.path.dirname('\\')).toBe('.')
            expect(mocks.path.basename('\\')).toBe('')
        })

        it('should cover Unix path edge case - empty path (lines 283, 292)', () => {
            const builder = createLibMockBuilder(mocks)
            
            builder.unixPath()
            
            // Set up basename mock for Unix paths
            mocks.path.basename.mockImplementation((path: string) => path.split('/').pop() || '')
            
            // Test edge cases for empty paths
            expect(mocks.path.dirname('')).toBe('.')
            expect(mocks.path.basename('')).toBe('')
            
            // Test single character paths
            expect(mocks.path.dirname('a')).toBe('.')
            expect(mocks.path.basename('a')).toBe('a')
            
            // Test paths with only separators
            expect(mocks.path.dirname('/')).toBe('.')
            expect(mocks.path.basename('/')).toBe('')
        })

        // Shell Output Control Coverage Tests
        it('should cover suppressPowerShellOutput option (line 349)', () => {
            setupShellOutputControl({ suppressPowerShellOutput: true })
            expect(process.env.ENABLE_TEST_CONSOLE).toBe('false')
        })

        it('should cover suppressBashOutput option (line 350)', () => {
            setupShellOutputControl({ suppressBashOutput: true })
            expect(process.env.ENABLE_TEST_CONSOLE).toBe('false')
        })

        it('should cover foreground color parameter in conditionalWriteHost (line 371)', () => {
            process.env.ENABLE_TEST_CONSOLE = 'true'
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            conditionalWriteHost('Test', 'Red')
            expect(consoleSpy).toHaveBeenCalledWith('[PWSH] Test')
            consoleSpy.mockRestore()
        })

        it('should cover background color parameter in conditionalWriteHost (line 372)', () => {
            process.env.ENABLE_TEST_CONSOLE = 'true'
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            conditionalWriteHost('Test', 'Red', 'Blue')
            expect(consoleSpy).toHaveBeenCalledWith('[PWSH] Test')
            consoleSpy.mockRestore()
        })

        it('should cover options parameter in conditionalEcho (line 387)', () => {
            process.env.ENABLE_TEST_CONSOLE = 'true'
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            conditionalEcho('Test', '-e')
            expect(consoleSpy).toHaveBeenCalledWith('[BASH] Test')
            consoleSpy.mockRestore()
        })

        it('should cover missing fileSystem in setupCliConfigScenario (line 526)', () => {
            const mockMocks = { stripJsonComments: vi.fn() }
            expect(() => setupCliConfigScenario(mockMocks)).not.toThrow()
        })

        it('should cover missing stripJsonComments in setupCliConfigScenario (line 531)', () => {
            const mockMocks = { fileSystem: { existsSync: vi.fn(), readFileSync: vi.fn() } }
            expect(() => setupCliConfigScenario(mockMocks)).not.toThrow()
        })

        it('should cover JSON parse error in setupCliConfigScenario (lines 552-553)', () => {
            const mockMocks = {
                fileSystem: { existsSync: vi.fn(), readFileSync: vi.fn() },
                stripJsonComments: vi.fn()
            }
            
            // Mock JSON.stringify to return invalid JSON to trigger the catch block
            const originalStringify = JSON.stringify
            JSON.stringify = vi.fn().mockReturnValue('invalid json')
            
            try {
                setupCliConfigScenario(mockMocks)
                
                // Call the mocked stripJsonComments to trigger the catch block
                expect(() => mockMocks.stripJsonComments()).toThrow('Invalid JSON')
            } finally {
                // Restore original JSON.stringify
                JSON.stringify = originalStringify
            }
        })

        it('should cover PowerShell Write-Host regex fallback (line 411)', () => {
            // Mock String.prototype.match to return null for the writeHostMatch to trigger fallback
            const originalMatch = String.prototype.match
            
            String.prototype.match = function(regex: RegExp) {
                // Return null specifically for the writeHostMatch regex to trigger the fallback
                if (regex.source.includes('(.+?)(?=\\s+-|$)')) {
                    return null
                }
                return originalMatch.call(this, regex)
            }
            
            try {
                const script = 'Write-Host test'
                const result = wrapPowerShellScriptWithOutputControl(script)
                expect(result).toBe('if ($env:ENABLE_TEST_CONSOLE -ne "false") { Write-Host   }')
            } finally {
                String.prototype.match = originalMatch
            }
        })

        it('should cover Bash echo regex fallback (line 491)', () => {
            // Test script with no echo commands to trigger the || [] fallback
            const script = 'ls -la; rm file.txt'
            const result = testShellOutputControl('bash', script)
            expect(result.hasConditionalOutput).toBe(false)
            expect(result.outputCommands).toEqual([])
        })
    })
})
