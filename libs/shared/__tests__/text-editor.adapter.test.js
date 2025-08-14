"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('TextEditorAdapter', () => {
    (0, vitest_1.it)('edit uses EditBuilderAdapter and replaces text with converted range', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({
            Range: class Range {
                start;
                end;
                constructor(start, end) {
                    this.start = start;
                    this.end = end;
                }
            },
        }));
        const replaceSpy = vitest_1.vi.fn();
        const editor = { edit: (fn) => { fn({ replace: replaceSpy }); return Promise.resolve(true); } };
        const { TextEditorAdapter, EditBuilderAdapter } = await import('../src/vscode/adapters/TextEditor.adapter.js');
        const { RangeAdapter } = await import('../src/vscode/adapters/Range.adapter.js');
        const vs = await import('vscode');
        const start = { create: () => ({ line: 1, character: 2 }) };
        const end = { create: () => ({ line: 3, character: 4 }) };
        const range = { start, end };
        const a = new TextEditorAdapter(editor);
        await a.edit((eb) => {
            eb.replace(range, 'x');
        });
        (0, vitest_1.expect)(replaceSpy).toHaveBeenCalled();
        const [r, text] = replaceSpy.mock.calls[0];
        (0, vitest_1.expect)(r).toBeInstanceOf(vs.Range);
        (0, vitest_1.expect)(text).toBe('x');
    });
});
//# sourceMappingURL=text-editor.adapter.test.js.map