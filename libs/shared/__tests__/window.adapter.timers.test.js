"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('WindowAdapter timers', () => {
    (0, vitest_1.it)('showDropdownMessage and showDescriptionMessage clear after duration', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.useFakeTimers();
        vitest_1.vi.mock('vscode', () => ({ window: {}, env: { clipboard: { writeText: vitest_1.vi.fn() } }, ProgressLocation: { Notification: 15 } }));
        const cfg = { get: vitest_1.vi.fn().mockResolvedValue(0.001) };
        const { WindowAdapter } = await import('../src/vscode/adapters/Window.adapter.js');
        const a = new WindowAdapter(cfg);
        const view = { message: undefined, description: '' };
        a.setExplorerView(view);
        await a.showDropdownMessage('m');
        await a.showDescriptionMessage('d');
        vitest_1.vi.runAllTimers();
        (0, vitest_1.expect)(view.message).toBeUndefined();
        (0, vitest_1.expect)(view.description).toBe('');
    });
});
//# sourceMappingURL=window.adapter.timers.test.js.map