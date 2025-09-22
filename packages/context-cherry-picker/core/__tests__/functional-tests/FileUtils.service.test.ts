import { describe, it, expect, beforeEach } from 'vitest'
import { FileUtilsService } from '../../src/services/FileUtils.service.js'
import { setupTestEnvironment, resetAllMocks } from '../__mocks__/helpers'
import {
    setupFileUtilsSuccessScenario,
    createCCPMockBuilder
} from '../__mocks__/mock-scenario-builder'

describe('FileUtilsService', () => {
    let service: FileUtilsService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)

        // Initialize service
        service = new FileUtilsService()
    })

    describe('formatFileSize', () => {
        it('should format bytes correctly for small files', () => {
            // Arrange
            const testCases = [
                { bytes: 0, expected: '0 B' },
                { bytes: 1, expected: '1 B' },
                { bytes: 512, expected: '512 B' },
                { bytes: 1023, expected: '1023 B' }
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should format kilobytes correctly', () => {
            // Arrange
            const testCases = [
                { bytes: 1024, expected: '1.00 KB' },
                { bytes: 1536, expected: '1.50 KB' },
                { bytes: 2048, expected: '2.00 KB' },
                { bytes: 5120, expected: '5.00 KB' },
                { bytes: 10240, expected: '10.00 KB' },
                { bytes: 102400, expected: '100.00 KB' },
                { bytes: 1048575, expected: '1023.99 KB' } // Just under 1 MB
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should format megabytes correctly', () => {
            // Arrange
            const testCases = [
                { bytes: 1048576, expected: '1.00 MB' }, // Exactly 1 MB
                { bytes: 1572864, expected: '1.50 MB' }, // 1.5 MB
                { bytes: 2097152, expected: '2.00 MB' }, // 2 MB
                { bytes: 5242880, expected: '5.00 MB' }, // 5 MB
                { bytes: 10485760, expected: '10.00 MB' }, // 10 MB
                { bytes: 104857600, expected: '100.00 MB' }, // 100 MB
                { bytes: 1073741824, expected: '1024.00 MB' } // 1 GB
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should handle edge cases', () => {
            // Arrange
            const testCases = [
                { bytes: -1, expected: '-0.00 KB' }, // Negative bytes
                { bytes: -1024, expected: '-1.00 KB' }, // Negative KB
                { bytes: Number.MAX_SAFE_INTEGER, expected: '9007199254740991.00 MB' }, // Very large number
                { bytes: Number.MIN_SAFE_INTEGER, expected: '-9007199254740991.00 MB' }, // Very large negative number
                { bytes: Infinity, expected: 'Infinity KB' }, // Infinity
                { bytes: -Infinity, expected: '-Infinity KB' }, // Negative infinity
                { bytes: NaN, expected: 'NaN KB' } // NaN
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should handle decimal precision correctly', () => {
            // Arrange
            const testCases = [
                { bytes: 1024 + 256, expected: '1.25 KB' }, // 1.25 KB
                { bytes: 1024 + 512, expected: '1.50 KB' }, // 1.5 KB
                { bytes: 1024 + 768, expected: '1.75 KB' }, // 1.75 KB
                { bytes: 1048576 + 262144, expected: '1.25 MB' }, // 1.25 MB
                { bytes: 1048576 + 524288, expected: '1.50 MB' }, // 1.5 MB
                { bytes: 1048576 + 786432, expected: '1.75 MB' } // 1.75 MB
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should handle boundary values correctly', () => {
            // Arrange
            const testCases = [
                { bytes: 1023, expected: '1023 B' }, // Just under 1 KB
                { bytes: 1024, expected: '1.00 KB' }, // Exactly 1 KB
                { bytes: 1025, expected: '1.00 KB' }, // Just over 1 KB
                { bytes: 1048575, expected: '1023.99 KB' }, // Just under 1 MB
                { bytes: 1048576, expected: '1.00 MB' }, // Exactly 1 MB
                { bytes: 1048577, expected: '1.00 MB' } // Just over 1 MB
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should handle common file sizes', () => {
            // Arrange
            const testCases = [
                { bytes: 1024, expected: '1.00 KB' }, // 1 KB
                { bytes: 10240, expected: '10.00 KB' }, // 10 KB
                { bytes: 102400, expected: '100.00 KB' }, // 100 KB
                { bytes: 1048576, expected: '1.00 MB' }, // 1 MB
                { bytes: 10485760, expected: '10.00 MB' }, // 10 MB
                { bytes: 104857600, expected: '100.00 MB' }, // 100 MB
                { bytes: 1073741824, expected: '1024.00 MB' } // 1 GB
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should handle very small decimal values', () => {
            // Arrange
            const testCases = [
                { bytes: 1024.1, expected: '1.00 KB' }, // Slightly over 1 KB
                { bytes: 1024.9, expected: '1.00 KB' }, // Almost 1.01 KB
                { bytes: 1048576.1, expected: '1.00 MB' }, // Slightly over 1 MB
                { bytes: 1048576.9, expected: '1.00 MB' } // Almost 1.01 MB
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should handle floating point precision correctly', () => {
            // Arrange
            const testCases = [
                { bytes: 1024.123456789, expected: '1.00 KB' }, // Should round to 2 decimal places
                { bytes: 1048576.123456789, expected: '1.00 MB' }, // Should round to 2 decimal places
                { bytes: 1536.999999999, expected: '1.50 KB' }, // Should round to 1.50 KB
                { bytes: 1572864.999999999, expected: '1.50 MB' } // Should round to 1.50 MB
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should handle zero and near-zero values', () => {
            // Arrange
            const testCases = [
                { bytes: 0, expected: '0 B' },
                { bytes: 0.1, expected: '0 B' },
                { bytes: 0.9, expected: '0 B' },
                { bytes: 1, expected: '1 B' }
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should handle large numbers that exceed MB range', () => {
            // Arrange
            const testCases = [
                { bytes: 1073741824, expected: '1024.00 MB' }, // 1 GB
                { bytes: 2147483648, expected: '2048.00 MB' }, // 2 GB
                { bytes: 10737418240, expected: '10240.00 MB' }, // 10 GB
                { bytes: 1099511627776, expected: '1048576.00 MB' } // 1 TB
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should handle negative values correctly', () => {
            // Arrange
            const testCases = [
                { bytes: -1, expected: '-0.00 KB' },
                { bytes: -1024, expected: '-1.00 KB' },
                { bytes: -1048576, expected: '-1.00 MB' },
                { bytes: -1536, expected: '-1.50 KB' },
                { bytes: -1572864, expected: '-1.50 MB' }
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })

        it('should handle special number values', () => {
            // Arrange
            const testCases = [
                { bytes: Number.EPSILON, expected: '0 B' }, // Smallest positive number
                { bytes: Number.MAX_VALUE, expected: 'Infinity KB' }, // Largest possible number
                { bytes: Number.MIN_VALUE, expected: '0 B' }, // Smallest positive number
                { bytes: Number.MAX_SAFE_INTEGER, expected: '9007199254740991.00 MB' }, // Largest safe integer
                { bytes: Number.MIN_SAFE_INTEGER, expected: '-9007199254740991.00 MB' } // Smallest safe integer
            ]

            for (const testCase of testCases) {
                setupFileUtilsSuccessScenario(mocks, {
                    operation: 'formatFileSize',
                    bytes: testCase.bytes,
                    expected: testCase.expected
                })

                // Act
                const result = service.formatFileSize(testCase.bytes)

                // Assert
                expect(result).toBe(testCase.expected)
            }
        })
    })
})
