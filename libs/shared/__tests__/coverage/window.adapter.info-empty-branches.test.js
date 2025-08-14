"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: WindowAdapter showInformationMessage empty-message branches', () => {
    (0, vitest_1.it)('uses safeMessage for empty string across boolean and string branches', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            window: {
                showInformationMessage: vitest_1.vi.fn(),
                withProgress: vitest_1.vi.fn(async (_o, task) => task({ report: () => { } })),
            },
            ProgressLocation: { Notification: 15 },
            env: { clipboard: { writeText: vitest_1.vi.fn() } },
        }));
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const w = new WindowAdapter({ get: vitest_1.vi.fn() });
        const vs = await import('vscode');
        await w.showInformationMessage('', true, 'a');
        (0, vitest_1.expect)(vs.window.showInformationMessage).toHaveBeenCalledWith(' ', { modal: true }, 'a');
        await w.showInformationMessage('', 'x');
        (0, vitest_1.expect)(vs.window.showInformationMessage).toHaveBeenCalledWith(' ', 'x');
        await w.showInformationMessage('');
        (0, vitest_1.expect)(vs.window.showInformationMessage).toHaveBeenCalledWith(' ');
    });
});
//# sourceMappingURL=window.adapter.info-empty-branches.test.js.map