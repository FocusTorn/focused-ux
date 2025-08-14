"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('UriAdapter factory methods', () => {
    (0, vitest_1.it)('exercises setFactory/getFactory and static methods', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({ Uri: { file: (p) => ({ fsPath: p, path: p, toString: () => `file://${p}` }) } }));
        const { UriAdapter } = await import('../src/vscode/adapters/Uri.adapter.js');
        const factory = {
            file: (p) => new UriAdapter({ fsPath: p, path: p, toString: () => `file://${p}` }),
            create: (u) => new UriAdapter(u),
            joinPath: (b, ...segs) => new UriAdapter({ fsPath: [b.uri.fsPath, ...segs].join('/'), path: [b.uri.path, ...segs].join('/') }),
            dirname: (u) => new UriAdapter({ fsPath: `${u.uri.fsPath}/..`, path: `${u.uri.path}/..` }),
        };
        UriAdapter.setFactory(factory);
        (0, vitest_1.expect)(UriAdapter.getFactory()).toBe(factory);
        const f = UriAdapter.file('/p');
        (0, vitest_1.expect)(f.fsPath ?? f.uri?.fsPath).toContain('/p');
        const c = UriAdapter.create({ fsPath: '/x', path: '/x' });
        (0, vitest_1.expect)(c.fsPath ?? c.uri?.fsPath).toContain('/x');
        const j = UriAdapter.joinPath(c, 'a');
        (0, vitest_1.expect)((j.fsPath ?? j.uri?.fsPath)).toContain('/x/a');
        const d = UriAdapter.dirname(c);
        (0, vitest_1.expect)((d.fsPath ?? d.uri?.fsPath)).toContain('/x/..');
    });
});
//# sourceMappingURL=uri.adapter.factory.test.js.map