import { describe, it, expect } from 'vitest'
import { ConsoleLoggerService } from '../../src/services/ConsoleLogger.service.js'

describe('ConsoleLoggerService', () => {
    let consoleLoggerService: ConsoleLoggerService

    beforeEach(() => {
        consoleLoggerService = new ConsoleLoggerService()
    })

    describe('generate', () => {
        it('should generate log statement for simple variable', () => {
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
            expect(result?.logStatement).toContain('console.log(\'testFunction -> myVar:\', myVar);')
            expect(result?.insertLine).toBe(3)
        })

        it('should generate log statement with class name', () => {
            const documentContent = `
class MyClass {
  testMethod() {
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
            expect(result?.logStatement).toContain('console.log(\'MyClass -> myVar:\', myVar);')
        })

        it('should generate log statement without function name', () => {
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
            expect(result?.logStatement).toContain('console.log(\'myVar:\', myVar);')
        })

        it('should handle arrow functions', () => {
            const documentContent = `
const testArrow = () => {
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
            expect(result?.logStatement).toContain('console.log(\'testArrow -> myVar:\', myVar);')
        })

        it('should handle destructured variables', () => {
            const documentContent = `
function testFunction() {
  const { myVar, otherVar } = { myVar: 'test', otherVar: 'other' };
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
            expect(result?.logStatement).toContain('console.log(\'testFunction -> myVar:\', myVar);')
        })

        it('should return undefined for empty variable name', () => {
            const documentContent = `
function testFunction() {
  const myVar = 'test';
  return myVar;
}
`
            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: '',
                selectionLine: 2,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeUndefined()
        })

        it('should return undefined for whitespace-only variable name', () => {
            const documentContent = `
function testFunction() {
  const myVar = 'test';
  return myVar;
}
`
            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: '   ',
                selectionLine: 2,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result).toBeUndefined()
        })

        it('should handle complex nested structures', () => {
            const documentContent = `
class OuterClass {
  outerMethod() {
    const outerVar = 'outer';
    
    class InnerClass {
      innerMethod() {
        const innerVar = 'inner';
        return innerVar;
      }
    }
  }
}
`
            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'innerVar',
                selectionLine: 6,
                includeClassName: true,
                includeFunctionName: true,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log(\'innerVar:\', innerVar);')
        })

        it('should handle function expressions', () => {
            const documentContent = `
const testFunction = function() {
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
            expect(result?.logStatement).toContain('console.log(\'testFunction -> myVar:\', myVar);')
        })

        it('should handle variables in global scope', () => {
            const documentContent = `
const globalVar = 'global';

function testFunction() {
  return globalVar;
}
`
            const result = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'globalVar',
                selectionLine: 1,
                includeClassName: false,
                includeFunctionName: false,
            })

            expect(result).toBeDefined()
            expect(result?.logStatement).toContain('console.log(\'globalVar:\', globalVar);')
        })
    })

    describe('integration', () => {
        it('should handle multiple variables in same function', () => {
            const documentContent = `
function testFunction() {
  const var1 = 'first';
  const var2 = 'second';
  return var1 + var2;
}
`
            const result1 = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'var1',
                selectionLine: 2,
                includeClassName: false,
                includeFunctionName: true,
            })

            const result2 = consoleLoggerService.generate({
                documentContent,
                fileName: 'test.ts',
                selectedVar: 'var2',
                selectionLine: 3,
                includeClassName: false,
                includeFunctionName: true,
            })

            expect(result1).toBeDefined()
            expect(result2).toBeDefined()
            expect(result1?.logStatement).toContain('console.log(\'testFunction -> var1:\', var1);')
            expect(result2?.logStatement).toContain('console.log(\'testFunction -> var2:\', var2);')
        })
    })
})
