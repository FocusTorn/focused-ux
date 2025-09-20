import * as path from 'node:path'
import type { IPathUtilsAdapter } from '@fux/ghost-writer-core'

export class PathUtilsAdapter implements IPathUtilsAdapter {

    getDottedPath(from: string, to: string): string | undefined {
        try {
            const relativePath = path.relative(path.dirname(to), from)

            return relativePath.startsWith('.') ? relativePath : `./${relativePath}`
        }
        catch {
            return undefined
        }
    }

}
