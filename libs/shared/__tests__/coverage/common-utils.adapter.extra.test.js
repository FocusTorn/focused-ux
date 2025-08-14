"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: CommonUtilsAdapter extra branches', () => {
    (0, vitest_1.it)('errMsg maps undefined/empty to "Unknown error" and normalizes whitespace/control', async () => {
        const win = { showErrorMessage: vitest_1.vi.fn() };
        const { CommonUtilsAdapter } = await import('../../src/vscode/adapters/CommonUtils.adapter.js');
        const a = new CommonUtilsAdapter(win);
        // undefined → Unknown error
        a.errMsg(undefined);
        (0, vitest_1.expect)(win.showErrorMessage).toHaveBeenCalledWith('Unknown error');
        // whitespace only → Unknown error
        a.errMsg('   \n\t  ');
        (0, vitest_1.expect)(win.showErrorMessage).toHaveBeenCalledWith('Unknown error');
        // control/newlines normalized and trimmed
        a.errMsg('  bad\nmsg\t\x07 ');
        (0, vitest_1.expect)(win.showErrorMessage).toHaveBeenCalledWith('badmsg');
    });
});
//# sourceMappingURL=common-utils.adapter.extra.test.js.map