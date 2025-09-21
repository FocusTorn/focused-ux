import * as path from 'node:path'
import type { IPath } from '@fux/context-cherry-picker-core'

export class PathAdapter implements IPath {
    dirname(p: string): string {
        return path.dirname(p)
    }

    basename(p: string, ext?: string): string {
        return path.basename(p, ext)
    }

    extname(p: string): string {
        return path.extname(p)
    }

    join(...paths: string[]): string {
        return path.join(...paths)
    }

    resolve(...paths: string[]): string {
        return path.resolve(...paths)
    }

    relative(from: string, to: string): string {
        return path.relative(from, to)
    }

    isAbsolute(p: string): boolean {
        return path.isAbsolute(p)
    }

    normalize(p: string): string {
        return path.normalize(p)
    }

    sep: string = path.sep
    delimiter: string = path.delimiter
}