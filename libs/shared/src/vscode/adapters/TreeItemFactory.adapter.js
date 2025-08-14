"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UriFactory = exports.TreeItemFactoryAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class TreeItemFactoryAdapter {
    create(label, collapsibleState, checkboxState) {
        const treeItem = new vscode.TreeItem(label, collapsibleState);
        if (checkboxState !== undefined) {
            treeItem.checkboxState = checkboxState;
        }
        return treeItem;
    }
    createWithIcon(label, iconPath, collapsibleState = vscode.TreeItemCollapsibleState.None) {
        const treeItem = new vscode.TreeItem(label, collapsibleState);
        treeItem.iconPath = new vscode.ThemeIcon(iconPath);
        return treeItem;
    }
    createWithCommand(label, command, collapsibleState = vscode.TreeItemCollapsibleState.None) {
        const treeItem = new vscode.TreeItem(label, collapsibleState);
        treeItem.command = { command, title: label };
        return treeItem;
    }
}
exports.TreeItemFactoryAdapter = TreeItemFactoryAdapter;
class UriFactory {
    static file(path) {
        return vscode.Uri.file(path);
    }
}
exports.UriFactory = UriFactory;
//# sourceMappingURL=TreeItemFactory.adapter.js.map