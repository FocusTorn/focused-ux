"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: FileSystemAdapter directory branch', () => {
    (0, vitest_1.it)('stat returns directory when isDirectory() is true', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('node:fs/promises', () => {
            return {
                stat: vitest_1.vi.fn().mockResolvedValue({ isDirectory: () => true, size: 5 }),
            };
        });
        const { FileSystemAdapter } = await import('../../src/vscode/adapters/FileSystem.adapter.js');
        const fs = new FileSystemAdapter();
        (0, vitest_1.expect)(await fs.stat('dir')).toEqual({ type: 'directory', size: 5 });
    });
});
//# sourceMappingURL=file-system.adapter.directory-branch.test.js.map