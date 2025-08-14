"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
const showTimedInformationMessage_js_1 = require("../../utils/showTimedInformationMessage.js");
class WindowAdapter {
    configurationService;
    _explorerView;
    constructor(configurationService) {
        this.configurationService = configurationService;
    }
    setExplorerView(view) {
        this._explorerView = view;
    }
    // IWindow interface
    get activeTextEditor() {
        return vscode.window.activeTextEditor;
    }
    get activeTextEditorUri() {
        return vscode.window.activeTextEditor?.document.uri.fsPath;
    }
    showErrorMessage(message) {
        const safeMessage = message && typeof message === 'string' ? message : 'An unknown error occurred.';
        vscode.window.showErrorMessage(safeMessage);
    }
    // Unified showInformationMessage that handles different signatures
    async showInformationMessage(message, modalOrItems, ...items) {
        const raw = message && typeof message === 'string' ? message : '';
        const safeMessage = raw.length > 0 ? raw : ' ';
        if (typeof modalOrItems === 'boolean') {
            // IWindowPB signature: (message, modal, ...items)
            return await vscode.window.showInformationMessage(safeMessage, { modal: modalOrItems }, ...items);
        }
        else {
            // IWindow signature: (message, ...items)
            const allItems = modalOrItems ? [modalOrItems, ...items] : items;
            return await vscode.window.showInformationMessage(safeMessage, ...allItems);
        }
    }
    async showWarningMessage(message, options, ...items) {
        const raw = message && typeof message === 'string' ? message : '';
        const safeMessage = raw.length > 0 ? raw : ' ';
        return await vscode.window.showWarningMessage(safeMessage, options, ...items);
    }
    async showInputBox(options) {
        return await vscode.window.showInputBox(options);
    }
    async showTextDocument(doc) {
        // Handle TextDocumentAdapter by extracting the underlying VSCode TextDocument
        if (doc && typeof doc === 'object' && 'document' in doc && doc.document) {
            return await vscode.window.showTextDocument(doc.document);
        }
        return await vscode.window.showTextDocument(doc);
    }
    createTreeView(viewId, options) {
        return vscode.window.createTreeView(viewId, options);
    }
    registerTreeDataProvider(viewId, provider) {
        return vscode.window.registerTreeDataProvider(viewId, provider);
    }
    async withProgress(options, task) {
        return await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            ...options,
        }, task);
    }
    // Unified setStatusBarMessage that handles optional timeout
    setStatusBarMessage(message, timeout) {
        if (timeout !== undefined) {
            vscode.window.setStatusBarMessage(message, timeout);
        }
        else {
            vscode.window.setStatusBarMessage(message);
        }
    }
    registerUriHandler(handler) {
        return vscode.window.registerUriHandler(handler);
    }
    // IWindowCCP specific methods
    setClipboard(text) {
        return Promise.resolve(vscode.env.clipboard.writeText(text));
    }
    async showDropdownMessage(message, durationInMs) {
        if (!this._explorerView)
            return;
        const finalDurationMs = await this._getDuration(durationInMs, 'ContextCherryPicker.settings.message_show_seconds');
        this._explorerView.message = message;
        setTimeout(() => {
            if (this._explorerView && this._explorerView.message === message) {
                this._explorerView.message = undefined;
            }
        }, finalDurationMs);
    }
    async showDescriptionMessage(message, durationInMs) {
        if (!this._explorerView)
            return;
        const finalDurationMs = await this._getDuration(durationInMs, 'ContextCherryPicker.settings.message_show_seconds');
        this._explorerView.description = message;
        setTimeout(() => {
            if (this._explorerView && this._explorerView.description === message) {
                this._explorerView.description = '';
            }
        }, finalDurationMs);
    }
    // Unified showTimedInformationMessage method
    async showTimedInformationMessage(message, duration) {
        const raw = message && typeof message === 'string' ? message : '';
        const safeMessage = raw.length > 0 ? raw : ' ';
        let finalDurationMs = duration;
        if (finalDurationMs === undefined) {
            const durationSeconds = await this.configurationService.get('FocusedUX.info_message_show_seconds', 1.5);
            finalDurationMs = durationSeconds * 1000;
        }
        await (0, showTimedInformationMessage_js_1.showTimedInformationMessage)(this, safeMessage, finalDurationMs);
    }
    async _getDuration(duration, configKey = 'FocusedUX.info_message_show_seconds') {
        if (duration !== undefined) {
            return duration;
        }
        const durationSeconds = await this.configurationService.get(configKey, 1.5);
        return durationSeconds * 1000;
    }
}
exports.WindowAdapter = WindowAdapter;
//# sourceMappingURL=Window.adapter.js.map