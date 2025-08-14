"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: WindowAdapter _getDuration branches', () => {
    (0, vitest_1.it)('uses provided duration vs config fallback', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            window: { withProgress: vitest_1.vi.fn(async (_o, task) => task({ report: () => { } })) },
            ProgressLocation: { Notification: 15 },
            env: { clipboard: { writeText: vitest_1.vi.fn() } },
        }));
        const cfg = { get: vitest_1.vi.fn(async (_, d) => d) };
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const w = new WindowAdapter(cfg);
        // Provided duration path
        await w.showTimedInformationMessage('m', 2000);
        (0, vitest_1.expect)(cfg.get).not.toHaveBeenCalled();
        // Fallback config path
        cfg.get.mockClear();
        await w.showTimedInformationMessage('m');
        (0, vitest_1.expect)(cfg.get).toHaveBeenCalled();
    });
});
//# sourceMappingURL=window.adapter.get-duration.test.js.map