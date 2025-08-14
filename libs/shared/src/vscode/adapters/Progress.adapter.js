"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class ProgressAdapter {
    static async withProgress(options, task) {
        return await vscode.window.withProgress(options, task);
    }
}
exports.ProgressAdapter = ProgressAdapter;
//# sourceMappingURL=Progress.adapter.js.map