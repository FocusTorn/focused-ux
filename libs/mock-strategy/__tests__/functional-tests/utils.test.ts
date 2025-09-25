import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    MockScenarioOptions,
    FileOperationOptions,
    createMockScenario,
    createMockScenarioWithOptions,
    validateMockCall,
    validateMockCallWith,
    validateMockCallTimes,
    MockStateManager,
    mockStateManager,
    MOCK_STRATEGY_VERSION,
    MOCK_STRATEGY_DESCRIPTION,
} from '../../src/index.js'

describe('Utility Functions and Validation', () => {
    describe('MockScenarioOptions', () => {
        it('should have correct interface structure', () => {
            const options: MockScenarioOptions = {
                shouldSucceed: true,
                errorMessage: 'test error',
                timeout: 5000,
            }

            expect(options.shouldSucceed).toBe(true)
            expect(options.errorMessage).toBe('test error')
            expect(options.timeout).toBe(5000)
        })

        it('should allow partial options', () => {
            const options: MockScenarioOptions = {
                shouldSucceed: false,
            }

            expect(options.shouldSucceed).toBe(false)
            expect(options.errorMessage).toBeUndefined()
            expect(options.timeout).toBeUndefined()
        })
    })

    describe('FileOperationOptions', () => {
        it('should have correct interface structure', () => {
            const options: FileOperationOptions = {
                sourcePath: '/test/source.txt',
                targetPath: '/test/target.txt',
                content: 'test content',
                shouldExist: true,
                fileType: 'file',
            }

            expect(options.sourcePath).toBe('/test/source.txt')
            expect(options.targetPath).toBe('/test/target.txt')
            expect(options.content).toBe('test content')
            expect(options.shouldExist).toBe(true)
            expect(options.fileType).toBe('file')
        })

        it('should allow partial options', () => {
            const options: FileOperationOptions = {
                sourcePath: '/test/source.txt',
            }

            expect(options.sourcePath).toBe('/test/source.txt')
            expect(options.targetPath).toBeUndefined()
            expect(options.content).toBeUndefined()
            expect(options.shouldExist).toBeUndefined()
            expect(options.fileType).toBeUndefined()
        })
    })

    describe('createMockScenario', () => {
        it('should execute setup function and return mocks', () => {
            const mockFn = vi.fn()
            const mocks = { test: mockFn }
            const setupFn = vi.fn().mockImplementation((mocks) => {
                mocks.test.mockReturnValue('test result')
            })

            const result = createMockScenario(setupFn, mocks)

            expect(setupFn).toHaveBeenCalledWith(mocks)
            expect(result).toBe(mocks)
            expect(mockFn()).toBe('test result')
        })

        it('should work with different mock types', () => {
            const mockObj = { prop: vi.fn() }
            const setupFn = vi.fn().mockImplementation((mocks) => {
                mocks.prop.mockReturnValue('result')
            })

            const result = createMockScenario(setupFn, mockObj)

            expect(setupFn).toHaveBeenCalledWith(mockObj)
            expect(result).toBe(mockObj)
            expect(mockObj.prop()).toBe('result')
        })
    })

    describe('createMockScenarioWithOptions', () => {
        it('should execute setup function with options and return mocks', () => {
            const mockFn = vi.fn()
            const mocks = { test: mockFn }
            const options = { timeout: 1000 }
            const setupFn = vi.fn().mockImplementation((mocks, opts) => {
                mocks.test.mockReturnValue(`result with timeout ${opts.timeout}`)
            })

            const result = createMockScenarioWithOptions(setupFn, mocks, options)

            expect(setupFn).toHaveBeenCalledWith(mocks, options)
            expect(result).toBe(mocks)
            expect(mockFn()).toBe('result with timeout 1000')
        })

        it('should work with different option types', () => {
            const mockObj = { prop: vi.fn() }
            const options = { shouldSucceed: false, errorMessage: 'test error' }
            const setupFn = vi.fn().mockImplementation((mocks, opts) => {
                mocks.prop.mockReturnValue(`success: ${opts.shouldSucceed}, error: ${opts.errorMessage}`)
            })

            const result = createMockScenarioWithOptions(setupFn, mockObj, options)

            expect(setupFn).toHaveBeenCalledWith(mockObj, options)
            expect(result).toBe(mockObj)
            expect(mockObj.prop()).toBe('success: false, error: test error')
        })
    })

    describe('validateMockCall', () => {
        it('should validate mock call count', () => {
            const mockFn = vi.fn()
            mockFn('arg1', 'arg2')
            mockFn('arg3', 'arg4')

            expect(() => validateMockCall(mockFn, 2, undefined, expect)).not.toThrow()
            expect(() => validateMockCall(mockFn, 1, undefined, expect)).toThrow()
        })

        it('should validate mock call count and arguments', () => {
            const mockFn = vi.fn()
            mockFn('arg1', 'arg2')

            expect(() => validateMockCall(mockFn, 1, ['arg1', 'arg2'], expect)).not.toThrow()
            expect(() => validateMockCall(mockFn, 1, ['arg3', 'arg4'], expect)).toThrow()
        })

        it('should throw error when expectFn is not provided', () => {
            const mockFn = vi.fn()
            mockFn('arg1')

            expect(() => validateMockCall(mockFn, 1)).toThrow('expectFn parameter is required for validateMockCall')
        })

        it('should work with different argument types', () => {
            const mockFn = vi.fn()
            mockFn({ key: 'value' }, [1, 2, 3])

            expect(() => validateMockCall(mockFn, 1, [{ key: 'value' }, [1, 2, 3]], expect)).not.toThrow()
        })
    })

    describe('validateMockCallWith', () => {
        it('should validate mock call with specific arguments', () => {
            const mockFn = vi.fn()
            mockFn('arg1', 'arg2')

            expect(() => validateMockCallWith(mockFn, ['arg1', 'arg2'], expect)).not.toThrow()
            expect(() => validateMockCallWith(mockFn, ['arg3', 'arg4'], expect)).toThrow()
        })

        it('should throw error when expectFn is not provided', () => {
            const mockFn = vi.fn()
            mockFn('arg1')

            expect(() => validateMockCallWith(mockFn, ['arg1'])).toThrow('expectFn parameter is required for validateMockCallWith')
        })

        it('should work with complex arguments', () => {
            const mockFn = vi.fn()
            const complexArg = { nested: { value: 'test' }, array: [1, 2, 3] }
            mockFn(complexArg)

            expect(() => validateMockCallWith(mockFn, [complexArg], expect)).not.toThrow()
        })
    })

    describe('validateMockCallTimes', () => {
        it('should validate mock call count', () => {
            const mockFn = vi.fn()
            mockFn()
            mockFn()

            expect(() => validateMockCallTimes(mockFn, 2, expect)).not.toThrow()
            expect(() => validateMockCallTimes(mockFn, 1, expect)).toThrow()
        })

        it('should throw error when expectFn is not provided', () => {
            const mockFn = vi.fn()
            mockFn()

            expect(() => validateMockCallTimes(mockFn, 1)).toThrow('expectFn parameter is required for validateMockCallTimes')
        })

        it('should work with zero calls', () => {
            const mockFn = vi.fn()

            expect(() => validateMockCallTimes(mockFn, 0, expect)).not.toThrow()
            expect(() => validateMockCallTimes(mockFn, 1, expect)).toThrow()
        })
    })

    describe('MockStateManager', () => {
        let manager: MockStateManager

        beforeEach(() => {
            manager = new MockStateManager()
        })

        it('should register and retrieve mocks', () => {
            const mocks = { test: vi.fn() }
            manager.register('test-key', mocks)

            const retrieved = manager.get('test-key')
            expect(retrieved).toBe(mocks)
        })

        it('should return undefined for non-existent key', () => {
            const retrieved = manager.get('non-existent')
            expect(retrieved).toBeUndefined()
        })

        it('should reset specific mocks', () => {
            const mocks = { test: vi.fn() }
            mocks.test.mockReturnValue('test')
            manager.register('test-key', mocks)

            // Call the mock
            mocks.test()

            // Reset
            manager.reset('test-key')

            // Verify reset
            expect(mocks.test).toHaveBeenCalledTimes(0)
        })

        it('should reset all registered mocks', () => {
            const mocks1 = { test1: vi.fn() }
            const mocks2 = { test2: vi.fn() }
            
            mocks1.test1.mockReturnValue('test1')
            mocks2.test2.mockReturnValue('test2')
            
            manager.register('key1', mocks1)
            manager.register('key2', mocks2)

            // Call the mocks
            mocks1.test1()
            mocks2.test2()

            // Reset all
            manager.resetAll()

            // Verify reset
            expect(mocks1.test1).toHaveBeenCalledTimes(0)
            expect(mocks2.test2).toHaveBeenCalledTimes(0)
        })

        it('should clear all registered mocks', () => {
            const mocks = { test: vi.fn() }
            manager.register('test-key', mocks)

            manager.clear()

            const retrieved = manager.get('test-key')
            expect(retrieved).toBeUndefined()
        })

        it('should handle nested mock objects', () => {
            const mocks = {
                level1: {
                    level2: {
                        mockFn: vi.fn()
                    }
                }
            }
            
            mocks.level1.level2.mockFn.mockReturnValue('nested')
            manager.register('nested-key', mocks)

            // Call the nested mock
            mocks.level1.level2.mockFn()

            // Reset
            manager.reset('nested-key')

            // Verify reset
            expect(mocks.level1.level2.mockFn).toHaveBeenCalledTimes(0)
        })

        it('should handle mixed mock types', () => {
            const mocks = {
                simpleMock: vi.fn(),
                nestedMocks: {
                    mock1: vi.fn(),
                    mock2: vi.fn()
                },
                nonMock: 'not a mock'
            }
            
            manager.register('mixed-key', mocks)

            // Call mocks
            mocks.simpleMock()
            mocks.nestedMocks.mock1()
            mocks.nestedMocks.mock2()

            // Reset
            manager.reset('mixed-key')

            // Verify reset
            expect(mocks.simpleMock).toHaveBeenCalledTimes(0)
            expect(mocks.nestedMocks.mock1).toHaveBeenCalledTimes(0)
            expect(mocks.nestedMocks.mock2).toHaveBeenCalledTimes(0)
        })
    })

    describe('mockStateManager (global instance)', () => {
        beforeEach(() => {
            mockStateManager.clear()
        })

        it('should be a MockStateManager instance', () => {
            expect(mockStateManager).toBeInstanceOf(MockStateManager)
        })

        it('should work as global instance', () => {
            const mocks = { test: vi.fn() }
            mockStateManager.register('global-test', mocks)

            const retrieved = mockStateManager.get('global-test')
            expect(retrieved).toBe(mocks)
        })
    })

    describe('Library Version Info', () => {
        it('should have correct version', () => {
            expect(MOCK_STRATEGY_VERSION).toBe('1.0.0')
        })

        it('should have correct description', () => {
            expect(MOCK_STRATEGY_DESCRIPTION).toBe('Standardized mock strategy library for FocusedUX packages')
        })
    })
})
