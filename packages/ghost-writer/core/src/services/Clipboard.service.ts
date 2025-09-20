import type { IStorageService } from '../_interfaces/IStorageService.js'
import { ghostWriterConstants } from '../_config/constants.js'
import type { IClipboardService, StoredFragment } from '../_interfaces/IClipboardService.js'

export class ClipboardService implements IClipboardService {

    constructor(private readonly storageService: IStorageService) {}

    public async store(fragment: StoredFragment): Promise<void> {
        await this.storageService.update(ghostWriterConstants.storageKeys.CLIPBOARD, fragment)
    }

    public async retrieve(): Promise<StoredFragment | undefined> {
        return this.storageService.get<StoredFragment>(
            ghostWriterConstants.storageKeys.CLIPBOARD,
        )
    }

    public async clear(): Promise<void> {
        await this.storageService.update(ghostWriterConstants.storageKeys.CLIPBOARD, undefined)
    }

}
