"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: TreeItemFactoryAdapter extra', () => {
    (0, vitest_1.it)('covers checkboxState branch', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            TreeItem: class {
                label;
                collapsibleState;
                constructor(label, collapsibleState) {
                    this.label = label;
                    this.collapsibleState = collapsibleState;
                }
                checkboxState;
            },
            TreeItemCollapsibleState: { None: 0 },
            ThemeIcon: class {
                id;
                constructor(id) {
                    this.id = id;
                }
            },
        }));
        const { TreeItemFactoryAdapter } = await import('../../src/vscode/adapters/TreeItemFactory.adapter.js');
        const f = new TreeItemFactoryAdapter();
        const ti = f.create('L', 0, 1);
        (0, vitest_1.expect)(ti.checkboxState).toBe(1);
    });
});
//# sourceMappingURL=tree-item-factory.adapter.extra.test.js.map