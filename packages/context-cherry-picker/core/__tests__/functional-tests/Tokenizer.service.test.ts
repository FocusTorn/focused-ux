import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TokenizerService } from '../../src/services/Tokenizer.service.js'
import { setupTestEnvironment, resetAllMocks, setupTokenizerMocks } from '../__mocks__/helpers'
import { 
    setupTokenizerSuccessScenario, 
    setupTokenizerErrorScenario, 
    createCCPMockBuilder 
} from '../__mocks__/mock-scenario-builder'

describe('TokenizerService', () => {
    let service: TokenizerService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        setupTokenizerMocks(mocks)
        resetAllMocks(mocks)

        // Initialize service
        service = new TokenizerService()
    })

    describe('calculateTokens', () => {
        it('should calculate tokens successfully for normal text', async () => {
            // Arrange
            const text = 'Hello world, this is a test message.'
            const expectedTokens = 8

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                text,
                expectedTokens
            })

            mocks.tokenizer.encode.mockReturnValue(Array.from({ length: expectedTokens }, (_, i) => i + 1))

            // Act
            const result = await service.calculateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mocks.tokenizer.encode).toHaveBeenCalledWith(text)
        })

        it('should return 0 for empty text', async () => {
            // Arrange
            const text = ''
            const expectedTokens = 0

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                text,
                expectedTokens
            })

            // Act
            const result = await service.calculateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mocks.tokenizer.encode).not.toHaveBeenCalled()
        })

        it('should return 0 for null text', async () => {
            // Arrange
            const text = null as any
            const expectedTokens = 0

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                text,
                expectedTokens
            })

            // Act
            const result = await service.calculateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mocks.tokenizer.encode).not.toHaveBeenCalled()
        })

        it('should return 0 for undefined text', async () => {
            // Arrange
            const text = undefined as any
            const expectedTokens = 0

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                text,
                expectedTokens
            })

            // Act
            const result = await service.calculateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mocks.tokenizer.encode).not.toHaveBeenCalled()
        })

        it('should handle tokenizer errors gracefully with fallback calculation', async () => {
            // Arrange
            const text = 'This is a test message with some content'
            const expectedTokens = Math.ceil(text.length / 4) // Fallback calculation

            setupTokenizerErrorScenario(mocks, 'encode', 'Tokenizer error', {
                operation: 'calculateTokens',
                text,
                expectedTokens
            })

            mocks.tokenizer.encode.mockImplementation(() => {
                throw new Error('Tokenizer error')
            })

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.calculateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mocks.tokenizer.encode).toHaveBeenCalledWith(text)
            expect(consoleSpy).toHaveBeenCalledWith('[TokenizerService] Error using gpt-tokenizer:', expect.any(Error))
            
            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle very long text efficiently', async () => {
            // Arrange
            const text = 'A'.repeat(10000) // 10,000 character string
            const expectedTokens = 2500 // Assuming 4 chars per token

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                text,
                expectedTokens
            })

            mocks.tokenizer.encode.mockReturnValue(Array.from({ length: expectedTokens }, (_, i) => i + 1))

            // Act
            const result = await service.calculateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mocks.tokenizer.encode).toHaveBeenCalledWith(text)
        })

        it('should handle text with special characters', async () => {
            // Arrange
            const text = 'Hello 世界! 🌍 This has unicode: ñáéíóú'
            const expectedTokens = 15

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                text,
                expectedTokens
            })

            mocks.tokenizer.encode.mockReturnValue(Array.from({ length: expectedTokens }, (_, i) => i + 1))

            // Act
            const result = await service.calculateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mocks.tokenizer.encode).toHaveBeenCalledWith(text)
        })

        it('should handle text with newlines and whitespace', async () => {
            // Arrange
            const text = 'Line 1\nLine 2\n\nLine 4\twith\ttabs'
            const expectedTokens = 12

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                text,
                expectedTokens
            })

            mocks.tokenizer.encode.mockReturnValue(Array.from({ length: expectedTokens }, (_, i) => i + 1))

            // Act
            const result = await service.calculateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mocks.tokenizer.encode).toHaveBeenCalledWith(text)
        })

        it('should handle code-like text', async () => {
            // Arrange
            const text = 'function calculateTokens(text: string): number {\n  return encode(text).length\n}'
            const expectedTokens = 20

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                text,
                expectedTokens
            })

            mocks.tokenizer.encode.mockReturnValue(Array.from({ length: expectedTokens }, (_, i) => i + 1))

            // Act
            const result = await service.calculateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mocks.tokenizer.encode).toHaveBeenCalledWith(text)
        })

        it('should handle JSON-like text', async () => {
            // Arrange
            const text = '{"name": "test", "value": 123, "nested": {"key": "value"}}'
            const expectedTokens = 18

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                text,
                expectedTokens
            })

            mocks.tokenizer.encode.mockReturnValue(Array.from({ length: expectedTokens }, (_, i) => i + 1))

            // Act
            const result = await service.calculateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mocks.tokenizer.encode).toHaveBeenCalledWith(text)
        })

        it('should handle markdown-like text', async () => {
            // Arrange
            const text = '# Header\n\nThis is **bold** and *italic* text.\n\n- List item 1\n- List item 2'
            const expectedTokens = 25

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                text,
                expectedTokens
            })

            mocks.tokenizer.encode.mockReturnValue(Array.from({ length: expectedTokens }, (_, i) => i + 1))

            // Act
            const result = await service.calculateTokens(text)

            // Assert
            expect(result).toBe(expectedTokens)
            expect(mocks.tokenizer.encode).toHaveBeenCalledWith(text)
        })

        it('should handle multiple consecutive calls', async () => {
            // Arrange
            const texts = [
                'First text',
                'Second text',
                'Third text'
            ]
            const expectedTokens = [3, 3, 3]

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                texts,
                expectedTokens
            })

            texts.forEach((text, index) => {
                mocks.tokenizer.encode.mockReturnValueOnce(Array.from({ length: expectedTokens[index] }, (_, i) => i + 1))
            })

            // Act
            const results = await Promise.all(texts.map(text => service.calculateTokens(text)))

            // Assert
            expect(results).toEqual(expectedTokens)
            expect(mocks.tokenizer.encode).toHaveBeenCalledTimes(3)
            texts.forEach(text => {
                expect(mocks.tokenizer.encode).toHaveBeenCalledWith(text)
            })
        })

        it('should handle fallback calculation correctly for different text lengths', async () => {
            // Arrange
            const testCases = [
                { text: 'A', expectedFallback: 1 },
                { text: 'AB', expectedFallback: 1 },
                { text: 'ABC', expectedFallback: 1 },
                { text: 'ABCD', expectedFallback: 1 },
                { text: 'ABCDE', expectedFallback: 2 },
                { text: 'ABCDEFGH', expectedFallback: 2 },
                { text: 'ABCDEFGHIJKLMNOP', expectedFallback: 4 }
            ]

            for (const testCase of testCases) {
                // Reset mocks for each test case
                mocks.tokenizer.encode.mockReset()
                
                setupTokenizerErrorScenario(mocks, 'encode', 'Tokenizer error', {
                    operation: 'calculateTokens',
                    text: testCase.text,
                    expectedTokens: testCase.expectedFallback
                })

                mocks.tokenizer.encode.mockImplementation(() => {
                    throw new Error('Tokenizer error')
                })

                // Mock console.error to avoid test output
                const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

                // Act
                const result = await service.calculateTokens(testCase.text)

                // Assert
                expect(result).toBe(testCase.expectedFallback)
                
                // Cleanup
                consoleSpy.mockRestore()
            }
        })

        it('should handle concurrent token calculations', async () => {
            // Arrange
            const texts = Array.from({ length: 10 }, (_, i) => `Text ${i}`)
            const expectedTokens = 3

            setupTokenizerSuccessScenario(mocks, {
                operation: 'calculateTokens',
                texts,
                expectedTokens: Array(10).fill(expectedTokens)
            })

            texts.forEach(() => {
                mocks.tokenizer.encode.mockReturnValue(Array.from({ length: expectedTokens }, (_, i) => i + 1))
            })

            // Act
            const results = await Promise.all(texts.map(text => service.calculateTokens(text)))

            // Assert
            expect(results).toEqual(Array(10).fill(expectedTokens))
            expect(mocks.tokenizer.encode).toHaveBeenCalledTimes(10)
        })
    })
})
