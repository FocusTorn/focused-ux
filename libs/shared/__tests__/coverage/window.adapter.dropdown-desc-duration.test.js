"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: WindowAdapter dropdown/description duration branches', () => {
    (0, vitest_1.it)('uses configKey path when explorerView is set', async () => {
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            window: {
                withProgress: vitest_1.vi.fn(async (_o, task) => task({ report: () => { } })),
            },
            ProgressLocation: { Notification: 15 },
            env: { clipboard: { writeText: vitest_1.vi.fn() } },
        }));
        const cfg = { get: vitest_1.vi.fn(async (_, d) => d) };
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const w = new WindowAdapter(cfg);
        const view = { message: undefined, description: '' };
        w.setExplorerView(view);
        cfg.get.mockClear();
        await w.showDropdownMessage('m');
        (0, vitest_1.expect)(cfg.get).toHaveBeenCalled();
        vitest_1.vi.runAllTimers();
        cfg.get.mockClear();
        await w.showDescriptionMessage('d');
        (0, vitest_1.expect)(cfg.get).toHaveBeenCalled();
        vitest_1.vi.runAllTimers();
    });
});
//# sourceMappingURL=window.adapter.dropdown-desc-duration.test.js.map