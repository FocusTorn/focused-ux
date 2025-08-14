"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: TreeItemAdapter edge branches', () => {
    (0, vitest_1.it)('create() with resourceUri, iconPath getter undefined, ThemeColorAdapter color undefined', async () => {
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
        const { TreeItemAdapter, ThemeIconAdapter } = await import('../../src/vscode/adapters/TreeItem.adapter.js');
        const vs = await import('vscode');
        const created = TreeItemAdapter.create('L', 1, vs.Uri.file('/r'));
        (0, vitest_1.expect)(created.resourceUri?.uri?.fsPath).toBe('/r');
        const a = new TreeItemAdapter(new vs.TreeItem('x', 0));
        (0, vitest_1.expect)(a.iconPath).toBeUndefined();
        const icon = new ThemeIconAdapter({ id: 'i', color: undefined });
        (0, vitest_1.expect)(icon.color).toBeUndefined();
        // Also cover ThemeIconAdapter.create path which sets a ThemeIcon and exposes a color when provided
        const color = new vs.ThemeColor('c');
        const themed = (await import('../../src/vscode/adapters/TreeItem.adapter.js')).ThemeIconAdapter.create('ico', color);
        (0, vitest_1.expect)(themed.color?.id).toBe('c');
    });
});
//# sourceMappingURL=tree-item.adapter.extra.test.js.map