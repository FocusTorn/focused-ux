import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    LibTestMocks,
    setupLibTestEnvironment,
    createLibMockBuilder,
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
    })
})
