import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Ghost Writer - Simple Integration Tests', () => {
    let document: vscode.TextDocument
    let editor: vscode.TextEditor

    suiteSetup(async () => {
        // Create a simple test document
        const testContent = `
// Simple test file
class TestClass {
    public method(): string {
        const testVar = 'hello';
        return testVar;
    }
}
`

        document = await vscode.workspace.openTextDocument({
            content: testContent,
            language: 'typescript'
        })
        
        editor = await vscode.window.showTextDocument(document)
        assert.ok(editor, 'Editor should be available')
    })

    suiteTeardown(async () => {
        // Don't try to delete untitled documents
        if (document && !document.uri.scheme.includes('untitled')) {
            try {
                await vscode.workspace.fs.delete(document.uri)
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    })

    test('Extension should be activated', async () => {
        const extension = vscode.extensions.getExtension('NewRealityDesigns.fux-ghost-writer')
        assert.ok(extension, 'Ghost Writer extension should be available')
        assert.ok(extension.isActive, 'Ghost Writer extension should be active')
    })

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true)
        
        const expectedCommands = [
            'fux-ghost-writer.storeCodeFragment',
            'fux-ghost-writer.insertImportStatement',
            'fux-ghost-writer.logSelectedVariable'
        ]

        for (const command of expectedCommands) {
            assert.ok(
                commands.includes(command),
                `Command ${command} should be registered`
            )
        }
    })

    test('Should execute store command without error', async () => {
        // Select text
        editor.selection = new vscode.Selection(
            new vscode.Position(4, 8), // Start of 'testVar'
            new vscode.Position(4, 15) // End of 'testVar'
        )

        // Execute command
        await vscode.commands.executeCommand('fux-ghost-writer.storeCodeFragment')

        // Should not throw error
        assert.ok(true, 'Store command should execute without error')
    })

    test('Should execute log command without error', async () => {
        // Select text
        editor.selection = new vscode.Selection(
            new vscode.Position(4, 8), // Start of 'testVar'
            new vscode.Position(4, 15) // End of 'testVar'
        )

        // Execute command
        await vscode.commands.executeCommand('fux-ghost-writer.logSelectedVariable')

        // Should not throw error
        assert.ok(true, 'Log command should execute without error')
    })

    test('Should execute import command without error', async () => {
        // Execute command (may not have stored fragment, but should not crash)
        await vscode.commands.executeCommand('fux-ghost-writer.insertImportStatement')

        // Should not throw error
        assert.ok(true, 'Import command should execute without error')
    })

    test('Should handle empty selection gracefully', async () => {
        // Set empty selection
        editor.selection = new vscode.Selection(
            new vscode.Position(0, 0),
            new vscode.Position(0, 0)
        )

        // Execute commands
        await vscode.commands.executeCommand('fux-ghost-writer.storeCodeFragment')
        await vscode.commands.executeCommand('fux-ghost-writer.logSelectedVariable')

        // Should not throw errors
        assert.ok(true, 'Should handle empty selection gracefully')
    })

    test('Should handle multi-line selection', async () => {
        // Select entire method
        editor.selection = new vscode.Selection(
            new vscode.Position(3, 4), // Start of method
            new vscode.Position(6, 5) // End of method
        )

        // Execute command
        await vscode.commands.executeCommand('fux-ghost-writer.storeCodeFragment')

        // Should not throw error
        assert.ok(true, 'Should handle multi-line selection')
    })

    test('Should work with different languages', async () => {
        // Create JavaScript document
        const jsContent = `
function testFunction() {
    const jsVar = 'javascript';
    return jsVar;
}
`

        const jsDocument = await vscode.workspace.openTextDocument({
            content: jsContent,
            language: 'javascript'
        })
        
        const jsEditor = await vscode.window.showTextDocument(jsDocument)
        
        // Select variable
        jsEditor.selection = new vscode.Selection(
            new vscode.Position(2, 8), // Start of 'jsVar'
            new vscode.Position(2, 13) // End of 'jsVar'
        )

        // Execute commands
        await vscode.commands.executeCommand('fux-ghost-writer.storeCodeFragment')
        await vscode.commands.executeCommand('fux-ghost-writer.logSelectedVariable')

        // Should not throw errors
        assert.ok(true, 'Should work with JavaScript files')
    })

    test('Should handle rapid command execution', async () => {
        // Execute multiple commands rapidly
        const promises = []
        
        for (let i = 0; i < 5; i++) {
            promises.push(vscode.commands.executeCommand('fux-ghost-writer.storeCodeFragment'))
        }
        
        await Promise.all(promises)
        
        // Should not throw errors
        assert.ok(true, 'Should handle rapid command execution')
    })

    test('Should handle commands with special characters', async () => {
        // Create document with special characters
        const specialContent = `
const specialVar = 'test with "quotes" and \'apostrophes\'';
const unicodeVar = '测试变量 with émojis 🚀';
`

        const specialDocument = await vscode.workspace.openTextDocument({
            content: specialContent,
            language: 'typescript'
        })
        
        const specialEditor = await vscode.window.showTextDocument(specialDocument)
        
        // Select variable with special characters
        specialEditor.selection = new vscode.Selection(
            new vscode.Position(1, 6), // Start of 'specialVar'
            new vscode.Position(1, 16) // End of 'specialVar'
        )
        
        await vscode.commands.executeCommand('fux-ghost-writer.storeCodeFragment')
        
        // Select unicode variable
        specialEditor.selection = new vscode.Selection(
            new vscode.Position(2, 6), // Start of 'unicodeVar'
            new vscode.Position(2, 16) // End of 'unicodeVar'
        )
        
        await vscode.commands.executeCommand('fux-ghost-writer.logSelectedVariable')
        
        // Should not throw errors
        assert.ok(true, 'Should handle special characters')
    })
})
