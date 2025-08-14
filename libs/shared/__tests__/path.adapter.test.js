"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('PathAdapter', () => {
    (0, vitest_1.it)('wraps node:path helpers', async () => {
        const { PathAdapter } = await import('../src/vscode/adapters/Path.adapter.js');
        const p = new PathAdapter();
        (0, vitest_1.expect)(p.join('/a', 'b')).toContain('a');
        (0, vitest_1.expect)(p.basename('/a/b.txt')).toBe('b.txt');
        (0, vitest_1.expect)(p.parse('/a/b.txt').ext).toBe('.txt');
        (0, vitest_1.expect)(p.dirname('/a/b/c')).toContain('/a/b');
        (0, vitest_1.expect)(typeof p.relative('/a/b', '/a/b/c')).toBe('string');
    });
});
//# sourceMappingURL=path.adapter.test.js.map