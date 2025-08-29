"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const assert = tslib_1.__importStar(require("node:assert"));
const vscode = tslib_1.__importStar(require("vscode"));
const path = tslib_1.__importStar(require("node:path"));
const fs = tslib_1.__importStar(require("node:fs"));
suite('Backup Test Suite', () => {
    let testFile = '';
    let testWorkspaceRoot = '';
    suiteSetup(() => {
        testWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
        assert.ok(testWorkspaceRoot, 'Test workspace should be available');
        testFile = path.join(testWorkspaceRoot, 'test-file.txt');
        if (!fs.existsSync(testFile)) {
            fs.writeFileSync(testFile, 'This is a test file for backup testing');
        }
    });
    suiteTeardown(() => {
        const backupDir = path.dirname(testFile);
        if (fs.existsSync(backupDir)) {
            const backupFiles = fs.readdirSync(backupDir);
            for (const file of backupFiles) {
                if (file.startsWith('test-file.txt.bak')) {
                    fs.unlinkSync(path.join(backupDir, file));
                }
            }
        }
    });
    test('Should create backup of a file via context menu', async () => {
        const fileUri = vscode.Uri.file(testFile);
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        assert.strictEqual(vscode.window.activeTextEditor, undefined, 'Should have no active editor for URI test');
        // Verify the command is registered
        const commands = await vscode.commands.getCommands();
        const backupCommand = commands.find(cmd => cmd.includes('createBackup'));
        assert.ok(backupCommand, 'Backup command should be registered');
        // Execute the backup command
        await vscode.commands.executeCommand('fux-project-butler.createBackup', fileUri);
        // Verify the backup file was created
        const backupPath = path.join(path.dirname(testFile), 'test-file.txt.bak');
        assert.ok(fs.existsSync(backupPath), `Backup file should have been created at ${backupPath}`);
        // Verify the backup content matches the original
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        assert.strictEqual(backupContent, 'This is a test file for backup testing', 'Backup content should match original');
    }); //<
    test('Should create backup of a file via command palette (active editor)', async () => {
        const document = await vscode.workspace.openTextDocument(testFile);
        await vscode.window.showTextDocument(document);
        assert.ok(vscode.window.activeTextEditor, 'Should have an active text editor');
        assert.strictEqual(vscode.window.activeTextEditor.document.uri.fsPath, testFile, 'Active editor should be our test file');
        await vscode.commands.executeCommand('fux-project-butler.createBackup');
        const backupPath = path.join(path.dirname(testFile), 'test-file.txt.bak2');
        assert.ok(fs.existsSync(backupPath), `Backup file should have been created at ${backupPath}`);
        const backupContent = fs.readFileSync(backupPath, 'utf8');
        assert.strictEqual(backupContent, 'This is a test file for backup testing', 'Backup content should match original');
    }); //<
    test('Should reject backup command with no active file', async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        await assert.rejects(async () => {
            await vscode.commands.executeCommand('fux-project-butler.createBackup');
        }, (err) => {
            assert.strictEqual(err.message, 'No file selected or open to back up.');
            return true;
        }, 'Command should have rejected with an error.');
    }); //<
    test('Should reject backup command with invalid URI', async () => {
        const invalidUri = vscode.Uri.file('/path/to/non/existent/file.txt');
        await assert.rejects(async () => {
            await vscode.commands.executeCommand('fux-project-butler.createBackup', invalidUri);
        }, (err) => {
            // Check if it's a file system error
            assert.ok(err.code === 'FileNotFound' || err.message.includes('does not exist'), `Expected ENOENT error but got: ${err.message} (code: ${err.code})`);
            return true;
        }, 'Command should have rejected with a file system error.');
    }); //<
});
//# sourceMappingURL=backup.test.js.map