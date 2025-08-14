"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('ProgressAdapter', () => {
    (0, vitest_1.it)('delegates to vscode.window.withProgress', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({ window: { withProgress: vitest_1.vi.fn((_o, task) => task({})) } }));
        const { ProgressAdapter } = await import('../src/vscode/adapters/Progress.adapter.js');
        const result = await ProgressAdapter.withProgress({}, async () => 'done');
        (0, vitest_1.expect)(result).toBe('done');
    });
});
//# sourceMappingURL=progress.adapter.test.js.map