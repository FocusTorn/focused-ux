"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: WindowAdapter uncovered branches', () => {
    (0, vitest_1.it)('showDropdownMessage early return when no explorerView', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({ window: {}, ProgressLocation: { Notification: 15 }, env: { clipboard: { writeText: vitest_1.vi.fn() } } }));
        const cfg = { get: vitest_1.vi.fn(async (_, d) => d) };
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const w = new WindowAdapter(cfg);
        await w.showDropdownMessage('m'); // should early return
        (0, vitest_1.expect)(cfg.get).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)('showDescriptionMessage early return when no explorerView', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({ window: {}, ProgressLocation: { Notification: 15 }, env: { clipboard: { writeText: vitest_1.vi.fn() } } }));
        const cfg = { get: vitest_1.vi.fn(async (_, d) => d) };
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const w = new WindowAdapter(cfg);
        await w.showDescriptionMessage('m'); // should early return
        (0, vitest_1.expect)(cfg.get).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=window.adapter.uncovered-branches.test.js.map