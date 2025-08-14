"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('EnvAdapter & ClipboardAdapter', () => {
    (0, vitest_1.it)('delegates read/write to vscode.env.clipboard', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({ env: { clipboard: { readText: vitest_1.vi.fn().mockResolvedValue('x'), writeText: vitest_1.vi.fn().mockResolvedValue(undefined) } } }));
        const { EnvAdapter } = await import('../src/vscode/adapters/Env.adapter.js');
        const a = new EnvAdapter();
        const clip = a.clipboard;
        (0, vitest_1.expect)(await clip.readText()).toBe('x');
        await clip.writeText('y');
        const vs = await import('vscode');
        (0, vitest_1.expect)(vs.env.clipboard.readText).toHaveBeenCalled();
        (0, vitest_1.expect)(vs.env.clipboard.writeText).toHaveBeenCalledWith('y');
    });
});
//# sourceMappingURL=env.adapter.test.js.map