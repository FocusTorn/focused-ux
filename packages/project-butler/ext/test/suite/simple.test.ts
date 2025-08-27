import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Simple Test Suite', () => {
  test('VS Code API should be available', () => {
    assert.ok(vscode, 'VS Code API should be available');
    assert.ok(vscode.window, 'VS Code window API should be available');
    assert.ok(vscode.commands, 'VS Code commands API should be available');
    assert.ok(vscode.workspace, 'VS Code workspace API should be available');
    // console.log('All VS Code APIs are available');
  });

  test('Test workspace should be available', () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders && workspaceFolders.length > 0, 'Test workspace should be available');
    // console.log('Test workspace root:', workspaceFolders[0].uri.fsPath);
  });
});
