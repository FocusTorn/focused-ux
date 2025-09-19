export interface IYamlAdapter {
    load: (content: string) => unknown
}
