import { ESLint } from 'eslint'

/**
 * Universal ESLint rule for enforcing consistent spacing between any statement types
 * 
 * This rule extends the built-in padding-line-between-statements to support:
 * - Custom function call patterns (it, describe, test, etc.)
 * - Custom statement types
 * - Flexible configuration for any code patterns
 * 
 * Configuration schema:
 * {
 *   "rules": {
 *     "fux/universal-padding": [
 *       "error",
 *       {
 *         "patterns": [
 *           {
 *             "blankLine": "always|never|any",
 *             "prev": ["const", "let", "var", "it", "describe", "test", "*"],
 *             "next": ["const", "let", "var", "it", "describe", "test", "*"]
 *           }
 *         ],
 *         "customMatchers": {
 *           "it": "it\\s*\\(",
 *           "describe": "describe\\s*\\(",
 *           "test": "test\\s*\\(",
 *           "beforeEach": "beforeEach\\s*\\(",
 *           "afterEach": "afterEach\\s*\\("
 *         }
 *       }
 *     ]
 *   }
 * }
 */
export default {
    meta: {
        type: 'layout',
        docs: {
            description: 'Enforce consistent spacing between any statement types including custom patterns',
            category: 'Stylistic Issues',
            recommended: true,
        },
        fixable: 'whitespace',
        schema: [
            {
                type: 'object',
                properties: {
                    patterns: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                blankLine: {
                                    enum: ['always', 'never', 'any']
                                },
                                prev: {
                                    oneOf: [
                                        { type: 'string' },
                                        { type: 'array', items: { type: 'string' } }
                                    ]
                                },
                                next: {
                                    oneOf: [
                                        { type: 'string' },
                                        { type: 'array', items: { type: 'string' } }
                                    ]
                                }
                            },
                            required: ['blankLine', 'prev', 'next'],
                            additionalProperties: false
                        }
                    },
                    customMatchers: {
                        type: 'object',
                        additionalProperties: {
                            type: 'string'
                        }
                    }
                },
                additionalProperties: false
            }
        ],
        messages: {
            requireBlankLine: 'Expected blank line before this statement',
            disallowBlankLine: 'Unexpected blank line before this statement',
            requireBlankLineAfter: 'Expected blank line after this statement',
            disallowBlankLineAfter: 'Unexpected blank line after this statement',
        },
    },

    create(context) {
        const sourceCode = context.getSourceCode()
        const options = context.options[0] || {}
        const patterns = options.patterns || []

        // Default custom matchers for common test patterns
        const defaultMatchers = {
            'it': /^it\s*\(/,
            'describe': /^describe\s*\(/,
            'test': /^test\s*\(/,
            'beforeEach': /^beforeEach\s*\(/,
            'afterEach': /^afterEach\s*\(/,
            'beforeAll': /^beforeAll\s*\(/,
            'afterAll': /^afterAll\s*\(/,
        }

        const customMatchers = options.customMatchers || {}
        const allMatchers = { ...defaultMatchers, ...customMatchers }

        /**
         * Determine the statement type for a given AST node
         */
        function getStatementType(node) {
            const lineText = sourceCode.getText(node).split('\n')[0].trim()

            // Check custom matchers first
            for (const [type, pattern] of Object.entries(allMatchers)) {
                if (pattern instanceof RegExp) {
                    if (pattern.test(lineText)) {
                        return type
                    }
                } else {
                    // Convert string pattern to regex
                    const regex = new RegExp(pattern)
                    if (regex.test(lineText)) {
                        return type
                    }
                }
            }

            // Fall back to built-in types
            switch (node.type) {
                case 'VariableDeclaration':
                    return node.kind // 'const', 'let', 'var'
                case 'FunctionDeclaration':
                    return 'function'
                case 'ClassDeclaration':
                    return 'class'
                case 'IfStatement':
                    return 'if'
                case 'ForStatement':
                case 'ForInStatement':
                case 'ForOfStatement':
                    return 'for'
                case 'WhileStatement':
                    return 'while'
                case 'SwitchStatement':
                    return 'switch'
                case 'TryStatement':
                    return 'try'
                case 'ReturnStatement':
                    return 'return'
                case 'ThrowStatement':
                    return 'throw'
                case 'BreakStatement':
                    return 'break'
                case 'ContinueStatement':
                    return 'continue'
                case 'ExpressionStatement':
                    return 'expression'
                default:
                    return 'other'
            }
        }

        /**
         * Check if a line is empty (only whitespace)
         */
        function isEmptyLine(lineIndex) {
            const lines = sourceCode.getLines()
            return lineIndex >= 0 && lineIndex < lines.length && !lines[lineIndex]?.trim()
        }

        /**
         * Count blank lines between two line indices
         */
        function countBlankLines(startLine, endLine) {
            let count = 0
            for (let i = startLine + 1; i < endLine; i++) {
                if (isEmptyLine(i)) {
                    count++
                }
            }
            return count
        }

        /**
         * Check if a pattern matches the given statement types
         */
        function matchesPattern(pattern, prevType, nextType) {
            const prevTypes = Array.isArray(pattern.prev) ? pattern.prev : [pattern.prev]
            const nextTypes = Array.isArray(pattern.next) ? pattern.next : [pattern.next]

            const prevMatches = prevTypes.includes('*') || prevTypes.includes(prevType)
            const nextMatches = nextTypes.includes('*') || nextTypes.includes(nextType)

            return prevMatches && nextMatches
        }

        return {
            Program() {
                const statements = []
                const ast = sourceCode.ast

                // Get all top-level statements
                ast.body.forEach(child => {
                    statements.push({
                        node: child,
                        type: getStatementType(child),
                        line: sourceCode.getLocFromIndex(child.range[0]).line - 1
                    })
                })

                for (let i = 0; i < statements.length - 1; i++) {
                    const currentStatement = statements[i]
                    const nextStatement = statements[i + 1]

                    // Check each pattern
                    for (const pattern of patterns) {
                        if (matchesPattern(pattern, currentStatement.type, nextStatement.type)) {
                            const blankLines = countBlankLines(currentStatement.line, nextStatement.line)

                            switch (pattern.blankLine) {
                                case 'always':
                                    if (blankLines === 0) {
                                        context.report({
                                            node: nextStatement.node,
                                            messageId: 'requireBlankLine',
                                            fix(fixer) {
                                                return fixer.insertTextBefore(
                                                    nextStatement.node,
                                                    '\n'
                                                )
                                            }
                                        })
                                    }
                                    break

                                case 'never':
                                    if (blankLines > 0) {
                                        context.report({
                                            node: nextStatement.node,
                                            messageId: 'disallowBlankLine',
                                            fix(fixer) {
                                                // Find the actual blank lines and remove them
                                                const lines = sourceCode.getLines()
                                                const startLine = currentStatement.line + 1
                                                const endLine = nextStatement.line
                                                
                                                let startIndex = null
                                                let endIndex = null
                                                
                                                // Find first blank line
                                                for (let line = startLine; line < endLine; line++) {
                                                    if (isEmptyLine(line)) {
                                                        if (startIndex === null) {
                                                            startIndex = sourceCode.getIndexFromLoc({
                                                                line: line + 1,
                                                                column: 0
                                                            })
                                                        }
                                                        endIndex = sourceCode.getIndexFromLoc({
                                                            line: line + 2,
                                                            column: 0
                                                        })
                                                    }
                                                }
                                                
                                                if (startIndex !== null && endIndex !== null) {
                                                    return fixer.removeRange([startIndex, endIndex])
                                                }
                                            }
                                        })
                                    }
                                    break

                                case 'any':
                                    // No enforcement for 'any'
                                    break
                            }
                        }
                    }
                }
            }
        }
    }
}