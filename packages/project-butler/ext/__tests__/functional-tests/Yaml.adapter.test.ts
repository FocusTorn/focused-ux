import { describe, it, expect, beforeEach } from 'vitest'
import { YamlAdapter } from '../../src/adapters/Yaml.adapter'

describe('YamlAdapter', () => {
    let adapter: YamlAdapter

    beforeEach(() => {
        adapter = new YamlAdapter()
    })

    describe('load', () => {
        it('should parse valid YAML content', () => {
            // Arrange
            const yamlContent = `
ProjectButler:
  packageJson-order:
    - name
    - version
    - scripts
`

            // Act
            const result = adapter.load(yamlContent)

            // Assert
            expect(result).toEqual({
                ProjectButler: {
                    'packageJson-order': ['name', 'version', 'scripts'],
                },
            })
        })

        it('should handle empty YAML content', () => {
            // Act
            const result = adapter.load('')

            // Assert
            expect(result).toBeUndefined()
        })

        it('should handle simple key-value pairs', () => {
            // Arrange
            const yamlContent = 'key: value'

            // Act
            const result = adapter.load(yamlContent)

            // Assert
            expect(result).toEqual({ key: 'value' })
        })
    })
})
