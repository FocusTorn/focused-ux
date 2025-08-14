"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('ContextAdapter', () => {
    (0, vitest_1.it)('exposes extensionPath from provided context', async () => {
        const ctx = { extensionUri: { fsPath: 'D:/ext/path' } };
        const { ContextAdapter } = await import('../src/vscode/adapters/Context.adapter.js');
        const a = new ContextAdapter(ctx);
        (0, vitest_1.expect)(a.extensionPath).toBe('D:/ext/path');
    });
});
//# sourceMappingURL=context.adapter.test.js.map