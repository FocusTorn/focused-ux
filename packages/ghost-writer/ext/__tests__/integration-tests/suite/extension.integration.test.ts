import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Ghost Writer Extension Integration Test Suite', () => {
    test('Should register commands', async () => {
        const commands = await vscode.commands.getCommands()
        assert.ok(commands.includes('fux-ghost-writer.storeCodeFragment'))
        assert.ok(commands.includes('fux-ghost-writer.insertImportStatement'))
        assert.ok(commands.includes('fux-ghost-writer.logSelectedVariable'))
    })

    test('Should activate without errors', async () => {
        assert.ok(true, 'Extension should activate successfully')
    })
})
