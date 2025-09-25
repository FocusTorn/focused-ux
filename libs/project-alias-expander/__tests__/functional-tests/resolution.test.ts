import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setupPaeTestEnvironment, resetPaeMocks } from '../__mocks__/helpers'
import { createPaeMockBuilder } from '../__mocks__/mock-scenario-builder'
import { resolveProjectForAliasWithTarget, resolveProjectForFeatureTarget } from '../../src/cli'

describe('PAE CLI Advanced Resolution Functions', () => {
    let mocks: Awaited<ReturnType<typeof setupPaeTestEnvironment>>

    beforeEach(async () => {
        mocks = await setupPaeTestEnvironment()
        await resetPaeMocks(mocks)
    })

    describe('resolveProjectForAliasWithTarget', () => {
        it('should resolve integration test target to ext package', () => {
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'core' as const }
            const target = 'test:integration'

            // Act
            const result = resolveProjectForAliasWithTarget(aliasValue, target)

            // Assert
            expect(result.project).toBe('@fux/project-butler-ext')
            expect(result.full).toBe(false)
        })

        it('should resolve regular target normally', () => {
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'core' as const }
            const target = 'build'

            // Act
            const result = resolveProjectForAliasWithTarget(aliasValue, target)

            // Assert
            expect(result.project).toBe('@fux/project-butler-core')
            expect(result.full).toBe(false)
        })

        it('should handle string alias values', () => {
            // Arrange
            const aliasValue = '@fux/project-butler-core'
            const target = 'test:integration'

            // Act
            const result = resolveProjectForAliasWithTarget(aliasValue, target)

            // Assert
            expect(result.project).toBe('@fux/project-butler-core')
            expect(result.full).toBe(false)
        })

        it('should preserve full flag for integration tests', () => {
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'core' as const, full: true }
            const target = 'test:integration'

            // Act
            const result = resolveProjectForAliasWithTarget(aliasValue, target)

            // Assert
            expect(result.project).toBe('@fux/project-butler-ext')
            expect(result.full).toBe(true)
        })
    })

    describe('resolveProjectForFeatureTarget', () => {
        it('should resolve feature target for object alias', () => {
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'core' as const }
            const featureTarget = { 'run-from': 'ext' as const, 'run-target': 'build' }

            // Act
            const result = resolveProjectForFeatureTarget(aliasValue, featureTarget)

            // Assert
            expect(result.project).toBe('@fux/project-butler-ext')
            expect(result.full).toBe(false)
        })

        it('should resolve feature target for core run-from', () => {
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'ext' as const }
            const featureTarget = { 'run-from': 'core' as const, 'run-target': 'test' }

            // Act
            const result = resolveProjectForFeatureTarget(aliasValue, featureTarget)

            // Assert
            expect(result.project).toBe('@fux/project-butler-core')
            expect(result.full).toBe(false)
        })

        it('should preserve full flag', () => {
            // Arrange
            const aliasValue = { name: 'project-butler', suffix: 'ext' as const, full: true }
            const featureTarget = { 'run-from': 'core' as const, 'run-target': 'test' }

            // Act
            const result = resolveProjectForFeatureTarget(aliasValue, featureTarget)

            // Assert
            expect(result.project).toBe('@fux/project-butler-core')
            expect(result.full).toBe(true)
        })

        it('should fallback to normal resolution for string alias', () => {
            // Arrange
            const aliasValue = '@fux/project-butler-core'
            const featureTarget = { 'run-from': 'ext' as const, 'run-target': 'build' }

            // Act
            const result = resolveProjectForFeatureTarget(aliasValue, featureTarget)

            // Assert
            expect(result.project).toBe('@fux/project-butler-core')
            expect(result.full).toBe(false)
        })
    })
})



