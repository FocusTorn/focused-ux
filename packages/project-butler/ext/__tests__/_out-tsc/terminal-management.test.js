"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const assert = tslib_1.__importStar(require("node:assert"));
const vscode = tslib_1.__importStar(require("vscode"));
const path = tslib_1.__importStar(require("node:path"));
suite('Terminal Management Test Suite', () => {
    let testWorkspaceRoot = '';
    let testFilePath = '';
    suiteSetup(() => {
        testWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        assert.ok(testWorkspaceRoot, 'Test workspace should be available');
        testFilePath = path.join(testWorkspaceRoot, 'test-file.txt');
    });
    test('Should update terminal path via context menu', async () => {
        const fileUri = vscode.Uri.file(testFilePath);
        // Verify the command is registered
        const commands = await vscode.commands.getCommands();
        const terminalCommand = commands.find(cmd => cmd.includes('updateTerminalPath'));
        assert.ok(terminalCommand, 'Update terminal path command should be registered');
        // Execute the terminal command
        await vscode.commands.executeCommand('fux-project-butler.updateTerminalPath', fileUri);
        // Command should complete without error
        // Note: In test environment, terminal operations are mocked, so we just verify the command executes
    }); //<
    test('Should update terminal path via command palette (active editor)', async () => {
        const document = await vscode.workspace.openTextDocument(testFilePath);
        await vscode.window.showTextDocument(document);
        assert.ok(vscode.window.activeTextEditor, 'Should have an active text editor');
        assert.strictEqual(vscode.window.activeTextEditor.document.uri.fsPath, testFilePath, 'Active editor should be our test file');
        await vscode.commands.executeCommand('fux-project-butler.updateTerminalPath');
        // Command should complete without error
        // Note: In test environment, terminal operations are mocked, so we just verify the command executes
    }); //<
    test('Should update terminal path with directory URI', async () => {
        const directoryUri = vscode.Uri.file(testWorkspaceRoot);
        await vscode.commands.executeCommand('fux-project-butler.updateTerminalPath', directoryUri);
        // Command should complete without error
    }); //<
    test('Should reject terminal command with no active file', async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await assert.rejects(async () => {
            await vscode.commands.executeCommand('fux-project-butler.updateTerminalPath');
        }, (err) => {
            assert.strictEqual(err.message, 'No file or folder context to update terminal path.');
            return true;
        }, 'Command should have rejected with an error.');
    }); //<
    test('Should reject terminal command with non-existent file', async () => {
        const nonExistentPath = path.join(testWorkspaceRoot, 'non-existent-file.txt');
        const nonExistentUri = vscode.Uri.file(nonExistentPath);
        await assert.rejects(async () => {
            await vscode.commands.executeCommand('fux-project-butler.updateTerminalPath', nonExistentUri);
        }, (err) => {
            // Should fail with a file system error
            assert.ok(err.code === 'ENOENT' || err.message.includes('does not exist') || err.message.includes('ENOENT'), `Expected file system error but got: ${err.message} (code: ${err.code})`);
            return true;
        }, 'Command should have rejected with a file system error.');
    }); //<
});
//# sourceMappingURL=terminal-management.test.js.map