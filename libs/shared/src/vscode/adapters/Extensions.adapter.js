"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionsAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class ExtensionsAdapter {
    get all() {
        return vscode.extensions.all;
    }
}
exports.ExtensionsAdapter = ExtensionsAdapter;
//# sourceMappingURL=Extensions.adapter.js.map