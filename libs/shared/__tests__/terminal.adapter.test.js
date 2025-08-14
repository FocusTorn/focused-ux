"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('TerminalAdapter', () => {
    (0, vitest_1.it)('exposes activeTerminal and createTerminal', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({ window: { activeTerminal: { name: 't' }, createTerminal: vitest_1.vi.fn().mockReturnValue({ name: 'n' }) } }));
        const { TerminalAdapter } = await import('../src/vscode/adapters/Terminal.adapter.js');
        const a = new TerminalAdapter();
        (0, vitest_1.expect)(a.activeTerminal).toEqual({ name: 't' });
        (0, vitest_1.expect)(a.createTerminal('x')).toEqual({ name: 'n' });
    });
});
//# sourceMappingURL=terminal.adapter.test.js.map