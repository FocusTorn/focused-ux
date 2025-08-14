"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: VSCodeUriFactory error branches', () => {
    (0, vitest_1.it)('joinPath filters invalid inputs', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            Uri: {
                file: (p) => ({ fsPath: p, path: p }),
                joinPath: (base, ...segs) => ({ fsPath: [base.fsPath, ...segs].join('/'), path: [base.path, ...segs].join('/') }),
            },
        }));
        // Break circular import between VSCodeUriFactory and UriAdapter default-factory
        vitest_1.vi.mock('../../src/vscode/adapters/Uri.adapter.js', () => ({
            UriAdapter: class {
                uri;
                constructor(uri) {
                    this.uri = uri;
                }
            },
        }));
        const { VSCodeUriFactory: VF2 } = await import('../../src/vscode/adapters/VSCodeUriFactory.js');
        const g = new VF2();
        const j = g.joinPath({ uri: { fsPath: '/r', path: '/r' } }, 'a', '', 'b');
        (0, vitest_1.expect)(j.path ?? j.uri?.path).toContain('/r/a/b');
    });
});
//# sourceMappingURL=vscode-uri-factory.adapter.extra.test.js.map