"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
const TextDocument_adapter_js_1 = require("./TextDocument.adapter.js");
class WorkspaceAdapter {
    getConfiguration(section) {
        return vscode.workspace.getConfiguration(section);
    }
    get fs() {
        return vscode.workspace.fs;
    }
    get workspaceFolders() {
        return vscode.workspace.workspaceFolders;
    }
    onDidChangeConfiguration(listener) {
        return vscode.workspace.onDidChangeConfiguration(listener);
    }
    createFileSystemWatcher(pattern) {
        if (typeof pattern === 'string') {
            return vscode.workspace.createFileSystemWatcher(pattern);
        }
        else {
            // pattern is IRelativePattern, we need to create a VSCode RelativePattern
            const vscodePattern = new vscode.RelativePattern(pattern.base, pattern.pattern);
            return vscode.workspace.createFileSystemWatcher(vscodePattern);
        }
    }
    async openTextDocument(uri) {
        const document = await vscode.workspace.openTextDocument(uri);
        return new TextDocument_adapter_js_1.TextDocumentAdapter(document);
    }
}
exports.WorkspaceAdapter = WorkspaceAdapter;
//# sourceMappingURL=Workspace.adapter.js.map