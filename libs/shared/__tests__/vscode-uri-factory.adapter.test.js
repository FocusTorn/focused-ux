"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('VSCodeUriFactory', () => {
    (0, vitest_1.it)('file validates input and returns fallback on invalid; joinPath filters; dirname handles invalid', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            Uri: {
                file: (p) => ({ fsPath: p, path: p, toString: () => `file://${p}` }),
                joinPath: (base, ...segs) => ({ fsPath: [base.fsPath, ...segs].join('/'), path: [base.path, ...segs].join('/') }),
            },
        }));
        // Break circular import between VSCodeUriFactory and UriAdapter default-factory
        vitest_1.vi.mock('../src/vscode/adapters/Uri.adapter.js', () => ({
            UriAdapter: class {
                uri;
                constructor(uri) {
                    this.uri = uri;
                }
            },
        }));
        const { VSCodeUriFactory } = await import('../src/vscode/adapters/VSCodeUriFactory.js');
        const f = new VSCodeUriFactory();
        const bad = f.file('');
        (0, vitest_1.expect)(bad.uri.fsPath).toBe('/invalid-path');
        const good = f.file('/root/x.txt');
        (0, vitest_1.expect)(good.uri.fsPath).toBe('/root/x.txt');
        const base = { uri: { fsPath: '/root', path: '/root' } };
        const joined = f.joinPath(base, 'a', '', 'b');
        (0, vitest_1.expect)(joined.uri.fsPath).toContain('/root/a/b');
        const d1 = f.dirname({ uri: { fsPath: '/root/a', path: '/root/a' } });
        (0, vitest_1.expect)(d1.uri.fsPath).toContain('/..');
        const d2 = f.dirname({ uri: {} });
        (0, vitest_1.expect)(d2.uri.fsPath).toBe('/');
    });
});
//# sourceMappingURL=vscode-uri-factory.adapter.test.js.map