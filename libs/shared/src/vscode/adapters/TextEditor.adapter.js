"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditBuilderAdapter = exports.TextEditorAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class TextEditorAdapter {
    editor;
    constructor(editor) {
        this.editor = editor;
    }
    async edit(editFunction) {
        return await this.editor.edit((editBuilder) => {
            const adapter = new EditBuilderAdapter(editBuilder);
            editFunction(adapter);
        });
    }
}
exports.TextEditorAdapter = TextEditorAdapter;
class EditBuilderAdapter {
    editBuilder;
    constructor(editBuilder) {
        this.editBuilder = editBuilder;
    }
    replace(range, text) {
        // Convert our IRange to vscode.Range
        const vscodeRange = new vscode.Range(range.start.create(0, 0), range.end.create(0, 0));
        this.editBuilder.replace(vscodeRange, text);
    }
}
exports.EditBuilderAdapter = EditBuilderAdapter;
//# sourceMappingURL=TextEditor.adapter.js.map