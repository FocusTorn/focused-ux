"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('TreeItem-related adapters', () => {
    (0, vitest_1.it)('TreeItemAdapter get/set and toVsCode', async () => {
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
        }));
        const { TreeItemAdapter, ThemeIconAdapter, ThemeColorAdapter } = await import('../src/vscode/adapters/TreeItem.adapter.js');
        const vs = await import('vscode');
        const ti = new vs.TreeItem('L', 1);
        const a = new TreeItemAdapter(ti);
        a.label = 'L2';
        (0, vitest_1.expect)(a.label).toBe('L2');
        a.description = 'd';
        (0, vitest_1.expect)(a.description).toBe('d');
        a.tooltip = 't';
        (0, vitest_1.expect)(a.tooltip).toBe('t');
        a.contextValue = 'c';
        (0, vitest_1.expect)(a.contextValue).toBe('c');
        a.collapsibleState = 2;
        (0, vitest_1.expect)(a.collapsibleState).toBe(2);
        const icon = ThemeIconAdapter.create('ico');
        a.iconPath = icon;
        (0, vitest_1.expect)(a.iconPath?.id).toBe('ico');
        const vItem = a.toVsCode();
        (0, vitest_1.expect)(vItem).toBe(ti);
    });
    (0, vitest_1.it)('TreeItemFactoryAdapter variants', async () => {
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
            ThemeIcon: class {
                id;
                color;
                constructor(id, color) {
                    this.id = id;
                    this.color = color;
                }
            },
            TreeItemCollapsibleState: { None: 0 },
        }));
        const { TreeItemFactoryAdapter } = await import('../src/vscode/adapters/TreeItemFactory.adapter.js');
        const f = new TreeItemFactoryAdapter();
        const a = f.create('A', 0);
        (0, vitest_1.expect)(a.label).toBe('A');
        const b = f.createWithIcon('B', 'ico');
        (0, vitest_1.expect)(b.iconPath.id).toBe('ico');
        const c = f.createWithCommand('C', 'cmd');
        (0, vitest_1.expect)(c.command).toEqual({ command: 'cmd', title: 'C' });
    });
});
//# sourceMappingURL=tree-item.adapter.test.js.map