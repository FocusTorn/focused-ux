import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    CoreTestMocks,
    setupCoreTestEnvironment,
    resetCoreMocks,
    setupWindowsPathScenario,
    setupUnixPathScenario,
} from '../../src/core/index.js'

describe('Core Package Coverage Tests', () => {
    let mocks: CoreTestMocks

    beforeEach(() => {
        mocks = setupCoreTestEnvironment()
    })

    describe('Uncovered Lines', () => {
        it('should cover optional yaml mock reset', () => {
            // Add yaml mock to test the optional reset (lines 85-86)
            mocks.yaml = {
                load: vi.fn()
            }
            
            // Call the mock
            mocks.yaml.load('test')
            
            // Reset should handle optional yaml
            resetCoreMocks(mocks)
            
            expect(mocks.yaml.load).toHaveBeenCalledTimes(0)
        })

        it('should cover optional buffer mock reset', () => {
            // Add buffer mock to test the optional reset (lines 85-86)
            mocks.buffer = {
                from: vi.fn()
            }
            
            // Call the mock
            mocks.buffer.from('test')
            
            // Reset should handle optional buffer
            resetCoreMocks(mocks)
            
            expect(mocks.buffer.from).toHaveBeenCalledTimes(0)
        })

        it('should cover Windows path edge case - empty path (lines 171-173)', () => {
            setupWindowsPathScenario(mocks, '', '')
            
            // Test edge cases for empty paths
            expect(mocks.path.dirname('')).toBe('.')
            expect(mocks.path.basename('')).toBe('')
            
            // Test single character paths
            expect(mocks.path.dirname('a')).toBe('.')
            expect(mocks.path.basename('a')).toBe('a')
        })

        it('should cover Unix path edge case - empty path (lines 183-185)', () => {
            setupUnixPathScenario(mocks, '', '')
            
            // Test edge cases for empty paths
            expect(mocks.path.dirname('')).toBe('.')
            expect(mocks.path.basename('')).toBe('')
            
            // Test single character paths
            expect(mocks.path.dirname('a')).toBe('.')
            expect(mocks.path.basename('a')).toBe('a')
        })
    })
})
