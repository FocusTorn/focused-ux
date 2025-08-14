"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('UriHandlerAdapter', () => {
    (0, vitest_1.it)('instance handleUri unwraps UriAdapter and static create wraps handler', async () => {
        const handled = [];
        const handler = { handleUri: async (uri) => { handled.push(uri); } };
        const { UriHandlerAdapter } = await import('../src/vscode/adapters/UriHandler.adapter.js');
        const { UriAdapter } = await import('../src/vscode/adapters/Uri.adapter.js');
        const instance = new UriHandlerAdapter({ handleUri: async (_u) => { } });
        await instance.handleUri(new UriAdapter({ fsPath: '/x', toString: () => 'file:///x', path: '/x', query: '', fragment: '' }));
        const vs = await import('vscode');
        const created = UriHandlerAdapter.create(handler);
        await created.handleUri({ fsPath: '/y', toString: () => 'file:///y', path: '/y', query: '', fragment: '' });
        (0, vitest_1.expect)(handled.length).toBe(1);
        // Ensure the adapter passed
        (0, vitest_1.expect)(handled[0].toString()).toContain('file:///');
    });
});
//# sourceMappingURL=uri-handler.adapter.test.js.map