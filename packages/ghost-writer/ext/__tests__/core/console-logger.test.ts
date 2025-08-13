import { describe, it, expect, beforeEach } from 'vitest'
import { ConsoleLoggerService } from '@fux/ghost-writer-core'
import type { ConsoleLoggerGenerateOptions } from '@fux/ghost-writer-core'

describe('ConsoleLoggerService', () => {
	let consoleLoggerService: ConsoleLoggerService

	beforeEach(() => {
		consoleLoggerService = new ConsoleLoggerService()
	})

	describe('generate', () => {
		it('should generate basic console.log statement', () => {
			const options: ConsoleLoggerGenerateOptions = {
				documentContent: 'const testVar = "hello";',
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 0,
				includeClassName: false,
				includeFunctionName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'testVar:\', testVar);')
			expect(result?.insertLine).toBe(1)
		})

		it('should return undefined for empty selected variable', () => {
			const options: ConsoleLoggerGenerateOptions = {
				documentContent: 'const testVar = "hello";',
				fileName: 'test.ts',
				selectedVar: '   ',
				selectionLine: 0,
				includeClassName: false,
				includeFunctionName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeUndefined()
		})

		it('should include class name when enabled', () => {
			const documentContent = `
class MyClass {
    constructor() {
        const testVar = "hello";
    }
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 3,
				includeClassName: true,
				includeFunctionName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'MyClass -> testVar:\', testVar);')
		})

		it('should include function name when enabled', () => {
			const documentContent = `
function myFunction() {
    const testVar = "hello";
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 2,
				includeFunctionName: true,
				includeClassName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'myFunction -> testVar:\', testVar);')
		})

		it('should include both class and function names when both enabled', () => {
			const documentContent = `
class MyClass {
    myMethod() {
        const testVar = "hello";
    }
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 3,
				includeClassName: true,
				includeFunctionName: true,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'MyClass -> testVar:\', testVar);')
		})

		it('should handle arrow functions', () => {
			const documentContent = `
const myArrowFunction = () => {
    const testVar = "hello";
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 2,
				includeFunctionName: true,
				includeClassName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'myArrowFunction -> testVar:\', testVar);')
		})

		it('should handle async functions', () => {
			const documentContent = `
async function myAsyncFunction() {
    const testVar = "hello";
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 2,
				includeFunctionName: true,
				includeClassName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('testVar')
		})

		it('should handle const function declarations', () => {
			const documentContent = `
const myConstFunction = function() {
    const testVar = "hello";
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 2,
				includeFunctionName: true,
				includeClassName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('testVar')
		})

		it('should handle nested classes', () => {
			const documentContent = `
class OuterClass {
    class InnerClass {
        constructor() {
            const testVar = "hello";
        }
    }
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 4,
				includeClassName: true,
				includeFunctionName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'InnerClass -> testVar:\', testVar);')
		})

		it('should handle complex indentation', () => {
			const documentContent = `
    class MyClass {
        myMethod() {
            if (true) {
                const testVar = "hello";
            }
        }
    }`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 5,
				includeClassName: true,
				includeFunctionName: true,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('testVar')
		})

		it('should handle variables at end of file', () => {
			const documentContent = `
function myFunction() {
    const testVar = "hello";
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 2,
				includeFunctionName: true,
				includeClassName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('\n')
			expect(result?.insertLine).toBe(3)
		})

		it('should handle multiple variables on same line', () => {
			const documentContent = `
function myFunction() {
    const var1 = "hello", var2 = "world";
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'var1',
				selectionLine: 2,
				includeFunctionName: true,
				includeClassName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('var1')
		})

		it('should handle TypeScript interfaces and types', () => {
			const documentContent = `
interface MyInterface {
    property: string;
}

type MyType = {
    value: string;
}

function myFunction() {
    const testVar: MyType = { value: "hello" };
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 10,
				includeFunctionName: true,
				includeClassName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('testVar')
		})

		it('should handle React components', () => {
			const documentContent = `
import React from 'react';

const MyComponent: React.FC = () => {
    const [state, setState] = React.useState("hello");
    return <div>{state}</div>;
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'MyComponent.tsx',
				selectedVar: 'state',
				selectionLine: 4,
				includeFunctionName: true,
				includeClassName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'MyComponent -> state:\', state);')
		})

		it('should handle destructured variables', () => {
			const documentContent = `
function myFunction() {
    const { prop1, prop2 } = { prop1: "hello", prop2: "world" };
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'prop1',
				selectionLine: 2,
				includeFunctionName: true,
				includeClassName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'myFunction -> prop1:\', prop1);')
		})

		it('should handle array destructuring', () => {
			const documentContent = `
function myFunction() {
    const [first, second] = ["hello", "world"];
}`
			const options: ConsoleLoggerGenerateOptions = {
				documentContent,
				fileName: 'test.ts',
				selectedVar: 'first',
				selectionLine: 2,
				includeFunctionName: true,
				includeClassName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'myFunction -> first:\', first);')
		})
	})

	describe('edge cases', () => {
		it('should handle empty document content', () => {
			const options: ConsoleLoggerGenerateOptions = {
				documentContent: '',
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 0,
				includeClassName: false,
				includeFunctionName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'testVar:\', testVar);')
		})

		it('should handle single line document', () => {
			const options: ConsoleLoggerGenerateOptions = {
				documentContent: 'const testVar = "hello";',
				fileName: 'test.ts',
				selectedVar: 'testVar',
				selectionLine: 0,
				includeClassName: false,
				includeFunctionName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'testVar:\', testVar);')
		})

		it('should handle very long variable names', () => {
			const longVarName = 'a'.repeat(100)
			const options: ConsoleLoggerGenerateOptions = {
				documentContent: `const ${longVarName} = "hello";`,
				fileName: 'test.ts',
				selectedVar: longVarName,
				selectionLine: 0,
				includeClassName: false,
				includeFunctionName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain(`console.log('${longVarName}:', ${longVarName});`)
		})

		it('should handle special characters in variable names', () => {
			const options: ConsoleLoggerGenerateOptions = {
				documentContent: 'const $specialVar = "hello";',
				fileName: 'test.ts',
				selectedVar: '$specialVar',
				selectionLine: 0,
				includeClassName: false,
				includeFunctionName: false,
			}

			const result = consoleLoggerService.generate(options)

			expect(result).toBeDefined()
			expect(result?.logStatement).toContain('console.log(\'$specialVar:\', $specialVar);')
		})
	})
})
