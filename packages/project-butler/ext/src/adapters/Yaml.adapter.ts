import { load as loadYaml } from 'js-yaml'

export interface IYamlAdapter {
	load: (content: string) => any
}

export class YamlAdapter implements IYamlAdapter {

	load(content: string): any {
		return loadYaml(content)
	}

}
