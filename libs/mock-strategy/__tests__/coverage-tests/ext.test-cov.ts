import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    ExtensionTestMocks,
    setupExtensionTestEnvironment,
} from '../../src/ext/index.js'

describe('Extension Package Coverage Tests', () => {
    let mocks: ExtensionTestMocks

    beforeEach(() => {
        mocks = setupExtensionTestEnvironment()
    })

    describe('Uncovered Lines', () => {
        it('should cover activeTextEditor edit callback implementation (lines 88-90)', async () => {
            // Test the actual edit implementation created by setupExtensionTestEnvironment
            const callback = vi.fn().mockImplementation((builder) => {
                builder.insert({ line: 0, character: 0 }, 'text')
                builder.replace({ line: 0, character: 0 }, { line: 0, character: 4 }, 'new text')
                builder.delete({ line: 0, character: 0 }, { line: 0, character: 4 })
            })
            
            const result = await mocks.vscode.window.activeTextEditor.edit(callback)
            
            expect(result).toBe(true)
            expect(callback).toHaveBeenCalledTimes(1)
            
            // Verify the callback was called with an edit builder that has the expected methods
            const editBuilder = callback.mock.calls[0][0]
            expect(editBuilder.insert).toBeDefined()
            expect(editBuilder.replace).toBeDefined()
            expect(editBuilder.delete).toBeDefined()
        })
    })
})
