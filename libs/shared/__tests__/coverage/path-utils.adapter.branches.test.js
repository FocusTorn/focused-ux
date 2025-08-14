"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: PathUtilsAdapter remaining branches', () => {
    (0, vitest_1.it)('getDottedPath returns undefined when relative() returns empty string', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('node:path', async (importOriginal) => {
            const actual = await importOriginal();
            return { ...actual, dirname: (p) => p, relative: () => '' };
        });
        const { PathUtilsAdapter } = await import('../../src/vscode/adapters/PathUtils.adapter.js');
        const utils = new PathUtilsAdapter();
        (0, vitest_1.expect)(utils.getDottedPath('/a/b', '/a/b')).toBeUndefined();
    });
});
//# sourceMappingURL=path-utils.adapter.branches.test.js.map