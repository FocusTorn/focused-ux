import { vi } from 'vitest'

export interface EslintRulesTestMocks {
    console: {
        log: ReturnType<typeof vi.fn>
        error: ReturnType<typeof vi.fn>
        warn: ReturnType<typeof vi.fn>
    }
}

export function setupEslintRulesTestEnvironment(): EslintRulesTestMocks {
    return {
        console: {
            log: vi.fn(),
            error: vi.fn(),
            warn: vi.fn(),
        },
    }
}

export function resetEslintRulesMocks(mocks: EslintRulesTestMocks): void {
    Object.values(mocks).forEach(mock => {
        if (typeof mock === 'object' && mock !== null) {
            Object.values(mock).forEach(fn => {
                if (typeof fn === 'function' && 'mockClear' in fn) {
                    fn.mockClear()
                }
            })
        }
    })
}
