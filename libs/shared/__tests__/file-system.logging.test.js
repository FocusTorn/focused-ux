"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('FileSystemAdapter logging (warn/error)', () => {
    (0, vitest_1.it)('warns on failure path (no success log expected)', async () => {
        vitest_1.vi.resetModules();
        const warnSpy2 = vitest_1.vi.spyOn(console, 'warn');
        vitest_1.vi.mock('node:fs/promises', async (importOriginal) => {
            const actual = await importOriginal();
            return {
                ...actual,
                mkdir: vitest_1.vi.fn(async () => { throw new Error('boom'); }),
            };
        });
        const { FileSystemAdapter: FS2 } = await import('../src/vscode/adapters/FileSystem.adapter.js');
        const fs2 = new FS2();
        await (0, vitest_1.expect)(fs2.createDirectory('/fail')).rejects.toThrow('boom');
        (0, vitest_1.expect)(warnSpy2).toHaveBeenCalled();
    });
});
//# sourceMappingURL=file-system.logging.test.js.map