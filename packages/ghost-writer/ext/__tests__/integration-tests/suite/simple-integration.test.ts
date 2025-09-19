import * as assert from 'assert'
import * as vscode from 'vscode'

suite('Ghost Writer - Simple Integration Tests', () => {
    test('Extension should be activated', async () => {
        const extension = vscode.extensions.getExtension('fux-ghost-writer')
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
})
