import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Polls for the existence of a file.
 * @param filePath The path to the file to check.
 * @param timeout The maximum time to wait in milliseconds.
 * @returns A promise that resolves to true if the file exists, false otherwise.
 */
async function waitForFile(filePath: string, timeout = 5000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (fs.existsSync(filePath)) {
            return true;
        }
        await new Promise(res => setTimeout(res, 100)); // poll every 100ms
    }
    return false;
}

suite('Backup Test Suite', () => {
  let testFile = '';
  let testWorkspaceRoot = '';

  suiteSetup(async () => {
    // Get the test workspace root
    testWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    assert.ok(testWorkspaceRoot, 'Test workspace should be available');
    
    // Use the existing test file instead of creating a new one
    testFile = path.join(testWorkspaceRoot, 'test-file.txt');
    
    // Ensure the test file exists
    if (!fs.existsSync(testFile)) {
      fs.writeFileSync(testFile, 'This is a test file for backup testing');
      console.log('Test file created:', testFile);
    } else {
      console.log('Using existing test file:', testFile);
    }

    // Activate the extension
    const ext = vscode.extensions.getExtension('NewRealityDesigns.fux-project-butler');
    if (ext && !ext.isActive) {
      await ext.activate();
    }
  });

  suiteTeardown(async () => {
    // Clean up backup files (they should be in the same directory as the test file)
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

    // Close any active editors to ensure we're testing the URI parameter path
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    assert.strictEqual(vscode.window.activeTextEditor, undefined, 'Should have no active editor for URI test');

    // Execute the backup command with the file URI
    await vscode.commands.executeCommand('fux-project-butler.createBackup', fileUri);

    // Check if backup was created
    const backupPath = path.join(path.dirname(testFile), 'test-file.txt.bak');
    const fileCreated = await waitForFile(backupPath);
    assert.ok(fileCreated, `Backup file should have been created at ${backupPath}`);
    
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    assert.strictEqual(backupContent, 'This is a test file for backup testing', 'Backup content should match original');
  });

  test('Should create backup of a file via command palette (active editor)', async () => {
    // Open the test file and make it the active editor
    const document = await vscode.workspace.openTextDocument(testFile);
    await vscode.window.showTextDocument(document);
    
    assert.ok(vscode.window.activeTextEditor, 'Should have an active text editor');
    assert.strictEqual(vscode.window.activeTextEditor.document.uri.fsPath, testFile, 'Active editor should be our test file');
    
    // Execute the backup command without URI
    await vscode.commands.executeCommand('fux-project-butler.createBackup');
    
    const backupPath = path.join(path.dirname(testFile), 'test-file.txt.bak2');
    const fileCreated = await waitForFile(backupPath);
    assert.ok(fileCreated, `Backup file should have been created at ${backupPath}`);

    const backupContent = fs.readFileSync(backupPath, 'utf8');
    assert.strictEqual(backupContent, 'This is a test file for backup testing', 'Backup content should match original');
  });

  test('Should reject backup command with no active file', async () => {
    // Close all editors
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');

    // Assert that the command rejects when called without context
    await assert.rejects(
        async () => {
            await vscode.commands.executeCommand('fux-project-butler.createBackup');
        },
        (err: any) => {
            assert.strictEqual(err.message, 'No file selected or open to back up.');
            return true;
        },
        'Command should have rejected with an error.'
    );
  });

  test('Should reject backup command with invalid URI', async () => {
    const invalidUri = vscode.Uri.file('/path/to/non/existent/file.txt');
    
    // Assert that the command rejects with a file system error
    await assert.rejects(
        async () => {
            await vscode.commands.executeCommand('fux-project-butler.createBackup', invalidUri);
        },
        /ENOENT/, // Check for the standard 'file not found' error code
        'Command should have rejected with a file system error.'
    );
  });
});