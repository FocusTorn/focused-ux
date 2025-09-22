import { Tree, logger, formatFiles, generateFiles, joinPathFragments, updateJson, runTasksInSerial } from '@nx/devkit'
import { generatorGenerator } from '@nx/plugin/src/generators/generator/generator'
import { PluginAddGeneratorSchema } from './schema'
import { existsSync } from 'fs'
import { join } from 'path'

export default async function addGeneratorGenerator(tree: Tree, options: PluginAddGeneratorSchema) {
    const pluginPath = join(options.directory || './plugins', options.pluginName)
    const generatorPath = join(pluginPath, 'src', 'generators', options.generatorName)
    
    // Check if plugin exists
    if (!existsSync(pluginPath)) {
        logger.error(`Plugin '${options.pluginName}' does not exist at ${pluginPath}`)
        logger.info('Please create the plugin first or check the plugin name.')
        return
    }
    
    // Check if generator already exists
    if (existsSync(generatorPath)) {
        logger.error(`Generator '${options.generatorName}' already exists in plugin '${options.pluginName}'`)
        logger.info('Please choose a different generator name.')
        return
    }
    
    logger.info(`Adding generator '${options.generatorName}' to plugin '${options.pluginName}'`)
    
    const tasks = []
    
    // Generate the generator using Nx's generator generator
    await generatorGenerator(tree, {
        path: `plugins/${options.pluginName}/src/generators/${options.generatorName}`,
        name: options.generatorName,
        description: `${options.generatorName} generator`,
        unitTestRunner: 'none',
        skipFormat: true,
    })
    
    // Update plugin configuration to match vpack structure
    updatePluginConfiguration(tree, options, pluginPath)
    
    // Update tsconfig to match vpack structure
    updateTsConfig(tree, options, pluginPath)
    
    // Update generators.json if needed
    updateGeneratorsJson(tree, options, pluginPath)
    
    // Scaffold variations if requested
    if (options.scaffoldVariations) {
        scaffoldVariations(tree, options, generatorPath)
    }
    
    await formatFiles(tree)
    return runTasksInSerial(...tasks)
}

function updatePluginConfiguration(tree: Tree, options: PluginAddGeneratorSchema, pluginPath: string) {
    const projectJsonPath = join(pluginPath, 'project.json')
    
    if (!tree.exists(projectJsonPath)) {
        logger.warn(`project.json not found at ${projectJsonPath}`)
        return
    }
    
    updateJson(tree, projectJsonPath, (json) => {
        // Update to match vpack structure
        json.name = `@fux/${options.pluginName}`
        json.tags = ['generator']
        
        // Update build configuration to match vpack
        if (json.targets?.build) {
            json.targets.build.options = {
                ...json.targets.build.options,
                main: `plugins/${options.pluginName}/src/index.ts`,
                tsConfig: `plugins/${options.pluginName}/tsconfig.json`,
                bundle: false,
                assets: [
                    {
                        input: `./plugins/${options.pluginName}/src`,
                        glob: '**/!(*.ts)',
                        output: '.'
                    },
                    {
                        input: `./plugins/${options.pluginName}/src`,
                        glob: '**/*.d.ts',
                        output: '.'
                    }
                ]
            }
        }
        
        // Add vpack-style targets
        json.targets = {
            ...json.targets,
            'check-types': { extends: 'check-types' },
            'lint': { extends: 'lint' },
            'audit': { extends: 'audit' },
            'audit:code': { extends: 'audit:code' },
            'audit:test': { extends: 'audit:test' },
            'audit:all': { extends: 'audit:all' },
            'clean': { extends: 'clean' },
            'clean:dist': { extends: 'clean:dist' },
            'clean:cache': { extends: 'clean:cache' },
            'test': { extends: 'test' },
            'test:coverage-tests': { extends: 'test:coverage-tests' }
        }
        
        json.sourceRoot = `plugins/${options.pluginName}/src`
        json.projectType = 'library'
        
        return json
    })
}

function updateTsConfig(tree: Tree, options: PluginAddGeneratorSchema, pluginPath: string) {
    const tsConfigPath = join(pluginPath, 'tsconfig.json')
    
    // Create tsconfig.json based on vpack template
    const tsConfigContent = {
        extends: '../../tsconfig.base.json',
        include: ['src/**/*.ts'],
        exclude: [
            'node_modules',
            '**/*.test.ts',
            '__tests__/**/*',
            'dist/**/*'
        ],
        compilerOptions: {
            rootDir: './src',
            outDir: './dist',
            tsBuildInfoFile: './dist/tsconfig.tsbuildinfo'
        }
    }
    
    tree.write(tsConfigPath, JSON.stringify(tsConfigContent, null, 4))
}

function updateGeneratorsJson(tree: Tree, options: PluginAddGeneratorSchema, pluginPath: string) {
    const generatorsJsonPath = join(pluginPath, 'generators.json')
    
    if (!tree.exists(generatorsJsonPath)) {
        logger.warn(`generators.json not found at ${generatorsJsonPath}`)
        return
    }
    
    updateJson(tree, generatorsJsonPath, (json) => {
        if (!json.generators) {
            json.generators = {}
        }
        
        // Add the new generator
        json.generators[options.generatorName] = {
            factory: `./src/generators/${options.generatorName}/${options.generatorName}`,
            schema: `./src/generators/${options.generatorName}/schema.json`,
            description: `${options.generatorName} generator`
        }
        
        return json
    })
}

function scaffoldVariations(tree: Tree, options: PluginAddGeneratorSchema, generatorPath: string) {
    logger.info(`Scaffolding variations for generator '${options.generatorName}'`)
    
    // Create variations directory
    const variationsPath = join(generatorPath, 'variations')
    
    // Create audit structure variation
    const auditStructurePath = join(variationsPath, 'audit-structure')
    
    generateFiles(tree, joinPathFragments(__dirname, './files/variations'), auditStructurePath, {
        generatorName: options.generatorName,
        tmpl: '',
    })
    
    logger.info(`✅ Scaffolded audit structure variation at ${auditStructurePath}`)
}
