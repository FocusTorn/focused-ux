"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtensionAPIAdapter = exports.ExtensionContextAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class ExtensionContextAdapter {
    context;
    constructor(context) {
        this.context = context;
    }
    get subscriptions() {
        return this.context.subscriptions;
    }
}
exports.ExtensionContextAdapter = ExtensionContextAdapter;
class ExtensionAPIAdapter {
    registerTreeDataProvider(provider) {
        return vscode.window.registerTreeDataProvider('contextCherryPicker', provider);
    }
    registerWebviewViewProvider(id, provider) {
        return vscode.window.registerWebviewViewProvider(id, provider);
    }
    registerCommand(command, callback) {
        return vscode.commands.registerCommand(command, callback);
    }
    createTreeView(id, options) {
        return vscode.window.createTreeView(id, options);
    }
    async executeCommand(command, ...args) {
        return await vscode.commands.executeCommand(command, ...args);
    }
}
exports.ExtensionAPIAdapter = ExtensionAPIAdapter;
//# sourceMappingURL=Extension.adapter.js.map