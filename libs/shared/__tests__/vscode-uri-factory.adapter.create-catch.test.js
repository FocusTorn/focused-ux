"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('VSCodeUriFactory create() and error catch path', () => {
    (0, vitest_1.it)('create wraps uri and file() catch branch rethrows', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            Uri: {
                file: (_p) => { throw new Error('boom'); },
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
        (0, vitest_1.expect)(() => f.file('/will-throw')).toThrow('boom');
        const created = f.create({ fsPath: '/ok', path: '/ok' });
        (0, vitest_1.expect)(created.uri.fsPath).toBe('/ok');
    });
});
//# sourceMappingURL=vscode-uri-factory.adapter.create-catch.test.js.map