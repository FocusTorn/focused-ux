"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('FileSystemAdapter - error branches', () => {
    (0, vitest_1.it)('createDirectory logs and rethrows on failure; readDirectory throws', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('node:fs/promises', () => ({ mkdir: vitest_1.vi.fn().mockRejectedValue(new Error('fail')) }));
        const spy = vitest_1.vi.spyOn(console, 'warn').mockImplementation(() => { });
        const { FileSystemAdapter } = await import('../src/vscode/adapters/FileSystem.adapter.js');
        const fs = new FileSystemAdapter();
        await (0, vitest_1.expect)(fs.createDirectory('x')).rejects.toThrow('fail');
        (0, vitest_1.expect)(() => fs.readDirectory('x')).toThrow(/Method not implemented/);
        spy.mockRestore();
    });
});
//# sourceMappingURL=file-system.adapter-error.test.js.map