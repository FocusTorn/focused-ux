"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextDocumentAdapter = void 0;
const Uri_adapter_js_1 = require("./Uri.adapter.js");
class TextDocumentAdapter {
    document;
    constructor(document) {
        this.document = document;
    }
    get uri() {
        return new Uri_adapter_js_1.UriAdapter(this.document.uri);
    }
    getText() {
        return this.document.getText();
    }
    positionAt(offset) {
        const position = this.document.positionAt(offset);
        return {
            create: (_line, _character) => position,
        };
    }
    async save() {
        await this.document.save();
    }
}
exports.TextDocumentAdapter = TextDocumentAdapter;
//# sourceMappingURL=TextDocument.adapter.js.map