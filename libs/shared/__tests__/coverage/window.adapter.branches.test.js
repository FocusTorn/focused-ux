"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: WindowAdapter remaining branches', () => {
    (0, vitest_1.it)('showErrorMessage guards; showTextDocument unwraps and raw; _getDuration both paths', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => {
            const showErrorMessage = vitest_1.vi.fn();
            const showTextDocument = vitest_1.vi.fn();
            return {
                window: {
                    showErrorMessage,
                    showTextDocument,
                    showInformationMessage: vitest_1.vi.fn(),
                    setStatusBarMessage: vitest_1.vi.fn(),
                    withProgress: vitest_1.vi.fn((_opts, task) => task({ report: () => { } })),
                    createTreeView: vitest_1.vi.fn(),
                    registerTreeDataProvider: vitest_1.vi.fn(),
                },
                ProgressLocation: { Notification: 15 },
                env: { clipboard: { writeText: vitest_1.vi.fn() } },
            };
        });
        const configurationService = { get: vitest_1.vi.fn(async (_k, d) => d) };
        const { WindowAdapter } = await import('../../src/vscode/adapters/Window.adapter.js');
        const w = new WindowAdapter(configurationService);
        const vs = await import('vscode');
        // showErrorMessage guard
        w.showErrorMessage(undefined);
        (0, vitest_1.expect)(vs.window.showErrorMessage).toHaveBeenCalledWith('An unknown error occurred.');
        // showTextDocument unwrap
        await w.showTextDocument({ document: { id: 1 } });
        (0, vitest_1.expect)(vs.window.showTextDocument).toHaveBeenCalledWith({ id: 1 });
        // showTextDocument raw path (no unwrap)
        await w.showTextDocument({ id: 2 });
        (0, vitest_1.expect)(vs.window.showTextDocument).toHaveBeenCalledWith({ id: 2 });
        // _getDuration path via showTimedInformationMessage
        const util = await import('../../src/utils/showTimedInformationMessage.js');
        const utilSpy = vitest_1.vi.spyOn(util, 'showTimedInformationMessage').mockResolvedValue();
        await w.showTimedInformationMessage('msg');
        (0, vitest_1.expect)(configurationService.get).toHaveBeenCalled();
        utilSpy.mockRestore();
        // _getDuration early-return when duration provided; config should not be called again
        configurationService.get.mockClear();
        const utilSpy2 = vitest_1.vi.spyOn(util, 'showTimedInformationMessage').mockResolvedValue();
        await w.showTimedInformationMessage('msg2', 2000);
        (0, vitest_1.expect)(configurationService.get).not.toHaveBeenCalled();
        utilSpy2.mockRestore();
    });
});
//# sourceMappingURL=window.adapter.branches.test.js.map