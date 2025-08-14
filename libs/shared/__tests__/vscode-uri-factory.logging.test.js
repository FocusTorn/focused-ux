"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('VSCodeUriFactory logging (warn)', () => {
    (0, vitest_1.it)('emits warn on invalid path in file()', async () => {
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
        const warnSpy = vitest_1.vi.spyOn(console, 'warn');
        const { VSCodeUriFactory } = await import('../src/vscode/adapters/VSCodeUriFactory.js');
        const f = new VSCodeUriFactory();
        const _res = f.file('');
        (0, vitest_1.expect)(warnSpy).toHaveBeenCalled();
        const args = warnSpy.mock.calls.at(-1) ?? [];
        (0, vitest_1.expect)(String(args[0])).toContain('Invalid path provided to file()');
    });
});
//# sourceMappingURL=vscode-uri-factory.logging.test.js.map