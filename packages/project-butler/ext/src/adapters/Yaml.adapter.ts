import { load as loadYaml } from 'js-yaml'

interface IYamlAdapter {
    load: (content: string) => unknown
}

export class YamlAdapter implements IYamlAdapter {

    load(content: string): unknown {
        return loadYaml(content)
    }

}
