export interface TestScaffoldGeneratorSchema {
	name?: string
	project: string
	packageType: 'core' | 'ext' | 'shared' | 'lib'
	includeHelpers?: boolean
	includeVitestConfigs?: boolean
} 