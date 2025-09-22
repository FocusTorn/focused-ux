import { describe, it, expect, beforeEach } from 'vitest'
import { TreeFormatterService } from '../../src/services/TreeFormatter.service.js'
import { setupTestEnvironment, resetAllMocks } from '../__mocks__/helpers'
import {
    setupTreeFormatterSuccessScenario,
    createCCPMockBuilder
} from '../__mocks__/mock-scenario-builder'
import type { TreeFormatterNode } from '../../src/_interfaces/ITreeFormatterService.js'

describe('TreeFormatterService', () => {
    let service: TreeFormatterService
    let mocks: ReturnType<typeof setupTestEnvironment>

    beforeEach(() => {
        mocks = setupTestEnvironment()
        resetAllMocks(mocks)

        // Initialize service
        service = new TreeFormatterService()
    })

    describe('formatTree', () => {
        it('should format simple root node without children', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project',
                isDirectory: true
            }
            const expectedOutput = 'project/'

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should format root node with details', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project',
                isDirectory: true,
                details: '(5 files)'
            }
            const expectedOutput = 'project/ (5 files)'

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should format root file without directory marker', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'README.md',
                isDirectory: false,
                details: '(2.5 KB)'
            }
            const expectedOutput = 'README.md (2.5 KB)'

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should format tree with single child', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project',
                isDirectory: true,
                children: [
                    {
                        label: 'src',
                        isDirectory: true,
                        children: []
                    }
                ]
            }
            const expectedOutput = `project/
└─ src/`

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should format tree with multiple children', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project',
                isDirectory: true,
                children: [
                    {
                        label: 'src',
                        isDirectory: true,
                        children: []
                    },
                    {
                        label: 'README.md',
                        isDirectory: false,
                        details: '(2.5 KB)'
                    },
                    {
                        label: 'package.json',
                        isDirectory: false,
                        details: '(1.2 KB)'
                    }
                ]
            }
            const expectedOutput = `project/
├─ src/
├─ README.md (2.5 KB)
└─ package.json (1.2 KB)`

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should format nested tree structure', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project',
                isDirectory: true,
                children: [
                    {
                        label: 'src',
                        isDirectory: true,
                        children: [
                            {
                                label: 'components',
                                isDirectory: true,
                                children: [
                                    {
                                        label: 'Button.tsx',
                                        isDirectory: false,
                                        details: '(1.5 KB)'
                                    },
                                    {
                                        label: 'Modal.tsx',
                                        isDirectory: false,
                                        details: '(2.1 KB)'
                                    }
                                ]
                            },
                            {
                                label: 'utils',
                                isDirectory: true,
                                children: [
                                    {
                                        label: 'helpers.ts',
                                        isDirectory: false,
                                        details: '(800 B)'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        label: 'tests',
                        isDirectory: true,
                        children: [
                            {
                                label: 'Button.test.tsx',
                                isDirectory: false,
                                details: '(1.2 KB)'
                            }
                        ]
                    }
                ]
            }
            const expectedOutput = `project/
├─ src/
│  ├─ components/
│  │  ├─ Button.tsx (1.5 KB)
│  │  └─ Modal.tsx (2.1 KB)
│  └─ utils/
│     └─ helpers.ts (800 B)
└─ tests/
   └─ Button.test.tsx (1.2 KB)`

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should handle empty children array', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project',
                isDirectory: true,
                children: []
            }
            const expectedOutput = 'project/'

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should handle undefined children', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project',
                isDirectory: true
                // children is undefined
            }
            const expectedOutput = 'project/'

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should handle mixed file and directory children', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project',
                isDirectory: true,
                children: [
                    {
                        label: 'src',
                        isDirectory: true,
                        children: [
                            {
                                label: 'index.ts',
                                isDirectory: false,
                                details: '(500 B)'
                            }
                        ]
                    },
                    {
                        label: 'README.md',
                        isDirectory: false,
                        details: '(2.5 KB)'
                    },
                    {
                        label: 'docs',
                        isDirectory: true,
                        children: [
                            {
                                label: 'api.md',
                                isDirectory: false,
                                details: '(1.8 KB)'
                            },
                            {
                                label: 'guide.md',
                                isDirectory: false,
                                details: '(3.2 KB)'
                            }
                        ]
                    }
                ]
            }
            const expectedOutput = `project/
├─ src/
│  └─ index.ts (500 B)
├─ README.md (2.5 KB)
└─ docs/
   ├─ api.md (1.8 KB)
   └─ guide.md (3.2 KB)`

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should handle deep nesting levels', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project',
                isDirectory: true,
                children: [
                    {
                        label: 'level1',
                        isDirectory: true,
                        children: [
                            {
                                label: 'level2',
                                isDirectory: true,
                                children: [
                                    {
                                        label: 'level3',
                                        isDirectory: true,
                                        children: [
                                            {
                                                label: 'level4',
                                                isDirectory: true,
                                                children: [
                                                    {
                                                        label: 'deep-file.txt',
                                                        isDirectory: false,
                                                        details: '(100 B)'
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
            const expectedOutput = `project/
└─ level1/
   └─ level2/
      └─ level3/
         └─ level4/
            └─ deep-file.txt (100 B)`

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should handle nodes with only details and no children', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project',
                isDirectory: true,
                details: '(10 files, 2 directories)',
                children: [
                    {
                        label: 'file1.txt',
                        isDirectory: false,
                        details: '(1 KB)'
                    },
                    {
                        label: 'file2.txt',
                        isDirectory: false,
                        details: '(2 KB)'
                    }
                ]
            }
            const expectedOutput = `project/ (10 files, 2 directories)
├─ file1.txt (1 KB)
└─ file2.txt (2 KB)`

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should handle complex tree with various node types', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'my-project',
                isDirectory: true,
                details: '(15 files, 5 directories)',
                children: [
                    {
                        label: 'src',
                        isDirectory: true,
                        details: '(8 files)',
                        children: [
                            {
                                label: 'components',
                                isDirectory: true,
                                children: [
                                    {
                                        label: 'Button.tsx',
                                        isDirectory: false,
                                        details: '(1.5 KB)'
                                    },
                                    {
                                        label: 'Modal.tsx',
                                        isDirectory: false,
                                        details: '(2.1 KB)'
                                    },
                                    {
                                        label: 'Input.tsx',
                                        isDirectory: false,
                                        details: '(1.8 KB)'
                                    }
                                ]
                            },
                            {
                                label: 'utils',
                                isDirectory: true,
                                children: [
                                    {
                                        label: 'helpers.ts',
                                        isDirectory: false,
                                        details: '(800 B)'
                                    },
                                    {
                                        label: 'constants.ts',
                                        isDirectory: false,
                                        details: '(400 B)'
                                    }
                                ]
                            },
                            {
                                label: 'index.ts',
                                isDirectory: false,
                                details: '(200 B)'
                            }
                        ]
                    },
                    {
                        label: 'tests',
                        isDirectory: true,
                        children: [
                            {
                                label: 'components',
                                isDirectory: true,
                                children: [
                                    {
                                        label: 'Button.test.tsx',
                                        isDirectory: false,
                                        details: '(1.2 KB)'
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        label: 'docs',
                        isDirectory: true,
                        children: [
                            {
                                label: 'README.md',
                                isDirectory: false,
                                details: '(3.5 KB)'
                            },
                            {
                                label: 'CHANGELOG.md',
                                isDirectory: false,
                                details: '(1.8 KB)'
                            }
                        ]
                    },
                    {
                        label: 'package.json',
                        isDirectory: false,
                        details: '(1.2 KB)'
                    },
                    {
                        label: 'tsconfig.json',
                        isDirectory: false,
                        details: '(500 B)'
                    }
                ]
            }
            const expectedOutput = `my-project/ (15 files, 5 directories)
├─ src/ (8 files)
│  ├─ components/
│  │  ├─ Button.tsx (1.5 KB)
│  │  ├─ Modal.tsx (2.1 KB)
│  │  └─ Input.tsx (1.8 KB)
│  ├─ utils/
│  │  ├─ helpers.ts (800 B)
│  │  └─ constants.ts (400 B)
│  └─ index.ts (200 B)
├─ tests/
│  └─ components/
│     └─ Button.test.tsx (1.2 KB)
├─ docs/
│  ├─ README.md (3.5 KB)
│  └─ CHANGELOG.md (1.8 KB)
├─ package.json (1.2 KB)
└─ tsconfig.json (500 B)`

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should handle edge case with single file as root', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'single-file.txt',
                isDirectory: false,
                details: '(1 KB)'
            }
            const expectedOutput = 'single-file.txt (1 KB)'

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should handle edge case with empty string labels', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: '',
                isDirectory: true,
                children: [
                    {
                        label: '',
                        isDirectory: false,
                        details: '(0 B)'
                    }
                ]
            }
            const expectedOutput = `/
└─  (0 B)`

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should handle edge case with special characters in labels', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project-with-special-chars_123',
                isDirectory: true,
                children: [
                    {
                        label: 'file-with-dashes.txt',
                        isDirectory: false,
                        details: '(1 KB)'
                    },
                    {
                        label: 'file_with_underscores.txt',
                        isDirectory: false,
                        details: '(2 KB)'
                    },
                    {
                        label: 'file.with.dots.txt',
                        isDirectory: false,
                        details: '(3 KB)'
                    }
                ]
            }
            const expectedOutput = `project-with-special-chars_123/
├─ file-with-dashes.txt (1 KB)
├─ file_with_underscores.txt (2 KB)
└─ file.with.dots.txt (3 KB)`

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })

        it('should handle edge case with very long details', () => {
            // Arrange
            const rootNode: TreeFormatterNode = {
                label: 'project',
                isDirectory: true,
                details: '(This is a very long detail string that might cause formatting issues if not handled properly)',
                children: [
                    {
                        label: 'file.txt',
                        isDirectory: false,
                        details: '(Another very long detail string with lots of information about the file)'
                    }
                ]
            }
            const expectedOutput = `project/ (This is a very long detail string that might cause formatting issues if not handled properly)
└─ file.txt (Another very long detail string with lots of information about the file)`

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'formatTree',
                rootNode,
                expectedOutput
            })

            // Act
            const result = service.formatTree(rootNode)

            // Assert
            expect(result).toBe(expectedOutput)
        })
    })

    describe('_generateTreeString (private method)', () => {
        it('should handle empty children array', () => {
            // Arrange
            const node: TreeFormatterNode = {
                label: 'test',
                isDirectory: true,
                children: []
            }

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'generateTreeString',
                node,
                prefix: '',
                expectedOutput: ''
            })

            // Act - Access private method through any cast
            const result = (service as any)._generateTreeString(node, '')

            // Assert
            expect(result).toBe('')
        })

        it('should handle undefined children', () => {
            // Arrange
            const node: TreeFormatterNode = {
                label: 'test',
                isDirectory: true
                // children is undefined
            }

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'generateTreeString',
                node,
                prefix: '',
                expectedOutput: ''
            })

            // Act
            const result = (service as any)._generateTreeString(node, '')

            // Assert
            expect(result).toBe('')
        })

        it('should generate correct tree string with single child', () => {
            // Arrange
            const node: TreeFormatterNode = {
                label: 'parent',
                isDirectory: true,
                children: [
                    {
                        label: 'child',
                        isDirectory: false,
                        details: '(1 KB)'
                    }
                ]
            }

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'generateTreeString',
                node,
                prefix: '',
                expectedOutput: '└─ child (1 KB)\n'
            })

            // Act
            const result = (service as any)._generateTreeString(node, '')

            // Assert
            expect(result).toBe('└─ child (1 KB)\n')
        })

        it('should generate correct tree string with multiple children', () => {
            // Arrange
            const node: TreeFormatterNode = {
                label: 'parent',
                isDirectory: true,
                children: [
                    {
                        label: 'child1',
                        isDirectory: true
                    },
                    {
                        label: 'child2',
                        isDirectory: false,
                        details: '(2 KB)'
                    }
                ]
            }

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'generateTreeString',
                node,
                prefix: '',
                expectedOutput: '├─ child1/\n└─ child2 (2 KB)\n'
            })

            // Act
            const result = (service as any)._generateTreeString(node, '')

            // Assert
            expect(result).toBe('├─ child1/\n└─ child2 (2 KB)\n')
        })

        it('should handle nested children correctly', () => {
            // Arrange
            const node: TreeFormatterNode = {
                label: 'parent',
                isDirectory: true,
                children: [
                    {
                        label: 'child1',
                        isDirectory: true,
                        children: [
                            {
                                label: 'grandchild',
                                isDirectory: false,
                                details: '(500 B)'
                            }
                        ]
                    }
                ]
            }

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'generateTreeString',
                node,
                prefix: '',
                expectedOutput: '└─ child1/\n   └─ grandchild (500 B)\n'
            })

            // Act
            const result = (service as any)._generateTreeString(node, '')

            // Assert
            expect(result).toBe('└─ child1/\n   └─ grandchild (500 B)\n')
        })

        it('should handle complex prefix patterns', () => {
            // Arrange
            const node: TreeFormatterNode = {
                label: 'parent',
                isDirectory: true,
                children: [
                    {
                        label: 'child1',
                        isDirectory: true,
                        children: [
                            {
                                label: 'grandchild1',
                                isDirectory: false
                            },
                            {
                                label: 'grandchild2',
                                isDirectory: false
                            }
                        ]
                    },
                    {
                        label: 'child2',
                        isDirectory: true,
                        children: [
                            {
                                label: 'grandchild3',
                                isDirectory: false
                            }
                        ]
                    }
                ]
            }

            setupTreeFormatterSuccessScenario(mocks, {
                operation: 'generateTreeString',
                node,
                prefix: '',
                expectedOutput: '├─ child1/\n│  ├─ grandchild1\n│  └─ grandchild2\n└─ child2/\n   └─ grandchild3\n'
            })

            // Act
            const result = (service as any)._generateTreeString(node, '')

            // Assert
            expect(result).toBe('├─ child1/\n│  ├─ grandchild1\n│  └─ grandchild2\n└─ child2/\n   └─ grandchild3\n')
        })
    })
})
