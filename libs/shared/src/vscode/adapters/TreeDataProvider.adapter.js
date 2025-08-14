"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreeDataProviderAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class TreeDataProviderAdapter {
    service;
    treeItemFactory;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    serviceListener;
    constructor(service, treeItemFactory) {
        this.service = service;
        this.treeItemFactory = treeItemFactory;
        this.serviceListener = this.service.onDidChangeTreeData((item) => {
            this._onDidChangeTreeData.fire(item);
        });
    }
    dispose() {
        this.serviceListener.dispose();
        this._onDidChangeTreeData.dispose();
    }
    getTreeItem(element) {
        return this.treeItemFactory(element);
    }
    getChildren(element) {
        return this.service.getChildren(element);
    }
}
exports.TreeDataProviderAdapter = TreeDataProviderAdapter;
//# sourceMappingURL=TreeDataProvider.adapter.js.map