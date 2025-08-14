"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('RelativePatternAdapter', () => {
    (0, vitest_1.it)('exposes base and pattern; static create wraps instance', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({ RelativePattern: class {
                base;
                pattern;
                constructor(base, pattern) {
                    this.base = base;
                    this.pattern = pattern;
                }
            } }));
        const { RelativePatternAdapter } = await import('../src/vscode/adapters/RelativePattern.adapter.js');
        const RP = (await import('vscode')).RelativePattern;
        const inst = new RelativePatternAdapter(new RP('/b', '**/*.ts'));
        (0, vitest_1.expect)(inst.base).toBe('/b');
        (0, vitest_1.expect)(inst.pattern).toBe('**/*.ts');
        const created = RelativePatternAdapter.create('/x', '*.md');
        (0, vitest_1.expect)(created.relativePattern.base).toBe('/x');
        (0, vitest_1.expect)(created.relativePattern.pattern).toBe('*.md');
    });
});
//# sourceMappingURL=relative-pattern.adapter.test.js.map