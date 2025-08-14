"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const shared_1 = require("@fux/shared");
(0, vitest_1.describe)('UriAdapter factory override', () => {
    (0, vitest_1.it)('creates file URIs via MockUriFactoryService', () => {
        const uri = shared_1.UriAdapter.file('/tmp/test.md');
        (0, vitest_1.expect)(uri.fsPath.replace(/\\/g, '/')).toBe('/tmp/test.md');
        (0, vitest_1.expect)(uri.toString()).toContain('file:///');
    });
    (0, vitest_1.it)('joinPath composes paths consistently', () => {
        const base = shared_1.UriAdapter.file('/root');
        const child = shared_1.UriAdapter.joinPath(base, 'a', 'b', 'c.txt');
        (0, vitest_1.expect)(child.fsPath.replace(/\\/g, '/')).toBe('/root/a/b/c.txt');
    });
    (0, vitest_1.it)('dirname returns parent folder', () => {
        const leaf = shared_1.UriAdapter.file('/root/a/b/c.txt');
        const dir = shared_1.UriAdapter.dirname(leaf);
        (0, vitest_1.expect)(dir.fsPath.replace(/\\/g, '/')).toBe('/root/a/b');
    });
});
//# sourceMappingURL=uri-adapter.test.js.map