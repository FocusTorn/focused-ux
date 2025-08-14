"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PathUtilsAdapter = void 0;
const tslib_1 = require("tslib");
const path = tslib_1.__importStar(require("node:path"));
class PathUtilsAdapter {
    getDottedPath(from, to) {
        if (!from || !to || typeof from !== 'string' || typeof to !== 'string') {
            return undefined;
        }
        if (from.trim() === '' || to.trim() === '') {
            return undefined;
        }
        try {
            const toDir = path.dirname(to);
            // Calculate path from the destination's directory to the source file
            const relativePath = path.relative(toDir, from);
            if (!relativePath) {
                return undefined;
            }
            // Normalize path separators for consistency
            const posixPath = String(relativePath).replace(/\\/g, '/');
            return posixPath.startsWith('.') ? posixPath : `./${posixPath}`;
        }
        catch (error) {
            return undefined;
        }
    }
    sanitizePath(pathStr) {
        // Replace invalid characters in filenames/foldernames
        // This is now only used for sanitizing individual names, not full paths
        if (!pathStr || typeof pathStr !== 'string') {
            return '';
        }
        const sanitized = String(pathStr).replace(/[<>"|?*]/g, '_');
        // Ensure we return a valid string
        if (!sanitized || sanitized.trim() === '') {
            return '_';
        }
        return sanitized;
    }
}
exports.PathUtilsAdapter = PathUtilsAdapter;
//# sourceMappingURL=PathUtils.adapter.js.map