"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('ProcessAdapter', () => {
    (0, vitest_1.it)('delegates exec and returns workspace root', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('node:child_process', () => ({ exec: vitest_1.vi.fn((cmd, _opts, cb) => cb(null, 'ok', '')) }));
        const { ProcessAdapter } = await import('../src/vscode/adapters/Process.adapter.js');
        const workspace = { workspaceFolders: [{ uri: { fsPath: 'D:/root' } }] };
        const a = new ProcessAdapter(workspace);
        let out = '';
        a.exec('echo hi', { cwd: 'D:/root' }, (_e, stdout) => { out = stdout; });
        (0, vitest_1.expect)(out).toBe('ok');
        (0, vitest_1.expect)(a.getWorkspaceRoot()).toBe('D:/root');
    });
});
//# sourceMappingURL=process.adapter.test.js.map