export interface IStorageService {
	get: <T>(key: string, defaultValue?: T) => T
	update: (key: string, value: any) => Promise<void>
	delete: (key: string) => Promise<void>
}
