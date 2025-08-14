"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: WindowAdapter additional branches', () => {
    (0, vitest_1.it)('activeTextEditor and activeTextEditorUri getters; setStatusBarMessage overloads', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => {
            const setStatusBarMessage = vitest_1.vi.fn();
            return {
                window: {
                    activeTextEditor: { document: { uri: { fsPath: '/p.md' } } },
                    showInformationMessage: vitest_1.vi.fn(),
                    setStatusBarMessage,
                    withProgress: vitest_1.vi.fn((_opts, task) => task({ report: () => { } })),
                },
                ProgressLocation: { Notification: 15 },
                env: { clipboard: { writeText: vitest_1.vi.fn() } },
            };
        });
        const configurationService = { get: vitest_1.vi.fn(async (_k, d) => d) };
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const w = new WindowAdapter(configurationService);
        (0, vitest_1.expect)(w.activeTextEditor).toBeDefined();
        (0, vitest_1.expect)(w.activeTextEditorUri).toBe('/p.md');
        const vs = await import('vscode');
        w.setStatusBarMessage('m1');
        (0, vitest_1.expect)(vs.window.setStatusBarMessage).toHaveBeenCalledWith('m1');
        w.setStatusBarMessage('m2', 1000);
        (0, vitest_1.expect)(vs.window.setStatusBarMessage).toHaveBeenCalledWith('m2', 1000);
    });
});
//# sourceMappingURL=window.adapter.more-branches.test.js.map