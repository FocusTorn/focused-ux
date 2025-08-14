"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('PositionAdapter', () => {
    (0, vitest_1.it)('creates vscode.Position', async () => {
        vitest_1.vi.resetModules();
        vitest_1.vi.mock('vscode', () => ({ Position: class {
                line;
                character;
                constructor(line, character) {
                    this.line = line;
                    this.character = character;
                }
            } }));
        const { PositionAdapter } = await import('../src/vscode/adapters/Position.adapter.js');
        const a = new PositionAdapter();
        const p = a.create(5, 7);
        (0, vitest_1.expect)(p.line).toBe(5);
        (0, vitest_1.expect)(p.character).toBe(7);
    });
});
//# sourceMappingURL=position.adapter.test.js.map