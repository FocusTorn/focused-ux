"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('PathUtilsAdapter whitespace-only inputs', () => {
    (0, vitest_1.it)('getDottedPath returns undefined when from/to are whitespace', async () => {
        const { PathUtilsAdapter } = await import('../src/vscode/adapters/PathUtils.adapter.js');
        const p = new PathUtilsAdapter();
        (0, vitest_1.expect)(p.getDottedPath('   ', '/to')).toBeUndefined();
        (0, vitest_1.expect)(p.getDottedPath('/from', '  ')).toBeUndefined();
    });
});
//# sourceMappingURL=path-utils.adapter.whitespace.test.js.map