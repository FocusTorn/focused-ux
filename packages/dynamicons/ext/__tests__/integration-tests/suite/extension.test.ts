import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Dynamicons Extension Integration Tests', () => {
    vscode.window.showInformationMessage('Starting Dynamicons integration tests.');

    test('Extension should be present', () => {
        const extension = vscode.extensions.getExtension('fux.dynamicons');
        assert.ok(extension, 'Extension should be present');
    });

    test('Extension should be activated', async () => {
        const extension = vscode.extensions.getExtension('fux.dynamicons');
        if (extension) {
            await extension.activate();
            assert.ok(extension.isActive, 'Extension should be activated');
        }
    });

    test('Should have basic commands available', async () => {
        const commands = await vscode.commands.getCommands();
        const dynamiconsCommands = commands.filter(cmd => cmd.includes('dynamicons'));
        assert.ok(dynamiconsCommands.length > 0, 'Should have at least one Dynamicons command');
    });

    test('Should be able to show information message', async () => {
        const message = 'Test message from Dynamicons integration test';
        const result = await vscode.window.showInformationMessage(message, 'OK', 'Cancel');
        assert.ok(result === 'OK' || result === 'Cancel', 'Should be able to show information message');
    });
});
