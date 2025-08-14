"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextAdapter = void 0;
class ContextAdapter {
    context;
    constructor(context) {
        this.context = context;
    }
    get extensionPath() {
        return this.context.extensionUri.fsPath;
    }
}
exports.ContextAdapter = ContextAdapter;
//# sourceMappingURL=Context.adapter.js.map