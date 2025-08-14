"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: WindowAdapter duration branches for dropdown/description', () => {
    (0, vitest_1.it)('uses provided duration (no config) and config fallback when undefined', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            window: {
                createTreeView: vitest_1.vi.fn(() => ({ message: undefined, description: '' })),
                registerTreeDataProvider: vitest_1.vi.fn(),
            },
            ProgressLocation: { Notification: 15 },
        }));
        const cfg = { get: vitest_1.vi.fn(async (_k, d) => d) };
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const w = new WindowAdapter(cfg);
        const vs = await import('vscode');
        const v = vs.window.createTreeView('x', {});
        w.setExplorerView(v);
        // provided duration -> no config call
        cfg.get.mockClear();
        await w.showDropdownMessage('m', 1);
        (0, vitest_1.expect)(cfg.get).not.toHaveBeenCalled();
        cfg.get.mockClear();
        await w.showDescriptionMessage('md');
        (0, vitest_1.expect)(cfg.get).toHaveBeenCalled();
    });
});
//# sourceMappingURL=window.adapter.duration-branches.test.js.map