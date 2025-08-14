"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelativePatternAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class RelativePatternAdapter {
    relativePattern;
    constructor(relativePattern) {
        this.relativePattern = relativePattern;
    }
    get pattern() { return this.relativePattern.pattern; }
    get base() { return this.relativePattern.base; }
    static create(base, pattern) {
        const relativePattern = new vscode.RelativePattern(base, pattern);
        return new RelativePatternAdapter(relativePattern);
    }
}
exports.RelativePatternAdapter = RelativePatternAdapter;
//# sourceMappingURL=RelativePattern.adapter.js.map