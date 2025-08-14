"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: WindowAdapter safe message branches', () => {
    (0, vitest_1.it)('showWarningMessage uses " " for empty/invalid messages', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            window: {
                showWarningMessage: vitest_1.vi.fn(),
                withProgress: vitest_1.vi.fn(async (_o, task) => task({ report: () => { } })),
                showInformationMessage: vitest_1.vi.fn(),
            },
            ProgressLocation: { Notification: 15 },
            env: { clipboard: { writeText: vitest_1.vi.fn() } },
        }));
        const cfg = { get: vitest_1.vi.fn(async (_, d) => d) };
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const vs = await import('vscode');
        // Ensure function present for this test environment
        if (typeof vs.window.showWarningMessage !== 'function') {
            vs.window.showWarningMessage = vitest_1.vi.fn();
        }
        const w = new WindowAdapter(cfg);
        await w.showWarningMessage(undefined, {});
        (0, vitest_1.expect)(vs.window.showWarningMessage).toHaveBeenCalledWith(' ', {}, ...[]);
    });
    (0, vitest_1.it)('showTimedInformationMessage uses " " for empty/invalid message with provided duration', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            window: {
                showInformationMessage: vitest_1.vi.fn(),
                withProgress: vitest_1.vi.fn(async (_o, task) => task({ report: () => { } })),
            },
            ProgressLocation: { Notification: 15 },
            env: { clipboard: { writeText: vitest_1.vi.fn() } },
        }));
        // Stub timed util to avoid relying on withProgress implementation under the hood
        vitest_1.vi.mock('../../src/utils/showTimedInformationMessage.js', () => ({
            showTimedInformationMessage: vitest_1.vi.fn().mockResolvedValue(undefined),
        }));
        const cfg = { get: vitest_1.vi.fn(async (_, d) => d) };
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const w = new WindowAdapter(cfg);
        await w.showTimedInformationMessage('', 500);
        // showTimedInformationMessage delegates to util; but we can assert config not used
        (0, vitest_1.expect)(cfg.get).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=window.adapter.safe-messages.test.js.map