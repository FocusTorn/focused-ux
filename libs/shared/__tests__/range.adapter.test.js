"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
(0, vitest_1.describe)('RangeAdapter', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetModules();
    });
    (0, vitest_1.it)('creates a range and exposes start/end creators', async () => {
        const makePos = (line, character) => ({ line, character });
        const start = makePos(1, 2);
        const end = makePos(3, 4);
        vitest_1.vi.mock('vscode', () => {
            class Position {
                line;
                character;
                constructor(line, character) {
                    this.line = line;
                    this.character = character;
                }
            }
            class Range {
                start;
                end;
                constructor(start, end) {
                    this.start = start;
                    this.end = end;
                }
            }
            return { Position, Range };
        });
        const { RangeAdapter } = await import('../src/vscode/adapters/Range.adapter.js');
        const vs = await import('vscode');
        const posStart = new vs.Position(start.line, start.character);
        const posEnd = new vs.Position(end.line, end.character);
        const range = RangeAdapter.create(posStart, posEnd);
        (0, vitest_1.expect)(range.start.create(0, 0)).toEqual(posStart);
        (0, vitest_1.expect)(range.end.create(0, 0)).toEqual(posEnd);
    });
});
//# sourceMappingURL=range.adapter.test.js.map