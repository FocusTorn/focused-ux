"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const showTimedInformationMessage_js_1 = require("../src/utils/showTimedInformationMessage.js");
(0, vitest_1.describe)('showTimedInformationMessage', () => {
    (0, vitest_1.it)('invokes withProgress with provided title and waits approximately duration', async () => {
        const calls = [];
        const window = {
            withProgress: async (options, task) => {
                calls.push({ title: options.title });
                const result = await task({ report: (_v) => { } });
                return result;
            },
        };
        const start = Date.now();
        await (0, showTimedInformationMessage_js_1.showTimedInformationMessage)(window, 'Hello', 10);
        const elapsed = Date.now() - start;
        (0, vitest_1.expect)(calls).toHaveLength(1);
        (0, vitest_1.expect)(calls[0].title).toBe('Hello');
        // Allow some jitter on CI; only assert it waited at least ~8ms
        (0, vitest_1.expect)(elapsed).toBeGreaterThanOrEqual(8);
    });
});
//# sourceMappingURL=showTimedInformationMessage.test.js.map