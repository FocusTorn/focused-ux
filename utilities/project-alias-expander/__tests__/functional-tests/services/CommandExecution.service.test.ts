import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    setupPaeTestEnvironment,
    resetPaeMocks,
    type PaeTestMocks,
} from '../../__mocks__/helpers.js'
import { createPaeMockBuilder } from '../../__mocks__/mock-scenario-builder.js'

// Unmock the CommandExecution service for this specific test
vi.unmock('../../../src/services/CommandExecution.service.js')

import {
    CommandExecutionService,
    setChildProcessTracker,
    commandExecution,
} from '../../../src/services/CommandExecution.service.js'

describe('CommandExecutionService', () => {

    // SETUP ----------------->>
    let mocks: PaeTestMocks
    let commandExecutionService: CommandExecutionService

    beforeEach(async () => {

        //>

        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)

        // Reset all mocks
        vi.clearAllMocks()

        commandExecutionService = new CommandExecutionService()
    
    }) //<

    //----------------------------------------------------<<

    describe('constructor', () => {

        it('should initialize with required dependencies', () => {

            //>

            expect(commandExecutionService).toBeDefined()
            expect(commandExecutionService).toBeInstanceOf(CommandExecutionService)
            expect(typeof commandExecutionService.runCommand).toBe('function')
            expect(typeof commandExecutionService.executeWithPool).toBe('function')
            expect(typeof commandExecutionService.getProcessMetrics).toBe('function')
            expect(typeof commandExecutionService.shutdownProcessPool).toBe('function')
            expect(typeof commandExecutionService.runMany).toBe('function')
        
        }) //<
    
    })

    describe('runCommand function', () => {

        it('should have runCommand method', () => {

            //>

            expect(typeof commandExecutionService.runCommand).toBe('function')
        
        }) //<
        it('should accept command and args parameters', () => {

            //>

            expect(commandExecutionService.runCommand.length).toBeGreaterThanOrEqual(2)
        
        }) //<
    
    })

    describe('executeWithPool function', () => {

        it('should have executeWithPool method', () => {

            //>

            expect(typeof commandExecutionService.executeWithPool).toBe('function')
        
        }) //<
        it('should accept command, args, and options parameters', () => {

            //>

            expect(commandExecutionService.executeWithPool.length).toBeGreaterThanOrEqual(2)
        
        }) //<
    
    })

    describe('getProcessMetrics function', () => {

        it('should have getProcessMetrics method', () => {

            //>

            expect(typeof commandExecutionService.getProcessMetrics).toBe('function')
        
        }) //<
        it('should return metrics object', () => {

            //>

            const metrics = commandExecutionService.getProcessMetrics()
            expect(metrics).toBeDefined()
            expect(typeof metrics).toBe('object')
        
        }) //<
    
    })

    describe('shutdownProcessPool function', () => {

        it('should have shutdownProcessPool method', () => {

            //>

            expect(typeof commandExecutionService.shutdownProcessPool).toBe('function')
        
        }) //<
        it('should return a promise', () => {

            //>

            const result = commandExecutionService.shutdownProcessPool()
            expect(result).toBeInstanceOf(Promise)
        
        }) //<
    
    })

    describe('runMany function', () => {

        it('should have runMany method', () => {

            //>

            expect(typeof commandExecutionService.runMany).toBe('function')
        
        }) //<
        it('should accept runType, targets, flags, and config parameters', () => {

            //>

            expect(commandExecutionService.runMany.length).toBeGreaterThanOrEqual(4)
        
        }) //<
    
    })

    describe('setChildProcessTracker function', () => {

        it('should have setChildProcessTracker function', () => {

            //>

            expect(typeof setChildProcessTracker).toBe('function')
        
        }) //<
        it('should accept tracker function parameter', () => {

            //>

            expect(setChildProcessTracker.length).toBeGreaterThanOrEqual(1)
        
        }) //<
    
    })

    describe('singleton instance', () => {

        it('should export singleton commandExecution instance', () => {

            //>

            expect(commandExecution).toBeDefined()
            expect(commandExecution).toBeInstanceOf(CommandExecutionService)
            expect(commandExecution).not.toBe(commandExecutionService) // Different instances
        
        }) //<
    
    })

})
