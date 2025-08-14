"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('TreeItemCollapsibleStateAdapter', () => {
    (0, vitest_1.it)('maps to vscode enum values', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({ TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 } }));
        const { TreeItemCollapsibleStateAdapter } = await import('../src/vscode/adapters/TreeItemCollapsibleState.adapter.js');
        const a = new TreeItemCollapsibleStateAdapter();
        (0, vitest_1.expect)(a.None).toBe(0);
        (0, vitest_1.expect)(a.Collapsed).toBe(1);
        (0, vitest_1.expect)(a.Expanded).toBe(2);
    });
});
//# sourceMappingURL=tree-item-collapsible-state.adapter.test.js.map