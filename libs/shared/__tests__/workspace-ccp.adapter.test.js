"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('WorkspaceCCPAdapter', () => {
    (0, vitest_1.it)('delegates to underlying workspace adapter', async () => {
        const base = {
            workspaceFolders: [{ uri: { fsPath: '/r' }, name: 'r' }],
            getConfiguration: (s) => ({ get: (k) => `${s}.${k}` }),
            onDidChangeConfiguration: (l) => ({ dispose: () => l({ affectsConfiguration: (x) => x === 'ccp' }) }),
            createFileSystemWatcher: (p) => ({ p }),
            fs: { readFile: async () => '' },
            openTextDocument: async (u) => ({ uri: u }),
        };
        const { WorkspaceCCPAdapter } = await import('../src/vscode/adapters/WorkspaceCCP.adapter.js');
        const a = new WorkspaceCCPAdapter(base);
        (0, vitest_1.expect)(a.workspaceFolders?.[0].uri).toBe('/r');
        (0, vitest_1.expect)(a.asRelativePath('/x')).toBe('/x');
        (0, vitest_1.expect)(a.get('s', 'k')).toBe('s.k');
        (0, vitest_1.expect)(a.createFileSystemWatcher('*.md')).toEqual({ p: '*.md' });
        (0, vitest_1.expect)(a.getConfiguration('s').get('k')).toBe('s.k');
        (0, vitest_1.expect)(a.fs).toBe(base.fs);
        (0, vitest_1.expect)((await a.openTextDocument('/f')).uri).toBe('/f');
        const disp = a.onDidChangeConfiguration(() => void 0);
        (0, vitest_1.expect)(typeof disp.dispose).toBe('function');
        // invoke returned disposer to trigger inner listener path
        disp.dispose();
    });
});
//# sourceMappingURL=workspace-ccp.adapter.test.js.map