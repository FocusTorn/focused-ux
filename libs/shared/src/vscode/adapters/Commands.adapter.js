"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandsAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class CommandsAdapter {
    registerCommand(command, callback) {
        return vscode.commands.registerCommand(command, callback);
    }
    async executeCommand(command, ...args) {
        return await vscode.commands.executeCommand(command, ...args);
    }
}
exports.CommandsAdapter = CommandsAdapter;
//# sourceMappingURL=Commands.adapter.js.map