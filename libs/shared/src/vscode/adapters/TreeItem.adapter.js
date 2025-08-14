"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeColorAdapter = exports.ThemeIconAdapter = exports.TreeItemAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
const Uri_adapter_js_1 = require("./Uri.adapter.js");
class TreeItemAdapter {
    treeItem;
    constructor(treeItem) {
        this.treeItem = treeItem;
    }
    get label() { return this.treeItem.label; }
    set label(value) { this.treeItem.label = value; }
    get resourceUri() {
        return this.treeItem.resourceUri ? new Uri_adapter_js_1.UriAdapter(this.treeItem.resourceUri) : undefined;
    }
    set resourceUri(value) {
        this.treeItem.resourceUri = value ? value.uri : undefined;
    }
    get description() { return this.treeItem.description; }
    set description(value) { this.treeItem.description = value; }
    get tooltip() { return this.treeItem.tooltip; }
    set tooltip(value) { this.treeItem.tooltip = value; }
    get contextValue() { return this.treeItem.contextValue; }
    set contextValue(value) { this.treeItem.contextValue = value; }
    get iconPath() {
        return this.treeItem.iconPath ? new ThemeIconAdapter(this.treeItem.iconPath) : undefined;
    }
    set iconPath(value) {
        this.treeItem.iconPath = value ? value.themeIcon : undefined;
    }
    get collapsibleState() { return this.treeItem.collapsibleState; }
    set collapsibleState(value) { this.treeItem.collapsibleState = value; }
    static create(label, collapsibleState, resourceUri) {
        const treeItem = new vscode.TreeItem(label, collapsibleState);
        if (resourceUri) {
            treeItem.resourceUri = resourceUri;
        }
        return new TreeItemAdapter(treeItem);
    }
    // Expose the underlying VS Code TreeItem for providers that must return a real TreeItem
    toVsCode() {
        return this.treeItem;
    }
}
exports.TreeItemAdapter = TreeItemAdapter;
class ThemeIconAdapter {
    themeIcon;
    constructor(themeIcon) {
        this.themeIcon = themeIcon;
    }
    get id() { return this.themeIcon.id; }
    get color() {
        return this.themeIcon.color ? new ThemeColorAdapter(this.themeIcon.color) : undefined;
    }
    static create(id, color) {
        const themeIcon = new vscode.ThemeIcon(id, color);
        return new ThemeIconAdapter(themeIcon);
    }
}
exports.ThemeIconAdapter = ThemeIconAdapter;
class ThemeColorAdapter {
    themeColor;
    constructor(themeColor) {
        this.themeColor = themeColor;
    }
    get id() { return this.themeColor.id; }
    static create(id) {
        const themeColor = new vscode.ThemeColor(id);
        return new ThemeColorAdapter(themeColor);
    }
}
exports.ThemeColorAdapter = ThemeColorAdapter;
//# sourceMappingURL=TreeItem.adapter.js.map