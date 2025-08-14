"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('WorkspaceAdapter', () => {
    (0, vitest_1.it)('delegates to vscode.workspace APIs', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => {
            const workspace = {
                getConfiguration: vitest_1.vi.fn().mockReturnValue({}),
                fs: { sentinel: true },
                workspaceFolders: [{ name: 'root' }],
                onDidChangeConfiguration: vitest_1.vi.fn().mockReturnValue({ dispose: vitest_1.vi.fn() }),
                createFileSystemWatcher: vitest_1.vi.fn().mockReturnValue({}),
                openTextDocument: vitest_1.vi.fn().mockResolvedValue({ uri: { fsPath: '/x' } }),
            };
            class RelativePattern {
                base;
                pattern;
                constructor(base, pattern) {
                    this.base = base;
                    this.pattern = pattern;
                }
            }
            return { workspace, RelativePattern };
        });
        const { WorkspaceAdapter } = await import('../src/vscode/adapters/Workspace.adapter.js');
        const { TextDocumentAdapter } = await import('../src/vscode/adapters/TextDocument.adapter.js');
        const a = new WorkspaceAdapter();
        (0, vitest_1.expect)(a.getConfiguration('x')).toEqual({});
        const vs = await import('vscode');
        (0, vitest_1.expect)(a.fs).toBe(vs.workspace.fs);
        const vs2 = await import('vscode');
        (0, vitest_1.expect)(a.workspaceFolders).toBe(vs2.workspace.workspaceFolders);
        a.onDidChangeConfiguration(() => { });
        (0, vitest_1.expect)(vs2.workspace.onDidChangeConfiguration).toHaveBeenCalled();
        a.createFileSystemWatcher('*.ts');
        const vs1 = await import('vscode');
        (0, vitest_1.expect)(vs1.workspace.createFileSystemWatcher).toHaveBeenCalled();
        a.createFileSystemWatcher({ base: '/b', pattern: '**/*.ts' });
        (0, vitest_1.expect)(vs1.workspace.createFileSystemWatcher).toHaveBeenCalledTimes(2);
        const doc = await a.openTextDocument('/x');
        (0, vitest_1.expect)(doc).toBeInstanceOf(TextDocumentAdapter);
    });
});
//# sourceMappingURL=workspace.adapter.test.js.map