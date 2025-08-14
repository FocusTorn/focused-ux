"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeItemCollapsibleStateAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class TreeItemCollapsibleStateAdapter {
    get None() { return vscode.TreeItemCollapsibleState.None; }
    get Collapsed() { return vscode.TreeItemCollapsibleState.Collapsed; }
    get Expanded() { return vscode.TreeItemCollapsibleState.Expanded; }
}
exports.TreeItemCollapsibleStateAdapter = TreeItemCollapsibleStateAdapter;
//# sourceMappingURL=TreeItemCollapsibleState.adapter.js.map