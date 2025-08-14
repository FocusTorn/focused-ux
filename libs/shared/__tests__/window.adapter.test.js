"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('WindowAdapter', () => {
    (0, vitest_1.it)('showInformationMessage handles modal flag and item lists', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => {
            const window = {
                showInformationMessage: vitest_1.vi.fn().mockResolvedValue('a'),
                showWarningMessage: vitest_1.vi.fn().mockResolvedValue('b'),
                setStatusBarMessage: vitest_1.vi.fn(),
                createTreeView: vitest_1.vi.fn().mockReturnValue({}),
                registerTreeDataProvider: vitest_1.vi.fn().mockReturnValue({}),
                withProgress: vitest_1.vi.fn((_opts, task) => task({ report: vitest_1.vi.fn() })),
                showInputBox: vitest_1.vi.fn().mockResolvedValue('inp'),
                showTextDocument: vitest_1.vi.fn().mockResolvedValue({}),
                activeTextEditor: { document: { uri: { fsPath: '/f' } } },
                registerUriHandler: vitest_1.vi.fn().mockReturnValue({}),
            };
            const ProgressLocation = { Notification: 15 };
            const env = { clipboard: { writeText: vitest_1.vi.fn().mockResolvedValue(undefined) } };
            return { window, ProgressLocation, env };
        });
        const configurationService = { get: vitest_1.vi.fn().mockResolvedValue(1.5) };
        const { WindowAdapter } = await import('../src/vscode/adapters/Window.adapter.js');
        const a = new WindowAdapter(configurationService);
        (0, vitest_1.expect)(a.activeTextEditorUri).toBe('/f');
        await a.showInformationMessage('x', true, 'a', 'b');
        const vs = await import('vscode');
        (0, vitest_1.expect)(vs.window.showInformationMessage).toHaveBeenCalledWith('x', { modal: true }, 'a', 'b');
        await a.showInformationMessage('x', 'i1', 'i2');
        (0, vitest_1.expect)(vs.window.showInformationMessage).toHaveBeenCalledWith('x', 'i1', 'i2');
        await a.showWarningMessage('w');
        (0, vitest_1.expect)(vs.window.showWarningMessage).toHaveBeenCalled();
        await a.showInputBox({});
        (0, vitest_1.expect)(vs.window.showInputBox).toHaveBeenCalled();
        await a.showTextDocument({ document: { uri: { fsPath: '/f' } } });
        (0, vitest_1.expect)(vs.window.showTextDocument).toHaveBeenCalled();
        a.createTreeView('id', {});
        (0, vitest_1.expect)(vs.window.createTreeView).toHaveBeenCalled();
        a.registerTreeDataProvider('id', {});
        (0, vitest_1.expect)(vs.window.registerTreeDataProvider).toHaveBeenCalled();
        await a.withProgress({ title: 't', cancellable: false }, async () => undefined);
        (0, vitest_1.expect)(vs.window.withProgress).toHaveBeenCalled();
        a.setStatusBarMessage('msg');
        (0, vitest_1.expect)(vs.window.setStatusBarMessage).toHaveBeenCalledWith('msg');
        a.setStatusBarMessage('msg', 100);
        (0, vitest_1.expect)(vs.window.setStatusBarMessage).toHaveBeenCalledWith('msg', 100);
        a.registerUriHandler({});
        (0, vitest_1.expect)(vs.window.registerUriHandler).toHaveBeenCalled();
        await a.setClipboard('c');
        (0, vitest_1.expect)(vs.env.clipboard.writeText).toHaveBeenCalledWith('c');
        await a.showTimedInformationMessage('m');
        (0, vitest_1.expect)(configurationService.get).toHaveBeenCalled();
    });
});
//# sourceMappingURL=window.adapter.test.js.map