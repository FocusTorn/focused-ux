"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('WindowAdapter extra branches', () => {
    (0, vitest_1.it)('covers status bar timeout path and timed info default config', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            window: {
                setStatusBarMessage: vitest_1.vi.fn(),
                showInformationMessage: vitest_1.vi.fn(),
                withProgress: vitest_1.vi.fn(async (_opts, task) => { await task({ report: vitest_1.vi.fn() }); }),
            },
            ProgressLocation: { Notification: 15 },
            env: { clipboard: { writeText: vitest_1.vi.fn() } },
        }));
        vitest_1.vi.mock('../src/utils/showTimedInformationMessage.js', () => ({
            showTimedInformationMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
        }));
        const cfg = { get: vitest_1.vi.fn().mockResolvedValue(0) };
        const { WindowAdapter } = await import('../src/vscode/adapters/Window.adapter.js');
        const a = new WindowAdapter(cfg);
        const vs = await import('vscode');
        a.setStatusBarMessage('m', 5);
        (0, vitest_1.expect)(vs.window.setStatusBarMessage).toHaveBeenCalledWith('m', 5);
        await a.showTimedInformationMessage('hi');
        (0, vitest_1.expect)(cfg.get).toHaveBeenCalled();
    });
});
//# sourceMappingURL=window.adapter.extra.test.js.map