import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GoogleGenAiService } from '../../src/services/GoogleGenAi.service.js'
import { setupTestEnvironment, resetAllMocks } from '../__mocks__/helpers'
import { 
    setupGoogleGenAiSuccessScenario, 
    setupGoogleGenAiErrorScenario, 
    createCCPMockBuilder 
} from '../__mocks__/mock-scenario-builder'

// Mock service classes
class MockWorkspace {
    get = vi.fn()
}

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('GoogleGenAiService', () => {
    let service: GoogleGenAiService
    let mockWorkspace: MockWorkspace
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)

        // Initialize mock services
        mockWorkspace = new MockWorkspace()

        // Initialize service with mocked dependencies
        service = new GoogleGenAiService(mockWorkspace as any)

        // Reset fetch mock
        mockFetch.mockReset()
    })

    describe('countTokens', () => {
        it('should return token count for valid API response', async () => {
            // Arrange
            const text = 'Hello world, this is a test message.'
            const apiKey = 'test-api-key'
            const expectedTokens = 8

            setupGoogleGenAiSuccessScenario(mocks, {
                operation: 'countTokens',
                text,
                apiKey,
                expectedTokens
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ totalTokens: expectedTokens })
            })

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(expectedTokens)
            expect(result.error).toBeUndefined()
            expect(result.errorMessage).toBeUndefined()
            expect(mockFetch).toHaveBeenCalledWith(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:countTokens?key=${apiKey}`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text }]
                        }]
                    })
                })
            )
        })

        it('should return error when API key is missing', async () => {
            // Arrange
            const text = 'Hello world'
            const apiKeyPath = 'ccp.googleApiKey'

            setupGoogleGenAiErrorScenario(mocks, 'missingApiKey', 'API_KEY_MISSING', {
                operation: 'countTokens',
                text,
                apiKeyPath
            })

            mockWorkspace.get.mockReturnValue(null)

            // Mock console.warn to avoid test output
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('API_KEY_MISSING')
            expect(result.errorMessage).toContain('Google API Key not found')
            expect(result.errorMessage).toContain('ccp.google.apiKey')
            expect(mockFetch).not.toHaveBeenCalled()

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should return error when API key is empty string', async () => {
            // Arrange
            const text = 'Hello world'

            setupGoogleGenAiErrorScenario(mocks, 'missingApiKey', 'API_KEY_MISSING', {
                operation: 'countTokens',
                text
            })

            mockWorkspace.get.mockReturnValue('')

            // Mock console.warn to avoid test output
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('API_KEY_MISSING')
            expect(mockFetch).not.toHaveBeenCalled()

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle API error responses', async () => {
            // Arrange
            const text = 'Hello world'
            const apiKey = 'test-api-key'
            const errorResponse = {
                error: {
                    code: 400,
                    message: 'Invalid API key',
                    status: 'INVALID_ARGUMENT'
                }
            }

            setupGoogleGenAiErrorScenario(mocks, 'apiError', 'API_ERROR', {
                operation: 'countTokens',
                text,
                apiKey,
                errorResponse
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: () => Promise.resolve(errorResponse)
            })

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('API_ERROR')
            expect(result.errorMessage).toContain('Google API Error: 400 Bad Request')
            expect(result.errorMessage).toContain('Invalid API key')

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle API error responses without error details', async () => {
            // Arrange
            const text = 'Hello world'
            const apiKey = 'test-api-key'

            setupGoogleGenAiErrorScenario(mocks, 'apiError', 'API_ERROR', {
                operation: 'countTokens',
                text,
                apiKey
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: () => Promise.reject(new Error('Invalid JSON'))
            })

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('API_ERROR')
            expect(result.errorMessage).toContain('Google API Error: 500 Internal Server Error')

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle invalid response format', async () => {
            // Arrange
            const text = 'Hello world'
            const apiKey = 'test-api-key'
            const invalidResponse = { someOtherField: 'value' }

            setupGoogleGenAiErrorScenario(mocks, 'invalidResponse', 'API_ERROR', {
                operation: 'countTokens',
                text,
                apiKey,
                invalidResponse
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(invalidResponse)
            })

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('API_ERROR')
            expect(result.errorMessage).toContain('totalTokens not found or not a number')

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle network errors', async () => {
            // Arrange
            const text = 'Hello world'
            const apiKey = 'test-api-key'
            const networkError = new Error('Network connection failed')

            setupGoogleGenAiErrorScenario(mocks, 'networkError', 'NETWORK_ERROR', {
                operation: 'countTokens',
                text,
                apiKey,
                networkError
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockRejectedValue(networkError)

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('NETWORK_ERROR')
            expect(result.errorMessage).toContain('Network error or unexpected issue')
            expect(result.errorMessage).toContain('Network connection failed')

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle non-Error network failures', async () => {
            // Arrange
            const text = 'Hello world'
            const apiKey = 'test-api-key'

            setupGoogleGenAiErrorScenario(mocks, 'networkError', 'NETWORK_ERROR', {
                operation: 'countTokens',
                text,
                apiKey
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockRejectedValue('String error')

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('NETWORK_ERROR')
            expect(result.errorMessage).toContain('Network error or unexpected issue')

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle empty text input', async () => {
            // Arrange
            const text = ''
            const apiKey = 'test-api-key'
            const expectedTokens = 0

            setupGoogleGenAiSuccessScenario(mocks, {
                operation: 'countTokens',
                text,
                apiKey,
                expectedTokens
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ totalTokens: expectedTokens })
            })

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(expectedTokens)
            expect(result.error).toBeUndefined()
        })

        it('should handle very long text input', async () => {
            // Arrange
            const text = 'A'.repeat(10000)
            const apiKey = 'test-api-key'
            const expectedTokens = 2500 // Approximate for 10k characters

            setupGoogleGenAiSuccessScenario(mocks, {
                operation: 'countTokens',
                text,
                apiKey,
                expectedTokens
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ totalTokens: expectedTokens })
            })

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(expectedTokens)
            expect(result.error).toBeUndefined()
        })

        it('should handle special characters in text', async () => {
            // Arrange
            const text = 'Hello 世界! 🌍 Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?'
            const apiKey = 'test-api-key'
            const expectedTokens = 15

            setupGoogleGenAiSuccessScenario(mocks, {
                operation: 'countTokens',
                text,
                apiKey,
                expectedTokens
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ totalTokens: expectedTokens })
            })

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(expectedTokens)
            expect(result.error).toBeUndefined()
        })

        it('should handle multiline text', async () => {
            // Arrange
            const text = `Line 1
Line 2
Line 3 with multiple words`
            const apiKey = 'test-api-key'
            const expectedTokens = 12

            setupGoogleGenAiSuccessScenario(mocks, {
                operation: 'countTokens',
                text,
                apiKey,
                expectedTokens
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ totalTokens: expectedTokens })
            })

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(expectedTokens)
            expect(result.error).toBeUndefined()
        })

        it('should handle concurrent token counting requests', async () => {
            // Arrange
            const texts = ['Hello world', 'Another text', 'Third text']
            const apiKey = 'test-api-key'
            const expectedTokens = [3, 2, 2]

            setupGoogleGenAiSuccessScenario(mocks, {
                operation: 'concurrentCountTokens',
                texts,
                apiKey,
                expectedTokens
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ totalTokens: expectedTokens[0] })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ totalTokens: expectedTokens[1] })
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({ totalTokens: expectedTokens[2] })
                })

            // Act
            const results = await Promise.all(texts.map(text => service.countTokens(text)))

            // Assert
            expect(results).toHaveLength(3)
            expect(results[0].tokens).toBe(expectedTokens[0])
            expect(results[1].tokens).toBe(expectedTokens[1])
            expect(results[2].tokens).toBe(expectedTokens[2])
            expect(mockFetch).toHaveBeenCalledTimes(3)
        })

        it('should handle timeout scenarios', async () => {
            // Arrange
            const text = 'Hello world'
            const apiKey = 'test-api-key'

            setupGoogleGenAiErrorScenario(mocks, 'timeout', 'NETWORK_ERROR', {
                operation: 'countTokens',
                text,
                apiKey
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockRejectedValue(new Error('Request timeout'))

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.error).toBe('NETWORK_ERROR')
            expect(result.errorMessage).toContain('Request timeout')

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle rate limiting errors', async () => {
            // Arrange
            const text = 'Hello world'
            const apiKey = 'test-api-key'
            const rateLimitError = {
                error: {
                    code: 429,
                    message: 'Rate limit exceeded',
                    status: 'RESOURCE_EXHAUSTED'
                }
            }

            setupGoogleGenAiErrorScenario(mocks, 'rateLimit', 'API_ERROR', {
                operation: 'countTokens',
                text,
                apiKey,
                rateLimitError
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                json: () => Promise.resolve(rateLimitError)
            })

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('API_ERROR')
            expect(result.errorMessage).toContain('Google API Error: 429 Too Many Requests')
            expect(result.errorMessage).toContain('Rate limit exceeded')

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle quota exceeded errors', async () => {
            // Arrange
            const text = 'Hello world'
            const apiKey = 'test-api-key'
            const quotaError = {
                error: {
                    code: 403,
                    message: 'Quota exceeded',
                    status: 'PERMISSION_DENIED'
                }
            }

            setupGoogleGenAiErrorScenario(mocks, 'quotaExceeded', 'API_ERROR', {
                operation: 'countTokens',
                text,
                apiKey,
                quotaError
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: false,
                status: 403,
                statusText: 'Forbidden',
                json: () => Promise.resolve(quotaError)
            })

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('API_ERROR')
            expect(result.errorMessage).toContain('Google API Error: 403 Forbidden')
            expect(result.errorMessage).toContain('Quota exceeded')

            // Cleanup
            consoleSpy.mockRestore()
        })
    })

    describe('edge cases', () => {
        it('should handle undefined text input', async () => {
            // Arrange
            const text = undefined as any
            const apiKey = 'test-api-key'

            setupGoogleGenAiErrorScenario(mocks, 'invalidInput', 'API_ERROR', {
                operation: 'countTokens',
                text,
                apiKey
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: () => Promise.resolve({
                    error: {
                        code: 400,
                        message: 'Invalid input',
                        status: 'INVALID_ARGUMENT'
                    }
                })
            })

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('API_ERROR')

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle null text input', async () => {
            // Arrange
            const text = null as any
            const apiKey = 'test-api-key'

            setupGoogleGenAiErrorScenario(mocks, 'invalidInput', 'API_ERROR', {
                operation: 'countTokens',
                text,
                apiKey
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: () => Promise.resolve({
                    error: {
                        code: 400,
                        message: 'Invalid input',
                        status: 'INVALID_ARGUMENT'
                    }
                })
            })

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('API_ERROR')

            // Cleanup
            consoleSpy.mockRestore()
        })

        it('should handle non-string text input', async () => {
            // Arrange
            const text = 123 as any
            const apiKey = 'test-api-key'

            setupGoogleGenAiErrorScenario(mocks, 'invalidInput', 'API_ERROR', {
                operation: 'countTokens',
                text,
                apiKey
            })

            mockWorkspace.get.mockReturnValue(apiKey)
            mockFetch.mockResolvedValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: () => Promise.resolve({
                    error: {
                        code: 400,
                        message: 'Invalid input',
                        status: 'INVALID_ARGUMENT'
                    }
                })
            })

            // Mock console.error to avoid test output
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            // Act
            const result = await service.countTokens(text)

            // Assert
            expect(result.tokens).toBe(-1)
            expect(result.error).toBe('API_ERROR')

            // Cleanup
            consoleSpy.mockRestore()
        })
    })
})
