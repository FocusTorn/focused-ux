"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('FileTypeAdapter', () => {
    (0, vitest_1.it)('maps vscode FileType enums', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            default: { FileType: { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 } },
            FileType: { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 },
        }));
        const { FileTypeAdapter } = await import('../src/vscode/adapters/FileType.adapter.js');
        const ft = new FileTypeAdapter();
        (0, vitest_1.expect)(typeof ft.Unknown).toBe('number');
        (0, vitest_1.expect)(typeof ft.File).toBe('number');
        (0, vitest_1.expect)(typeof ft.Directory).toBe('number');
        (0, vitest_1.expect)(typeof ft.SymbolicLink).toBe('number');
    });
});
//# sourceMappingURL=file-type.adapter.test.js.map