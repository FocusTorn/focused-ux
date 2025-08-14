"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: WindowAdapter showErrorMessage valid branch', () => {
    (0, vitest_1.it)('passes through valid message without guard substitution', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            window: {
                showErrorMessage: vitest_1.vi.fn(),
                withProgress: vitest_1.vi.fn(async (_o, task) => task({ report: () => { } })),
            },
            ProgressLocation: { Notification: 15 },
            env: { clipboard: { writeText: vitest_1.vi.fn() } },
        }));
        const cfg = { get: vitest_1.vi.fn(async (_, d) => d) };
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const w = new WindowAdapter(cfg);
        const vs = await import('vscode');
        w.showErrorMessage('OK');
        (0, vitest_1.expect)(vs.window.showErrorMessage).toHaveBeenCalledWith('OK');
    });
});
//# sourceMappingURL=window.adapter.show-error-valid.test.js.map