"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('TreeDataProviderAdapter', () => {
    (0, vitest_1.it)('wires events, getTreeItem and getChildren', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => {
            const fakeEmitter = { fire: vitest_1.vi.fn(), dispose: vitest_1.vi.fn(), event: Symbol('event') };
            class EventEmitter {
                fire = fakeEmitter.fire;
                dispose = fakeEmitter.dispose;
                get event() { return fakeEmitter.event; }
            }
            return { EventEmitter };
        });
        const { TreeDataProviderAdapter } = await import('../src/vscode/adapters/TreeDataProvider.adapter.js');
        const service = {
            onDidChangeTreeData: (listener) => ({ dispose: vitest_1.vi.fn(() => listener(undefined)) }),
            getChildren: vitest_1.vi.fn().mockResolvedValue([1, 2, 3]),
        };
        const factory = vitest_1.vi.fn((x) => ({ label: String(x) }));
        const a = new TreeDataProviderAdapter(service, factory);
        await a.getChildren();
        (0, vitest_1.expect)(service.getChildren).toHaveBeenCalled();
        (0, vitest_1.expect)(a.getTreeItem(7)).toEqual({ label: '7' });
        a.dispose();
    });
});
//# sourceMappingURL=tree-data-provider.adapter.test.js.map