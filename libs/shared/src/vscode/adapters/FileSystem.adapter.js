"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemAdapter = void 0;
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("node:fs/promises"));
class FileSystemAdapter {
    async stat(path) {
        const stats = await fs.stat(path);
        return {
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
        };
    }
    access(path) {
        return fs.access(path);
    }
    copyFile(src, dest) {
        return fs.copyFile(src, dest);
    }
    readFile(path) {
        return fs.readFile(path, 'utf-8');
    }
    readDirectory(_path) {
        throw new Error('Method not implemented.');
    }
    writeFile(path, content) {
        return fs.writeFile(path, content);
    }
    async createDirectory(path) {
        try {
            await fs.mkdir(path, { recursive: true });
        }
        catch (error) {
            console.warn(`[FileSystemAdapter] Failed to create directory: ${path}`, error);
            throw error;
        }
    }
}
exports.FileSystemAdapter = FileSystemAdapter;
//# sourceMappingURL=FileSystem.adapter.js.map