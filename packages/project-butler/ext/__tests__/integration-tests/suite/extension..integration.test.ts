import * as assert from 'node:assert'
import * as vscode from 'vscode'

suite('Extension Test Suite', () => {
    test('Extension should be present and active', () => {
        const ext = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler')

        assert.ok(ext, 'Extension should be found')
        assert.ok(ext.isActive, 'Extension should be active')
    })

    test('Should register all commands', async () => {
        const commands = await vscode.commands.getCommands(true)

        const expectedCommands = [
            'fux-project-butler.formatPackageJson',
            'fux-project-butler.updateTerminalPath',
            'fux-project-butler.createBackup',
            'fux-project-butler.enterPoetryShell',
        ]

        for (const command of expectedCommands) {
            assert.ok(commands.includes(command), `Command ${command} should be registered`)
        }
    })
})


