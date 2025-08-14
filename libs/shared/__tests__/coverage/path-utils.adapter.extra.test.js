"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: PathUtilsAdapter extra branches', () => {
    (0, vitest_1.it)('returns undefined for empty/invalid inputs and catches path.relative errors', async () => {
        vitest_1.vi.resetModules();
        const { PathUtilsAdapter } = await import('../../src/vscode/adapters/PathUtils.adapter.js');
        const p = new PathUtilsAdapter();
        (0, vitest_1.expect)(p.getDottedPath('', '/to')).toBeUndefined();
        (0, vitest_1.expect)(p.getDottedPath('/from', '')).toBeUndefined();
        (0, vitest_1.expect)(p.getDottedPath(undefined, '/to')).toBeUndefined();
        vitest_1.vi.mock('node:path', async (importOriginal) => {
            const actual = await importOriginal();
            return {
                ...actual,
                relative: () => { throw new Error('boom'); },
            };
        });
        const { PathUtilsAdapter: P2 } = await import('../../src/vscode/adapters/PathUtils.adapter.js');
        const p2 = new P2();
        (0, vitest_1.expect)(p2.getDottedPath('/from', '/to')).toBeUndefined();
    });
});
//# sourceMappingURL=path-utils.adapter.extra.test.js.map