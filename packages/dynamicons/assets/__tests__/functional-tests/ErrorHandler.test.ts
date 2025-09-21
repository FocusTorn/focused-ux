import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ErrorHandler, ErrorType, ErrorSeverity } from '../../src/utils/error-handler.js'
import {
    setupTestEnvironment,
    resetAllMocks,
} from '../__mocks__/helpers'
import {
    setupErrorHandlingSuccessScenario,
    createDynamiconsAssetsMockBuilder,
} from '../__mocks__/mock-scenario-builder'

describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)
        setupErrorHandlingSuccessScenario(mocks, {
            errorType: 'OPTIMIZATION_FAILED',
            severity: 'HIGH',
            context: 'TestContext',
        })
        errorHandler = new ErrorHandler()
    })

    describe('createError', () => {
        it('should create error with all required properties', () => {
            const error = errorHandler.createError(
                'Test error message',
                ErrorType.OPTIMIZATION_FAILED,
                ErrorSeverity.HIGH,
                'TestContext',
                new Error('Original error'),
                true
            )

            expect(error).toBeDefined()
            expect(error.message).toBe('Test error message')
            expect(error.type).toBe(ErrorType.OPTIMIZATION_FAILED)
            expect(error.severity).toBe(ErrorSeverity.HIGH)
            expect(error.context).toBe('TestContext')
            expect(error.recoverable).toBe(true)
            expect(error.id).toMatch(/^ERR_\d+_\d+$/)
            expect(error.timestamp).toBeInstanceOf(Date)
            expect(error.stack).toContain('Original error')
        })

        it('should create error without original error', () => {
            const error = errorHandler.createError(
                'Test error message',
                ErrorType.FILE_NOT_FOUND,
                ErrorSeverity.MEDIUM,
                'TestContext',
                undefined,
                false
            )

            expect(error.message).toBe('Test error message')
            expect(error.type).toBe(ErrorType.FILE_NOT_FOUND)
            expect(error.severity).toBe(ErrorSeverity.MEDIUM)
            expect(error.context).toBe('TestContext')
            expect(error.recoverable).toBe(false)
            expect(error.stack).toBeUndefined()
        })

        it('should generate unique IDs for multiple errors', () => {
            const error1 = errorHandler.createError('Error 1', ErrorType.OPTIMIZATION_FAILED, ErrorSeverity.HIGH, 'Context1')
            const error2 = errorHandler.createError('Error 2', ErrorType.THEME_GENERATION_FAILED, ErrorSeverity.MEDIUM, 'Context2')

            expect(error1.id).not.toBe(error2.id)
        })
    })

    describe('handleError', () => {
        it('should handle error in verbose mode', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            const error = errorHandler.createError(
                'Test error',
                ErrorType.OPTIMIZATION_FAILED,
                ErrorSeverity.HIGH,
                'TestContext'
            )

            await errorHandler.handleError(error, true)

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('❌ ERROR HANDLED'))
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ID: ' + error.id))
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Type: ' + error.type))
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Severity: ' + error.severity))
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Context: ' + error.context))
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Message: ' + error.message))

            consoleSpy.mockRestore()
        })

        it('should handle error in non-verbose mode', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            const error = errorHandler.createError(
                'Test error',
                ErrorType.OPTIMIZATION_FAILED,
                ErrorSeverity.HIGH,
                'TestContext'
            )

            await errorHandler.handleError(error, false)

            expect(consoleSpy).toHaveBeenCalled()
            const calls = consoleSpy.mock.calls
            expect(calls[0][0]).toContain('❌ \u001b[31mTest error (TestContext)\u001b[0m')

            consoleSpy.mockRestore()
        })

        it('should handle critical errors with appropriate logging', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            
            const error = errorHandler.createError(
                'Critical error',
                ErrorType.OPTIMIZATION_FAILED,
                ErrorSeverity.CRITICAL,
                'TestContext'
            )

            await errorHandler.handleError(error, false)

            // Verify critical error is handled with appropriate severity icon
            expect(consoleSpy).toHaveBeenCalled()
            const calls = consoleSpy.mock.calls
            expect(calls[0][0]).toContain('🔴 \u001b[31mCritical error (TestContext)\u001b[0m')

            consoleSpy.mockRestore()
        })
    })

    describe('getErrorSummary', () => {
        it('should return empty summary for new error handler', () => {
            const summary = errorHandler.getErrorSummary()

            expect(summary.total).toBe(0)
            expect(summary.bySeverity[ErrorSeverity.LOW]).toBe(0)
            expect(summary.bySeverity[ErrorSeverity.MEDIUM]).toBe(0)
            expect(summary.bySeverity[ErrorSeverity.HIGH]).toBe(0)
            expect(summary.bySeverity[ErrorSeverity.CRITICAL]).toBe(0)
        })

        it('should return correct summary after creating errors', () => {
            errorHandler.createError('Error 1', ErrorType.OPTIMIZATION_FAILED, ErrorSeverity.HIGH, 'Context1')
            errorHandler.createError('Error 2', ErrorType.THEME_GENERATION_FAILED, ErrorSeverity.MEDIUM, 'Context2')
            errorHandler.createError('Error 3', ErrorType.OPTIMIZATION_FAILED, ErrorSeverity.CRITICAL, 'Context3')

            const summary = errorHandler.getErrorSummary()

            expect(summary.total).toBe(3)
            expect(summary.bySeverity[ErrorSeverity.HIGH]).toBe(1)
            expect(summary.bySeverity[ErrorSeverity.MEDIUM]).toBe(1)
            expect(summary.bySeverity[ErrorSeverity.CRITICAL]).toBe(1)
            expect(summary.byType[ErrorType.OPTIMIZATION_FAILED]).toBe(2)
            expect(summary.byType[ErrorType.THEME_GENERATION_FAILED]).toBe(1)
        })
    })

    describe('clearErrors', () => {
        it('should clear all errors and reset counter', () => {
            errorHandler.createError('Error 1', ErrorType.OPTIMIZATION_FAILED, ErrorSeverity.HIGH, 'Context1')
            errorHandler.createError('Error 2', ErrorType.THEME_GENERATION_FAILED, ErrorSeverity.MEDIUM, 'Context2')

            expect(errorHandler.getErrorSummary().total).toBe(2)

            errorHandler.clearErrors()

            expect(errorHandler.getErrorSummary().total).toBe(0)
        })
    })

    describe('Enhanced Mock Strategy Examples', () => {
        it('should demonstrate builder pattern for complex scenarios', () => {
            // Using the fluent builder API for complex mock composition
            createDynamiconsAssetsMockBuilder(mocks)
                .errorHandling({
                    errorType: 'OPTIMIZATION_FAILED',
                    severity: 'HIGH',
                    context: 'IconProcessing',
                })
                .build()

            const error = errorHandler.createError(
                'Test error',
                ErrorType.OPTIMIZATION_FAILED,
                ErrorSeverity.HIGH,
                'IconProcessing'
            )

            expect(error.type).toBe(ErrorType.OPTIMIZATION_FAILED)
            expect(error.severity).toBe(ErrorSeverity.HIGH)
            expect(error.context).toBe('IconProcessing')
        })

        it('should demonstrate error scenario handling', () => {
            createDynamiconsAssetsMockBuilder(mocks)
                .error('errorHandling', 'Error handling service unavailable')
                .build()

            // This would be used in scenarios where error handling itself fails
            const error = errorHandler.createError(
                'Service unavailable',
                ErrorType.OPTIMIZATION_FAILED,
                ErrorSeverity.CRITICAL,
                'ErrorHandling'
            )

            expect(error.severity).toBe(ErrorSeverity.CRITICAL)
        })
    })
})
