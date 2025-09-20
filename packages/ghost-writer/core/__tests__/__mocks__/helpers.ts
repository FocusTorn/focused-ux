import { vi } from 'vitest'
import type { IStorageService } from '../../../src/_interfaces/IStorageService.js'
import type { IPathUtilsService, ICommonUtilsService } from '../../../src/_interfaces/IUtilServices.js'

// ============================================================================
// TEST HELPERS
// ============================================================================

export interface TestMocks {
    storage: IStorageService
    pathUtils: IPathUtilsService
    commonUtils: ICommonUtilsService
}

export function createMockTestEnvironment(): TestMocks {
    return {
        storage: createMockStorageService(),
        pathUtils: createMockPathUtilsService(),
        commonUtils: createMockCommonUtilsService(),
    }
}

export function resetAllMocks(mocks: TestMocks): void {
    vi.clearAllMocks()
    mocks.storage.update.mockReset()
    mocks.storage.get.mockReset()
    mocks.pathUtils.getDottedPath.mockReset()
    mocks.commonUtils.errMsg.mockReset()
}

// ============================================================================
// GHOST WRITER CORE SPECIFIC MOCK CREATORS
// ============================================================================

export function createMockStorageService(): IStorageService {
    return {
        update: vi.fn().mockResolvedValue(undefined),
        get: vi.fn().mockResolvedValue(undefined),
    }
}

export function createMockPathUtilsService(): IPathUtilsService {
    return {
        getDottedPath: vi.fn().mockReturnValue('./component'),
    }
}

export function createMockCommonUtilsService(): ICommonUtilsService {
    return {
        errMsg: vi.fn(),
    }
}

