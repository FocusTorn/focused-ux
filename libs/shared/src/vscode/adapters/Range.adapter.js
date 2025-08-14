"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class RangeAdapter {
    range;
    constructor(range) {
        this.range = range;
    }
    get start() {
        return {
            create: (_line, _character) => this.range.start,
        };
    }
    get end() {
        return {
            create: (_line, _character) => this.range.end,
        };
    }
    static create(start, end) {
        return new RangeAdapter(new vscode.Range(start, end));
    }
}
exports.RangeAdapter = RangeAdapter;
//# sourceMappingURL=Range.adapter.js.map