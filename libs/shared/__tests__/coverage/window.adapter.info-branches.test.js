"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: WindowAdapter showInformationMessage branches', () => {
    (0, vitest_1.it)('boolean modal branch and string items branch are both exercised', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            window: {
                showInformationMessage: vitest_1.vi.fn(),
                withProgress: vitest_1.vi.fn(async (_o, task) => task({ report: () => { } })),
            },
            ProgressLocation: { Notification: 15 },
            env: { clipboard: { writeText: vitest_1.vi.fn() } },
        }));
        const cfg = { get: vitest_1.vi.fn(async (_, d) => d) };
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const w = new WindowAdapter(cfg);
        const vs = await import('vscode');
        await w.showInformationMessage('M', true, 'a', 'b');
        (0, vitest_1.expect)(vs.window.showInformationMessage).toHaveBeenCalledWith('M', { modal: true }, 'a', 'b');
        await w.showInformationMessage('M', 'x', 'y');
        (0, vitest_1.expect)(vs.window.showInformationMessage).toHaveBeenCalledWith('M', 'x', 'y');
    });
});
//# sourceMappingURL=window.adapter.info-branches.test.js.map