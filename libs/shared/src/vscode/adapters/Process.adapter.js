"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessAdapter = void 0;
const node_child_process_1 = require("node:child_process");
class ProcessAdapter {
    workspace;
    constructor(workspace) {
        this.workspace = workspace;
    }
    exec(command, options, callback) {
        (0, node_child_process_1.exec)(command, options, callback);
    }
    getWorkspaceRoot() {
        return this.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }
}
exports.ProcessAdapter = ProcessAdapter;
//# sourceMappingURL=Process.adapter.js.map