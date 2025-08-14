"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('PathUtilsAdapter logging (warn)', () => {
    (0, vitest_1.it)('does not rely on console.warn (behavioral outcomes only)', async () => {
        vitest_1.vi.resetModules();
        const { PathUtilsAdapter } = await import('../src/vscode/adapters/PathUtils.adapter.js');
        const p = new PathUtilsAdapter();
        (0, vitest_1.expect)(p.getDottedPath('', '/to')).toBeUndefined();
        (0, vitest_1.expect)(p.getDottedPath('/from', '')).toBeUndefined();
        // @ts-expect-error runtime guard
        (0, vitest_1.expect)(p.sanitizePath(undefined)).toBe('');
    });
});
//# sourceMappingURL=path-utils.logging.test.js.map