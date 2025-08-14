"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuickPickAdapter = void 0;
const tslib_1 = require("tslib");
const vscode = tslib_1.__importStar(require("vscode"));
class QuickPickAdapter {
    async showQuickPickSingle(items, options, propertyKey) {
        const vscodeItems = items.map(item => ({
            label: item.label,
            description: item.description,
            iconPath: item.iconPath,
            data: item[propertyKey],
        }));
        const selected = await vscode.window.showQuickPick(vscodeItems, {
            placeHolder: options.placeHolder,
            matchOnDescription: options.matchOnDescription,
            matchOnDetail: options.matchOnDetail,
        });
        return selected?.data;
    }
}
exports.QuickPickAdapter = QuickPickAdapter;
//# sourceMappingURL=QuickPick.adapter.js.map