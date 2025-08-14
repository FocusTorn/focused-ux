"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipboardAdapter = exports.EnvAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class EnvAdapter {
    get clipboard() {
        return new ClipboardAdapter();
    }
}
exports.EnvAdapter = EnvAdapter;
class ClipboardAdapter {
    async readText() {
        return await vscode.env.clipboard.readText();
    }
    async writeText(text) {
        return await vscode.env.clipboard.writeText(text);
    }
}
exports.ClipboardAdapter = ClipboardAdapter;
//# sourceMappingURL=Env.adapter.js.map