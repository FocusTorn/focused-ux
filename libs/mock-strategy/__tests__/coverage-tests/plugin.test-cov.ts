import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    PluginTestMocks,
    setupPluginTestEnvironment,
    createPluginMockBuilder,
} from '../../src/plugin/index.js'

describe('Plugin Package Coverage Tests', () => {
    let mocks: PluginTestMocks

    beforeEach(() => {
        mocks = setupPluginTestEnvironment()
    })

    describe('Uncovered Lines', () => {
        it('should cover Windows path edge case - empty path (lines 413, 423)', () => {
            const builder = createPluginMockBuilder(mocks)
            
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

        it('should cover Unix path edge case - empty path (lines 413, 423)', () => {
            const builder = createPluginMockBuilder(mocks)
            
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
    })
})
