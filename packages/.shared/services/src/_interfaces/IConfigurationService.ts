export interface IConfigurationService {
	get<T>(key: string, defaultValue: T): Promise<T>
}