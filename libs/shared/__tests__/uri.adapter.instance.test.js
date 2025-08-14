"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('UriAdapter instance accessors', () => {
    (0, vitest_1.it)('exposes path/query/fsPath/toString', async () => {
        const mock = {
            path: '/p',
            query: '?q=1',
            fsPath: 'D:/p',
            toString: () => 'uri://p',
        };
        const { UriAdapter } = await import('../src/vscode/adapters/Uri.adapter.js');
        const a = new UriAdapter(mock);
        (0, vitest_1.expect)(a.path).toBe('/p');
        (0, vitest_1.expect)(a.query).toBe('?q=1');
        (0, vitest_1.expect)(a.fsPath).toBe('D:/p');
        (0, vitest_1.expect)(a.toString()).toBe('uri://p');
    });
});
//# sourceMappingURL=uri.adapter.instance.test.js.map