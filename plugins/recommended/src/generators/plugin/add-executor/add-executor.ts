import { Tree, logger, formatFiles, generateFiles, joinPathFragments, updateJson, runTasksInSerial } from '@nx/devkit'
import { executorGenerator } from '@nx/plugin/src/generators/executor/executor'
import { PluginAddExecutorSchema } from './schema'
import { existsSync } from 'fs'
import { join } from 'path'

export default async function addExecutorGenerator(tree: Tree, options: PluginAddExecutorSchema) {
    const pluginPath = join(options.directory || './plugins', options.pluginName)
    const executorPath = join(pluginPath, 'src', 'executors', options.executorName)
    
    // Check if plugin exists
    if (!existsSync(pluginPath)) {
        logger.error(`Plugin '${options.pluginName}' does not exist at ${pluginPath}`)
        logger.info('Please create the plugin first or check the plugin name.')
        return
    }
    
    // Check if executor already exists
    if (existsSync(executorPath)) {
        logger.error(`Executor '${options.executorName}' already exists in plugin '${options.pluginName}'`)
        logger.info('Please choose a different executor name.')
        return
    }
    
    logger.info(`Adding executor '${options.executorName}' to plugin '${options.pluginName}'`)
    
    const tasks = []
    
    // Generate the executor using Nx's executor generator
    await executorGenerator(tree, {
        path: `plugins/${options.pluginName}/src/executors/${options.executorName}`,
        name: options.executorName,
        description: `${options.executorName} executor`,
        unitTestRunner: 'none',
        includeHasher: false,
        skipFormat: true,
    })
    
    // Update plugin configuration to match vpack structure
    updatePluginConfiguration(tree, options, pluginPath)
    
    // Update tsconfig to match vpack structure
    updateTsConfig(tree, options, pluginPath)
    
    // Update executors.json if needed
    updateExecutorsJson(tree, options, pluginPath)
    
    // Scaffold variations if requested
    if (options.scaffoldVariations) {
        scaffoldVariations(tree, options, executorPath)
    }
    
    await formatFiles(tree)
    return runTasksInSerial(...tasks)
}

function updatePluginConfiguration(tree: Tree, options: PluginAddExecutorSchema, pluginPath: string) {
    const projectJsonPath = join(pluginPath, 'project.json')
    
    if (!tree.exists(projectJsonPath)) {
        logger.warn(`project.json not found at ${projectJsonPath}`)
        return
    }
    
    updateJson(tree, projectJsonPath, (json) => {
        // Update to match vpack structure
        json.name = `@fux/${options.pluginName}`
        json.tags = ['executor']
        
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

function updateTsConfig(tree: Tree, options: PluginAddExecutorSchema, pluginPath: string) {
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

function updateExecutorsJson(tree: Tree, options: PluginAddExecutorSchema, pluginPath: string) {
    const executorsJsonPath = join(pluginPath, 'executors.json')
    
    if (!tree.exists(executorsJsonPath)) {
        logger.warn(`executors.json not found at ${executorsJsonPath}`)
        return
    }
    
    updateJson(tree, executorsJsonPath, (json) => {
        if (!json.executors) {
            json.executors = {}
        }
        
        // Add the new executor
        json.executors[options.executorName] = {
            implementation: `./src/executors/${options.executorName}/${options.executorName}.ts`,
            schema: `./src/executors/${options.executorName}/schema.json`
        }
        
        return json
    })
}

function scaffoldVariations(tree: Tree, options: PluginAddExecutorSchema, executorPath: string) {
    logger.info(`Scaffolding variations for executor '${options.executorName}'`)
    
    // Create variations directory
    const variationsPath = join(executorPath, 'variations')
    
    // Create audit structure variation
    const auditStructurePath = join(variationsPath, 'audit-structure')
    
    generateFiles(tree, joinPathFragments(__dirname, './files/variations'), auditStructurePath, {
        executorName: options.executorName,
        tmpl: '',
    })
    
    logger.info(`✅ Scaffolded audit structure variation at ${auditStructurePath}`)
}
