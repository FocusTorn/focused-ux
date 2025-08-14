"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('CommandsAdapter', () => {
    (0, vitest_1.it)('delegates to vscode.commands register/execute', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => {
            const commands = {
                registerCommand: vitest_1.vi.fn(),
                executeCommand: vitest_1.vi.fn().mockResolvedValue('ok'),
            };
            return { commands };
        });
        const { CommandsAdapter } = await import('../src/vscode/adapters/Commands.adapter.js');
        const vs = await import('vscode');
        const adapter = new CommandsAdapter();
        const cb = vitest_1.vi.fn();
        adapter.registerCommand('x', cb);
        (0, vitest_1.expect)(vs.commands.registerCommand).toHaveBeenCalledWith('x', cb);
        const result = await adapter.executeCommand('y', 1, 2);
        (0, vitest_1.expect)(vs.commands.executeCommand).toHaveBeenCalledWith('y', 1, 2);
        (0, vitest_1.expect)(result).toBe('ok');
    });
});
//# sourceMappingURL=commands.adapter.test.js.map