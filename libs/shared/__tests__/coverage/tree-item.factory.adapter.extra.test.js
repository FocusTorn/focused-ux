"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: TreeItemFactoryAdapter extra branches', () => {
    (0, vitest_1.it)('create assigns checkboxState when provided; UriFactory.file proxies', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            TreeItem: class {
                label;
                collapsibleState;
                constructor(label, collapsibleState) {
                    this.label = label;
                    this.collapsibleState = collapsibleState;
                }
            },
            TreeItemCollapsibleState: { None: 0 },
            ThemeIcon: class {
                id;
                constructor(id) {
                    this.id = id;
                }
            },
            Uri: { file: (p) => ({ fsPath: p, path: p }) },
        }));
        const { TreeItemFactoryAdapter, UriFactory } = await import('../../src/vscode/adapters/TreeItemFactory.adapter.js');
        const f = new TreeItemFactoryAdapter();
        const ti = f.create('L', 0, { state: 'on' });
        (0, vitest_1.expect)(ti.checkboxState).toEqual({ state: 'on' });
        const vsUri = UriFactory.file('/x');
        (0, vitest_1.expect)(vsUri.fsPath ?? vsUri.uri?.fsPath).toBe('/x');
    });
});
//# sourceMappingURL=tree-item.factory.adapter.extra.test.js.map