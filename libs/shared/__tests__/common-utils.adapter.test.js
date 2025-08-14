"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('CommonUtilsAdapter', () => {
    (0, vitest_1.it)('errMsg sanitizes and calls window.showErrorMessage', async () => {
        const win = { showErrorMessage: vitest_1.vi.fn() };
        const { CommonUtilsAdapter } = await import('../src/vscode/adapters/CommonUtils.adapter.js');
        const a = new CommonUtilsAdapter(win);
        a.errMsg('  bad\nmsg\t\x07 ');
        (0, vitest_1.expect)(win.showErrorMessage).toHaveBeenCalledWith('badmsg');
    });
    (0, vitest_1.it)('delay resolves after given ms', async () => {
        const { CommonUtilsAdapter } = await import('../src/vscode/adapters/CommonUtils.adapter.js');
        const a = new CommonUtilsAdapter({ showErrorMessage: vitest_1.vi.fn() });
        const start = Date.now();
        await a.delay(10);
        (0, vitest_1.expect)(Date.now() - start).toBeGreaterThanOrEqual(9);
    });
});
//# sourceMappingURL=common-utils.adapter.test.js.map