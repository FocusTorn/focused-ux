import { describe, it, expect, beforeEach } from 'vitest'
import { ConsoleLoggerService } from '../../src/services/ConsoleLogger.service.js'

describe('ConsoleLoggerService - Complex Scenarios', () => {
    let consoleLoggerService: ConsoleLoggerService

    beforeEach(() => {
        consoleLoggerService = new ConsoleLoggerService()
    })

    describe('Class Method Detection', () => {
        it('should generate log statement for class method variable', () => {
            const documentContent = `
class MyClass {
  private myProperty = 'test';
  
  public myMethod() {
    const localVar = 'hello';
    return localVar;
  }
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'localVar',
                selectionLine: 5,
                includeClassName: true,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('localVar')
        })

        it('should generate log statement for class property', () => {
            const documentContent = `
class MyClass {
  private myProperty = 'test';
  
  public myMethod() {
    return this.myProperty;
  }
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'myProperty',
                selectionLine: 2,
                includeClassName: true,
                includeFunctionName: false,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('myProperty')
        })
    })

    describe('Nested Function Handling', () => {
        it('should handle nested function variables', () => {
            const documentContent = `
function outerFunction() {
  const outerVar = 'outer';
  
  function innerFunction() {
    const innerVar = 'inner';
    return innerVar;
  }
  
  return innerFunction();
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'innerVar',
                selectionLine: 5,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('innerVar')
        })

        it('should handle arrow function variables', () => {
            const documentContent = `
const myFunction = () => {
  const arrowVar = 'arrow';
  return arrowVar;
};
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'arrowVar',
                selectionLine: 2,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('arrowVar')
        })
    })

    describe('Complex AST Scenarios', () => {
        it('should handle variable in conditional statement', () => {
            const documentContent = `
function testFunction() {
  const myVar = 'test';
  
  if (myVar) {
    const conditionalVar = 'conditional';
    return conditionalVar;
  }
  
  return myVar;
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'conditionalVar',
                selectionLine: 5,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('conditionalVar')
        })

        it('should handle variable in loop', () => {
            const documentContent = `
function testFunction() {
  const items = ['a', 'b', 'c'];
  
  for (const item of items) {
    const loopVar = item.toUpperCase();
    console.log(loopVar);
  }
  
  return items;
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'loopVar',
                selectionLine: 5,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('loopVar')
        })

        it('should handle variable in try-catch block', () => {
            const documentContent = `
function testFunction() {
  try {
    const tryVar = 'try';
    return tryVar;
  } catch (error) {
    const catchVar = 'catch';
    return catchVar;
  }
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'catchVar',
                selectionLine: 6,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('catchVar')
        })
    })

    describe('Edge Cases', () => {
        it('should handle variable at end of function', () => {
            const documentContent = `
function testFunction() {
  const myVar = 'test';
  return myVar;
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 2,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('myVar')
        })

        it('should handle variable in switch statement', () => {
            const documentContent = `
function testFunction(value: string) {
  switch (value) {
    case 'a':
      const switchVar = 'switch';
      return switchVar;
    default:
      return 'default';
  }
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'switchVar',
                selectionLine: 4,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('switchVar')
        })

        it('should handle variable in async function', () => {
            const documentContent = `
async function testFunction() {
  const asyncVar = 'async';
  await Promise.resolve();
  return asyncVar;
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'asyncVar',
                selectionLine: 2,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('asyncVar')
        })
    })

    describe('Configuration Options', () => {
        it('should include class name when requested', () => {
            const documentContent = `
class MyClass {
  public myMethod() {
    const myVar = 'test';
    return myVar;
  }
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 3,
                includeClassName: true,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('myVar')
        })

        it('should exclude class name when not requested', () => {
            const documentContent = `
class MyClass {
  public myMethod() {
    const myVar = 'test';
    return myVar;
  }
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 3,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('myVar')
        })

        it('should exclude function name when not requested', () => {
            const documentContent = `
function testFunction() {
  const myVar = 'test';
  return myVar;
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 2,
                includeClassName: false,
                includeFunctionName: false,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('myVar')
        })
    })

    describe('Error Handling', () => {
        it('should handle invalid TypeScript syntax gracefully', () => {
            const documentContent = `
function testFunction() {
  const myVar = 'test';
  return myVar;
  // Invalid syntax below
  const invalid = 
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 2,
                includeClassName: false,
                includeFunctionName: true,
            })

            // Should still work despite invalid syntax
            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('myVar')
        })

        it('should handle empty document gracefully', () => {
            const documentContent = ''

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'myVar',
                selectionLine: 0,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('myVar')
        })

        it('should handle variable not found in AST', () => {
            const documentContent = `
function testFunction() {
  const myVar = 'test';
  return myVar;
}
`

            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'nonExistentVar',
                selectionLine: 2,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log')
            expect(result?.logStatement).toContain('nonExistentVar')
        })
    })
})
