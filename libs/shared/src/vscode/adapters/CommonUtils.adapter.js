"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonUtilsAdapter = void 0;
class CommonUtilsAdapter {
    window;
    constructor(window) {
        this.window = window;
    }
    errMsg(message, _error) {
        const safeMessage = this.ensureStringAndSanitize(message);
        this.window.showErrorMessage(safeMessage);
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    ensureStringAndSanitize(input) {
        // Ensure the input is a string. If it's null/undefined, convert to empty string.
        let result = String(input ?? '');
        // Replace common non-printable ASCII characters (control characters, delete)
        // eslint-disable-next-line no-control-regex
        result = result.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        // Normalize whitespace and newlines
        result = result.replace(/(\r\n|\n|\r)/gm, ' ');
        result = result.replace(/\s+/g, ' ');
        result = result.trim();
        return result.length > 0 ? result : 'Unknown error';
    } //<
}
exports.CommonUtilsAdapter = CommonUtilsAdapter;
//# sourceMappingURL=CommonUtils.adapter.js.map