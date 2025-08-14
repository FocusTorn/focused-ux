"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('QuickPickAdapter', () => {
    (0, vitest_1.it)('maps items and returns selected data', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            window: { showQuickPick: vitest_1.vi.fn(async (items) => items[1]) },
        }));
        const { QuickPickAdapter } = await import('../src/vscode/adapters/QuickPick.adapter.js');
        const a = new QuickPickAdapter();
        const items = [
            { label: 'a', description: 'A', iconPath: undefined, value: 1 },
            { label: 'b', description: 'B', iconPath: undefined, value: 2 },
        ];
        const result = await a.showQuickPickSingle(items, { placeHolder: 'p' }, 'value');
        (0, vitest_1.expect)(result).toBe(2);
    });
});
//# sourceMappingURL=quick-pick.adapter.test.js.map