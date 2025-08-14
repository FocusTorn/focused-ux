"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceCCPAdapter = void 0;
class WorkspaceCCPAdapter {
    workspaceAdapter;
    constructor(workspaceAdapter) {
        this.workspaceAdapter = workspaceAdapter;
    }
    get workspaceFolders() {
        const folders = this.workspaceAdapter.workspaceFolders;
        return folders?.map((f) => ({ uri: f.uri.fsPath, name: f.name }));
    }
    asRelativePath(pathOrUri, _includeWorkspaceFolder) {
        // This would need to be implemented using the workspace adapter
        // For now, we'll use a simple implementation
        return pathOrUri;
    }
    get(section, key) {
        return this.workspaceAdapter.getConfiguration(section).get(key);
    }
    onDidChangeConfiguration(listener) {
        return this.workspaceAdapter.onDidChangeConfiguration((e) => {
            // Check if the configuration change affects 'ccp'
            if (e.affectsConfiguration && e.affectsConfiguration('ccp')) {
                listener();
            }
        });
    }
    createFileSystemWatcher(pattern) {
        return this.workspaceAdapter.createFileSystemWatcher(pattern);
    }
    getConfiguration(section) {
        return this.workspaceAdapter.getConfiguration(section);
    }
    get fs() {
        return this.workspaceAdapter.fs;
    }
    async openTextDocument(uri) {
        return this.workspaceAdapter.openTextDocument(uri);
    }
}
exports.WorkspaceCCPAdapter = WorkspaceCCPAdapter;
//# sourceMappingURL=WorkspaceCCP.adapter.js.map