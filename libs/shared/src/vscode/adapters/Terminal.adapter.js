"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class TerminalAdapter {
    get activeTerminal() {
        return vscode.window.activeTerminal;
    }
    createTerminal(name) {
        return vscode.window.createTerminal(name);
    }
}
exports.TerminalAdapter = TerminalAdapter;
//# sourceMappingURL=Terminal.adapter.js.map