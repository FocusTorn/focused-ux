"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showTimedInformationMessage = showTimedInformationMessage;
async function showTimedInformationMessage(window, message, durationMs) {
    await window.withProgress({
        title: message,
        cancellable: false,
    }, async () => {
        await new Promise(resolve => setTimeout(resolve, durationMs));
    });
}
//# sourceMappingURL=showTimedInformationMessage.js.map