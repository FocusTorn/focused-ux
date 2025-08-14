"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('DocumentSymbolAdapter', () => {
    (0, vitest_1.it)('wraps name, range and children; static map works', async () => {
        const start = { line: 1, character: 2 };
        const end = { line: 3, character: 4 };
        const range = { start, end };
        const child = { name: 'child', range, children: [] };
        const sym = { name: 'root', range, children: [child] };
        const { DocumentSymbolAdapter } = await import('../src/vscode/adapters/DocumentSymbol.adapter.js');
        const a = new DocumentSymbolAdapter(sym);
        (0, vitest_1.expect)(a.name).toBe('root');
        (0, vitest_1.expect)(a.range.start.create(0, 0)).toEqual(start);
        (0, vitest_1.expect)(a.range.end.create(0, 0)).toEqual(end);
        (0, vitest_1.expect)(a.children?.[0]?.name).toBe('child');
        const mapped = DocumentSymbolAdapter.fromVSCodeSymbols([sym]);
        (0, vitest_1.expect)(mapped[0].name).toBe('root');
    });
});
//# sourceMappingURL=document-symbol.adapter.test.js.map