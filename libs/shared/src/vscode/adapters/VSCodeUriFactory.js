"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VSCodeUriFactory = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
const Uri_adapter_js_1 = require("./Uri.adapter.js");
class VSCodeUriFactory {
    file(path) {
        // Validate path before creating URI
        // (debug logs removed)
        if (!path || typeof path !== 'string' || path.trim() === '') {
            console.warn('[VSCodeUriFactory] Invalid path provided to file():', path);
            // Return a fallback URI to prevent crashes
            return new Uri_adapter_js_1.UriAdapter(vscode.Uri.file('/invalid-path'));
        }
        try {
            // (debug logs removed)
            const vscodeUri = vscode.Uri.file(path);
            // (debug logs removed)
            return new Uri_adapter_js_1.UriAdapter(vscodeUri);
        }
        catch (error) {
            // (error logs kept as thrown error)
            throw error;
        }
    }
    create(uri) {
        return new Uri_adapter_js_1.UriAdapter(uri);
    }
    joinPath(base, ...paths) {
        const vscodeBase = base.uri;
        // Validate paths before joining
        const validPaths = paths.filter(path => path && typeof path === 'string' && path.trim() !== '');
        if (validPaths.length !== paths.length) {
            // (warn removed)
        }
        return new Uri_adapter_js_1.UriAdapter(vscode.Uri.joinPath(vscodeBase, ...validPaths));
    }
    dirname(uri) {
        const vscodeUri = uri.uri;
        // Validate URI before processing
        if (!vscodeUri || !vscodeUri.path) {
            // (warn removed)
            // Return a fallback URI to prevent crashes
            return new Uri_adapter_js_1.UriAdapter(vscode.Uri.file('/'));
        }
        return new Uri_adapter_js_1.UriAdapter(vscode.Uri.joinPath(vscodeUri, '..'));
    }
}
exports.VSCodeUriFactory = VSCodeUriFactory;
//# sourceMappingURL=VSCodeUriFactory.js.map