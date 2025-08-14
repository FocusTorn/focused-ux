"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: TreeItemAdapter setter branches and ThemeColorAdapter.create', () => {
    (0, vitest_1.it)('resourceUri setter handles UriAdapter and undefined; ThemeColorAdapter.create path', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            TreeItem: class {
                label;
                collapsibleState;
                resourceUri;
                iconPath;
                constructor(label, collapsibleState) {
                    this.label = label;
                    this.collapsibleState = collapsibleState;
                    this.resourceUri = undefined;
                    this.iconPath = undefined;
                }
            },
            ThemeIcon: class {
                id;
                color;
                constructor(id, color) {
                    this.id = id;
                    this.color = color;
                }
            },
            ThemeColor: class {
                id;
                constructor(id) {
                    this.id = id;
                }
            },
            Uri: { file: (p) => ({ fsPath: p, path: p }) },
        }));
        const { TreeItemAdapter, ThemeColorAdapter } = await import('../../src/vscode/adapters/TreeItem.adapter.js');
        const { UriAdapter } = await import('../../src/vscode/adapters/Uri.adapter.js');
        const vs = await import('vscode');
        const ti = new vs.TreeItem('L', 1);
        const a = new TreeItemAdapter(ti);
        // resourceUri getter false branch when underlying is undefined
        (0, vitest_1.expect)(a.resourceUri).toBeUndefined();
        // set with UriAdapter
        a.resourceUri = new UriAdapter(vs.Uri.file('/z'));
        (0, vitest_1.expect)(ti.resourceUri.fsPath).toBe('/z');
        // set to undefined clears underlying value
        a.resourceUri = undefined;
        (0, vitest_1.expect)(ti.resourceUri).toBeUndefined();
        // ThemeColorAdapter.create path
        const c = ThemeColorAdapter.create('c');
        (0, vitest_1.expect)(c.id).toBe('c');
        // iconPath setter undefined branch
        a.iconPath = undefined;
        (0, vitest_1.expect)(ti.iconPath).toBeUndefined();
        // TreeItemAdapter.create without resourceUri hits false branch of if (resourceUri)
        const createdNoUri = TreeItemAdapter.create('N', 0);
        (0, vitest_1.expect)(createdNoUri.resourceUri).toBeUndefined();
    });
});
//# sourceMappingURL=tree-item.adapter.branches.test.js.map