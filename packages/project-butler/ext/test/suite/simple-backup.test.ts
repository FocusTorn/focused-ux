import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

suite('Simple Backup Test Suite', () => {
  test('Should verify test workspace and file exist', async () => {
    // Get the test workspace root
    const testWorkspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '';
    assert.ok(testWorkspaceRoot, 'Test workspace should be available');
    console.log('Test workspace root:', testWorkspaceRoot);
    
    // Check if the test file exists
    const testFile = path.join(testWorkspaceRoot, 'test-file.txt');
    console.log('Test file path:', testFile);
    console.log('Test file exists:', fs.existsSync(testFile));
    
    if (fs.existsSync(testFile)) {
      const content = fs.readFileSync(testFile, 'utf8');
      console.log('Test file content:', content);
      const stats = fs.statSync(testFile);
      console.log('Test file size:', stats.size);
    }
    
    // List all files in the workspace
    const files = fs.readdirSync(testWorkspaceRoot);
    console.log('Files in workspace:', files);
  });

  test('Should verify extension is available', async () => {
    const ext = vscode.extensions.getExtension('fux-project-butler');
    console.log('Extension found:', ext?.id);
    console.log('Extension active:', ext?.isActive);
    
    if (ext && !ext.isActive) {
      await ext.activate();
      console.log('Extension activated');
    }
  });
});
