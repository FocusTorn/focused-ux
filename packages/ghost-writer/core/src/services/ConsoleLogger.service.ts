import * as ts from 'typescript'
import type { ConsoleLoggerGenerateOptions, ConsoleLoggerResult, IConsoleLoggerService } from '../_interfaces/IConsoleLoggerService.js'

class LogMessageHelper {

    private documentContent: string
    private sourceFile: ts.SourceFile

    constructor(documentContent: string, fileName: string) {
        this.documentContent = documentContent
        this.sourceFile = ts.createSourceFile(fileName, documentContent, ts.ScriptTarget.Latest, true)
    }

    private getLineAndCharacterOfPosition(pos: number): { line: number, character: number } {
        const lineStarts = this.sourceFile.getLineStarts()
        let line = 0

        for (let i = lineStarts.length - 1; i >= 0; i--) {
            if (pos >= lineStarts[i]) {
                line = i
                break
            }
        }

        const character = pos - lineStarts[line]

        return { line, character }
    }

    private lineAt(line: number): { text: string, firstNonWhitespaceCharacterIndex: number } {
        const lines = this.documentContent.split('\n')
        const text = lines[line] || ''
        const firstNonWhitespaceCharacterIndex = text.search(/\S|$/)

        return { text, firstNonWhitespaceCharacterIndex }
    }

    private get lineCount(): number {
        return this.documentContent.split('\n').length
    }

    public getMsgTargetLine(selectionLine: number, selectedVar: string): number {
        const selectedNode = this.findNodeAtLine(selectionLine, selectedVar)

        if (!selectedNode) {
            return selectionLine + 1
        }
        return this.determineTargetLine(selectedNode)
    }

    public generateLogMessage(selectedVar: string, lineOfSelectedVar: number, includeClassName: boolean, includeFunctionName: boolean): string {
        const className = includeClassName ? this.getEnclosingClassName(lineOfSelectedVar, selectedVar) : ''
        const funcName = includeFunctionName ? this.getEnclosingFunctionName(lineOfSelectedVar, selectedVar) : ''
        const lineOfLogMsg = this.getMsgTargetLine(lineOfSelectedVar, selectedVar)
        const spacesBeforeMsg = this.calculateSpaces(lineOfSelectedVar)
        const debuggingMsg = `${spacesBeforeMsg}console.log('${className}${funcName}${selectedVar}:', ${selectedVar});`

        return `${lineOfLogMsg === this.lineCount ? '\n' : ''}${debuggingMsg}\n`
    }

    private findNodeAtLine(line: number, varName: string): ts.Node | undefined {
        let foundNode: ts.Node | undefined
        const traverse = (node: ts.Node) => {
            const nodeStartLine = this.getLineAndCharacterOfPosition(node.getStart()).line
            const nodeEndLine = this.getLineAndCharacterOfPosition(node.getEnd()).line

            if (nodeStartLine <= line && nodeEndLine >= line && node.getText(this.sourceFile).includes(varName)) {
                // Check for regular variable declaration
                if (node.kind === ts.SyntaxKind.VariableDeclaration && (node as any).name.getText(this.sourceFile) === varName) {
                    foundNode = node
                    return
                }
                // Check for destructured variable (BindingElement)
                else if (node.kind === ts.SyntaxKind.BindingElement && (node as any).name.getText(this.sourceFile) === varName) {
                    foundNode = node
                    return
                }
                else if (!foundNode) {
                    foundNode = node
                }
            }
            ts.forEachChild(node, traverse)
        }

        traverse(this.sourceFile)
        return foundNode
    }

    private findAnyNodeAtLine(line: number): ts.Node | undefined {
        let foundNode: ts.Node | undefined
        const traverse = (node: ts.Node) => {
            const nodeStartLine = this.getLineAndCharacterOfPosition(node.getStart()).line
            const nodeEndLine = this.getLineAndCharacterOfPosition(node.getEnd()).line

            if (nodeStartLine <= line && nodeEndLine >= line) {
                if (!foundNode) {
                    foundNode = node
                }
            }
            ts.forEachChild(node, traverse)
        }

        traverse(this.sourceFile)
        return foundNode
    }

    private determineTargetLine(node: ts.Node): number {
        let parent = node.parent

        while (parent) {
            if (ts.isBlock(parent) || ts.isSourceFile(parent)) {
                let statement = node

                while (statement.parent && statement.parent !== parent) {
                    statement = statement.parent
                }
                return this.getLineAndCharacterOfPosition(statement.getEnd()).line + 1
            }
            if (ts.isArrowFunction(parent) && parent.body !== node) {
                return this.getLineAndCharacterOfPosition(node.getEnd()).line + 1
            }
            parent = parent.parent
        }
        return this.getLineAndCharacterOfPosition(node.getEnd()).line + 1
    }

    private calculateSpaces(line: number): string {
        const currentLine = this.lineAt(line)

        return ' '.repeat(currentLine.firstNonWhitespaceCharacterIndex)
    }

    private getEnclosingClassName(lineOfSelectedVar: number, selectedVar: string): string {
        // First find the variable declaration at the line
        const varNode = this.findNodeAtLine(lineOfSelectedVar, selectedVar)

        if (!varNode)
            return ''

        let current = varNode

        while (current) {
            if (ts.isClassDeclaration(current) && current.name) {
                return `${current.name.getText(this.sourceFile)} -> `
            }
            current = current.parent
        }
        return ''
    }

    private getEnclosingFunctionName(lineOfSelectedVar: number, selectedVar: string): string {
        // First find the variable declaration at the line
        const varNode = this.findNodeAtLine(lineOfSelectedVar, selectedVar)

        if (!varNode)
            return ''

        let current = varNode

        while (current) {
            // Function declaration: function myFunction() {}
            if (ts.isFunctionDeclaration(current) && current.name) {
                return `${current.name.getText(this.sourceFile)} -> `
            }
			
            // Function expression: const myFunction = function() {}
            if (ts.isFunctionExpression(current) && current.name) {
                return `${current.name.getText(this.sourceFile)} -> `
            }
			
            // Variable declaration with function: const myFunction = function() {}
            if (ts.isVariableDeclaration(current) && current.name && ts.isIdentifier(current.name)) {
                const initializer = current.initializer

                if (initializer && (ts.isFunctionExpression(initializer) || ts.isArrowFunction(initializer))) {
                    return `${current.name.getText(this.sourceFile)} -> `
                }
            }
			
            // Arrow function: const myFunction = () => {}
            if (ts.isArrowFunction(current)) {
                // Try to find the parent variable declaration
                let parent = current.parent

                while (parent) {
                    if (ts.isVariableDeclaration(parent) && parent.name && ts.isIdentifier(parent.name)) {
                        return `${parent.name.getText(this.sourceFile)} -> `
                    }
                    parent = parent.parent
                }
            }
			
            current = current.parent
        }
        return ''
    }

}

export class ConsoleLoggerService implements IConsoleLoggerService {

    public generate(options: ConsoleLoggerGenerateOptions): ConsoleLoggerResult | undefined {
        const { documentContent, fileName, selectedVar, selectionLine, includeClassName, includeFunctionName } = options

        if (!selectedVar.trim()) {
            return undefined
        }

        const helper = new LogMessageHelper(documentContent, fileName)
        const logStatement = helper.generateLogMessage(selectedVar, selectionLine, includeClassName, includeFunctionName)
        const insertLine = helper.getMsgTargetLine(selectionLine, selectedVar)

        return { logStatement, insertLine }
    }

}
