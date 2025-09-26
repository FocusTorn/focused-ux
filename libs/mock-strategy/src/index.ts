// Mock Strategy Library
// Provides standardized mock interfaces and helpers for FocusedUX packages

// Note: expect is imported in individual test files to avoid circular dependencies

// Core Package Exports
export * from './core/index.js'

// Extension Package Exports  
export * from './ext/index.js'

// Shared Library Package Exports
export * from './lib/index.js'

// Tool Package Exports
export * from './tool/index.js'

// Plugin Package Exports
export * from './plugin/index.js'

// Common Types
export interface MockScenarioOptions {
    shouldSucceed?: boolean
    errorMessage?: string
    timeout?: number
}

export interface FileOperationOptions {
    sourcePath: string
    targetPath?: string
    content?: string
    shouldExist?: boolean
    fileType?: 'file' | 'directory'
}

// Utility Functions
export function createMockScenario<T>(
    setupFn: (mocks: T) => void,
    mocks: T
): T {
    setupFn(mocks)
    return mocks
}

export function createMockScenarioWithOptions<T, O>(
    setupFn: (mocks: T, options: O) => void,
    mocks: T,
    options: O
): T {
    setupFn(mocks, options)
    return mocks
}

// Mock Validation Helpers
export function validateMockCall(
    mockFn: ReturnType<typeof import('vitest').vi.fn>,
    expectedCallCount: number,
    expectedArgs?: any[],
    expectFn?: any
): void {
    if (!expectFn) {
        throw new Error('expectFn parameter is required for validateMockCall')
    }
    
    expectFn(mockFn).toHaveBeenCalledTimes(expectedCallCount)
    
    if (expectedArgs) {
        expectFn(mockFn).toHaveBeenCalledWith(...expectedArgs)
    }
}

export function validateMockCallWith(
    mockFn: ReturnType<typeof import('vitest').vi.fn>,
    expectedArgs: any[],
    expectFn?: any
): void {
    if (!expectFn) {
        throw new Error('expectFn parameter is required for validateMockCallWith')
    }
    expectFn(mockFn).toHaveBeenCalledWith(...expectedArgs)
}

export function validateMockCallTimes(
    mockFn: ReturnType<typeof import('vitest').vi.fn>,
    expectedCallCount: number,
    expectFn?: any
): void {
    if (!expectFn) {
        throw new Error('expectFn parameter is required for validateMockCallTimes')
    }
    expectFn(mockFn).toHaveBeenCalledTimes(expectedCallCount)
}

// Mock State Management
export class MockStateManager {

    private mocks: Map<string, any> = new Map()

    register<T>(key: string, mocks: T): void {
        this.mocks.set(key, mocks)
    }

    get<T>(key: string): T | undefined {
        return this.mocks.get(key)
    }

    reset(key: string): void {
        const mocks = this.mocks.get(key)

        if (mocks) {
            this.resetMocksRecursively(mocks)
        }
    }

    private resetMocksRecursively(obj: any): void {
        if (obj && typeof obj === 'object') {
            Object.values(obj).forEach((value: any) => {
                if (value && typeof value.mockReset === 'function') {
                    value.mockReset()
                } else if (value && typeof value === 'object') {
                    this.resetMocksRecursively(value)
                }
            })
        }
    }

    resetAll(): void {
        this.mocks.forEach((_, key) => this.reset(key))
    }

    clear(): void {
        this.mocks.clear()
    }

}

// Global Mock State Manager Instance
export const mockStateManager = new MockStateManager()

// Library Version Info
export const MOCK_STRATEGY_VERSION = '1.0.0'
export const MOCK_STRATEGY_DESCRIPTION = 'Standardized mock strategy library for FocusedUX packages'
