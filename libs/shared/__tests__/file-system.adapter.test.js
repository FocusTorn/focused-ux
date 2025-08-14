"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('FileSystemAdapter', () => {
    (0, vitest_1.it)('wraps fs/promises methods and createDirectory handles success', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('node:fs/promises', () => {
            return {
                stat: vitest_1.vi.fn().mockResolvedValue({ isDirectory: () => false, size: 10 }),
                access: vitest_1.vi.fn().mockResolvedValue(undefined),
                copyFile: vitest_1.vi.fn().mockResolvedValue(undefined),
                readFile: vitest_1.vi.fn().mockResolvedValue('data'),
                writeFile: vitest_1.vi.fn().mockResolvedValue(undefined),
                mkdir: vitest_1.vi.fn().mockResolvedValue(undefined),
            };
        });
        const { FileSystemAdapter } = await import('../src/vscode/adapters/FileSystem.adapter.js');
        const fs = new FileSystemAdapter();
        const mod = await import('node:fs/promises');
        (0, vitest_1.expect)(await fs.stat('p')).toEqual({ type: 'file', size: 10 });
        await fs.access('p');
        await fs.copyFile('a', 'b');
        (0, vitest_1.expect)(await fs.readFile('p')).toBe('data');
        await fs.writeFile('p', new Uint8Array());
        await fs.createDirectory('d');
        (0, vitest_1.expect)(mod.stat).toHaveBeenCalled();
        (0, vitest_1.expect)(mod.access).toHaveBeenCalled();
        (0, vitest_1.expect)(mod.copyFile).toHaveBeenCalled();
        (0, vitest_1.expect)(mod.readFile).toHaveBeenCalled();
        (0, vitest_1.expect)(mod.writeFile).toHaveBeenCalled();
        (0, vitest_1.expect)(mod.mkdir).toHaveBeenCalledWith('d', { recursive: true });
    });
    // directory branch is covered in file-system.adapter.directory-branch.test.ts to avoid hoisted mock conflicts
});
//# sourceMappingURL=file-system.adapter.test.js.map