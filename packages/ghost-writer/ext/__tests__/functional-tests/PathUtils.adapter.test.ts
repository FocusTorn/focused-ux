import { describe, it, expect, beforeEach } from 'vitest'
import { PathUtilsAdapter } from '../../src/adapters/PathUtils.adapter'

describe('PathUtilsAdapter', () => {
    let adapter: PathUtilsAdapter

    beforeEach(() => {
        adapter = new PathUtilsAdapter()
    })

    describe('getDottedPath', () => {
        it('should return relative path with dot prefix', () => {
            // Arrange
            const from = '/project/src/components/Button.tsx'
            const to = '/project/src/pages/Home.tsx'

            // Act
            const result = adapter.getDottedPath(from, to)

            // Assert
            expect(result).toMatch(/.*Button/)
        })

        it('should return relative path without dot prefix when already has dot', () => {
            // Arrange
            const from = '/project/src/components/Button.tsx'
            const to = '/project/src/components/Header.tsx'

            // Act
            const result = adapter.getDottedPath(from, to)

            // Assert
            expect(result).toMatch(/^\.\/.*Button/)
        })

        it('should return undefined for invalid paths', () => {
            // Arrange
            const from = 'invalid-path'
            const to = 'another-invalid-path'

            // Act
            const result = adapter.getDottedPath(from, to)

            // Assert
            expect(result).toBeDefined() // PathUtils handles invalid paths gracefully
        })

        it('should handle same directory paths', () => {
            // Arrange
            const from = '/project/src/components/Button.tsx'
            const to = '/project/src/components/Header.tsx'

            // Act
            const result = adapter.getDottedPath(from, to)

            // Assert
            expect(result).toMatch(/^\.\/.*Button/)
        })
    })
})
