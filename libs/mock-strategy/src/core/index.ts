// Core Package Mock Strategy Library
// Provides standardized mock interfaces and helpers for business logic packages

import { vi } from 'vitest'
import { 
    GeneralTestMocks, 
    setupGeneralTestEnvironment as setupGeneral,
    setupFileSystemMocks as setupGeneralFileSystemMocks,
    setupPathMocks as setupGeneralPathMocks,
    resetGeneralMocks,
    GeneralMockBuilder,
    FileSystemScenarioOptions
} from '../gen/index.js'

export interface CoreTestMocks extends GeneralTestMocks {
    yaml?: {
        load: ReturnType<typeof vi.fn>
    }
    buffer?: {
        from: ReturnType<typeof vi.fn>
    }
}

export function setupCoreTestEnvironment(): CoreTestMocks {
    const generalMocks = setupGeneral()
    return {
        ...generalMocks,
        yaml: {
            load: vi.fn(),
        },
        buffer: {
            from: vi.fn(),
        },
    }
}

// File system and path mocks are inherited from GeneralTestMocks
// Use setupGeneralFileSystemMocks and setupGeneralPathMocks directly

export function resetCoreMocks(mocks: CoreTestMocks): void {
    resetGeneralMocks(mocks)
    if (mocks.yaml) mocks.yaml.load.mockReset()
    if (mocks.buffer) mocks.buffer.from.mockReset()
}

// Fluent Builder Pattern
export class CoreMockBuilder extends GeneralMockBuilder {
    constructor(mocks: CoreTestMocks) {
        super(mocks)
    }

    override build(): CoreTestMocks {
        return this.mocks as CoreTestMocks
    }
}

export function createCoreMockBuilder(mocks: CoreTestMocks): CoreMockBuilder {
    return new CoreMockBuilder(mocks)
}