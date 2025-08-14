"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: Extension adapters extra', () => {
    (0, vitest_1.it)('covers ExtensionContextAdapter and ExtensionAPIAdapter', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            window: {
                registerTreeDataProvider: vitest_1.vi.fn().mockReturnValue('rtp'),
                registerWebviewViewProvider: vitest_1.vi.fn().mockReturnValue('rwvp'),
                createTreeView: vitest_1.vi.fn().mockReturnValue('tv'),
            },
            commands: {
                registerCommand: vitest_1.vi.fn().mockReturnValue('rc'),
                executeCommand: vitest_1.vi.fn().mockResolvedValue('exec-res'),
            },
        }));
        const { ExtensionContextAdapter, ExtensionAPIAdapter } = await import('../../src/vscode/adapters/Extension.adapter.js');
        const ctx = { subscriptions: ['a'] };
        const ectx = new ExtensionContextAdapter(ctx);
        (0, vitest_1.expect)(ectx.subscriptions).toEqual(['a']);
        const api = new ExtensionAPIAdapter();
        const vs = await import('vscode');
        api.registerTreeDataProvider({});
        (0, vitest_1.expect)(vs.window.registerTreeDataProvider).toHaveBeenCalled();
        api.registerWebviewViewProvider('id', {});
        (0, vitest_1.expect)(vs.window.registerWebviewViewProvider).toHaveBeenCalledWith('id', {});
        api.createTreeView('x', {});
        (0, vitest_1.expect)(vs.window.createTreeView).toHaveBeenCalledWith('x', {});
        api.registerCommand('c', () => { });
        (0, vitest_1.expect)(vs.commands.registerCommand).toHaveBeenCalledWith('c', vitest_1.expect.any(Function));
        (0, vitest_1.expect)(await api.executeCommand('c', 1, 2)).toBe('exec-res');
    });
});
//# sourceMappingURL=extension-api.adapter.extra.test.js.map