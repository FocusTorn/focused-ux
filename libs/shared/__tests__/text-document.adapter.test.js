"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('TextDocumentAdapter', () => {
    (0, vitest_1.it)('wraps uri, getText, positionAt, save', async () => {
        const doc = {
            uri: { fsPath: '/x', toString: () => 'file:///x', path: '/x', query: '', fragment: '' },
            getText: () => 'hello',
            positionAt: (_o) => ({ line: 1, character: 2 }),
            save: async () => undefined,
        };
        const { TextDocumentAdapter } = await import('../src/vscode/adapters/TextDocument.adapter.js');
        const a = new TextDocumentAdapter(doc);
        (0, vitest_1.expect)(a.uri.toString()).toContain('file:///');
        (0, vitest_1.expect)(a.getText()).toBe('hello');
        (0, vitest_1.expect)(a.positionAt(0).create(0, 0)).toEqual({ line: 1, character: 2 });
        await a.save();
    });
});
//# sourceMappingURL=text-document.adapter.test.js.map