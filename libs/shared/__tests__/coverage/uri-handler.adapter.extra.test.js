"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('coverage-only: UriHandlerAdapter extra coverage', () => {
    (0, vitest_1.it)('static create wraps to call handler with UriAdapter', async () => {
        vitest_1.vi.resetModules();
        const handler = { handleUri: vitest_1.vi.fn(async (_u) => undefined) };
        const { UriHandlerAdapter } = await import('../../src/vscode/adapters/UriHandler.adapter.js');
        const vsHandler = UriHandlerAdapter.create(handler);
        await vsHandler.handleUri({ fsPath: '/x', path: '/x' });
        (0, vitest_1.expect)(handler.handleUri).toHaveBeenCalled();
    });
});
//# sourceMappingURL=uri-handler.adapter.extra.test.js.map