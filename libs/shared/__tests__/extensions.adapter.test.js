"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('ExtensionsAdapter', () => {
    (0, vitest_1.it)('returns vscode.extensions.all', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({ extensions: { all: [{ id: 'a' }, { id: 'b' }] } }));
        const { ExtensionsAdapter } = await import('../src/vscode/adapters/Extensions.adapter.js');
        const a = new ExtensionsAdapter();
        const vs = await import('vscode');
        (0, vitest_1.expect)(a.all).toBe(vs.extensions.all);
    });
});
//# sourceMappingURL=extensions.adapter.test.js.map