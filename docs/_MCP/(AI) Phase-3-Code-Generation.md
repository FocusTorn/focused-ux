# FocusedUX MCP Phase 3 - Code Generation Implementation

## **REFERENCE FILES**

### **Documentation References**

- **SOP_DOCS**: `docs/_SOP.md`
- **ARCHITECTURE_DOCS**: `docs/_Architecture.md`
- **PACKAGE_ARCHETYPES**: `docs/_Package-Archetypes.md`
- **AI_PROJECT_ARCH**: `docs/(AI) Project Architecture.md`

### **AI Testing Documentation References**

- **AI_TESTING_BASE**: `docs/testing/(AI) _Strategy- Base- Testing.md`
- **AI_MOCKING_BASE**: `docs/testing/(AI) _Strategy- Base- Mocking.md`
- **AI_TROUBLESHOOTING**: `docs/testing/(AI) _Troubleshooting- Base.md`

### **MCP Documentation References**

- **MCP_PRD**: `docs/_MCP/Product-Request-Document.md`
- **MCP_PHASE1**: `docs/_MCP/(AI) Phase-1-Documentation-Navigation.md`
- **MCP_PHASE2**: `docs/_MCP/(AI) Phase-2-Package-Classification.md`

---

## **CRITICAL EXECUTION DIRECTIVE**

**AI Agent Directive**: Follow this protocol exactly for Phase 3 MCP Code Generation implementation.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO DEVIATION**: All implementation rules must be followed exactly as written
2. **NO SKIPPING**: No steps may be skipped, abbreviated, or modified
3. **NO SELECTIVE COMPLIANCE**: All requirements apply to all MCP implementations
4. **FAILURE TO COMPLY**: Violating these requirements constitutes a critical implementation failure

## **PHASE 3 OVERVIEW**

### **Phase Goals**

- **Generation Engine**: Implement intelligent code generation following architectural patterns
- **Package Structure Creation**: Generate complete package directory structures
- **Test File Generation**: Create test files with proper structure and folding markers
- **Configuration Generation**: Generate project.json and package.json files based on package type
- **Workflow Integration**: Integrate code generation with development workflows

### **Phase Deliverables**

- **Code Generation Engine**: Automated code generation following documented patterns
- **Package Structure Generator**: Complete package directory structure creation
- **Test File Generator**: Test files with proper formatting and folding markers
- **Configuration Generator**: Build and package configuration files
- **Template System**: Flexible template system for code generation
- **Automation Scripts**: Automated package creation and setup workflows

### **Timeline**

- **Weeks 9-10**: Generation Engine Development
- **Weeks 11-12**: Automation & Integration Implementation

## **IMPLEMENTATION REQUIREMENTS**

### **1. :: Code Generation Engine**

#### **Generation System Architecture**

```typescript
// Code Generation Engine
interface GenerationRequest {
    type: 'package' | 'test' | 'config' | 'boilerplate'
    packageType: PackageType
    name: string
    description?: string
    requirements: GenerationRequirement[]
    options: GenerationOptions
    context: GenerationContext
}

interface GenerationRequirement {
    type: 'business-logic' | 'ui-integration' | 'testing' | 'build' | 'utilities'
    description: string
    complexity: 'simple' | 'moderate' | 'complex'
    dependencies?: string[]
}

interface GenerationOptions {
    includeTests: boolean
    includeDocumentation: boolean
    includeExamples: boolean
    templateOverrides?: TemplateOverride[]
    outputFormat: 'files' | 'zip' | 'stream'
}

interface GenerationContext {
    workspaceRoot: string
    targetPath: string
    existingFiles?: string[]
    dependencies?: PackageDependency[]
    configuration?: WorkspaceConfiguration
}

interface GenerationResult {
    success: boolean
    generatedFiles: GeneratedFile[]
    warnings: GenerationWarning[]
    errors: GenerationError[]
    metadata: GenerationMetadata
}

interface GeneratedFile {
    path: string
    content: string
    type: 'source' | 'test' | 'config' | 'documentation'
    template: string
    checksum: string
}
```

#### **Template System Implementation**

```typescript
// Template System
class CodeGenerationEngine {
    private templates: Map<string, Template> = new Map()
    private generators: Map<GenerationType, Generator> = new Map()
    private validators: ValidationRuleSet

    constructor() {
        //>
        this.validators = new ValidationRuleSet()
        this.initializeTemplates()
        this.initializeGenerators()
    } //<

    private initializeTemplates(): void {
        //>
        // Core package templates
        this.addTemplate({
            id: 'core-package-structure',
            name: 'Core Package Structure',
            type: 'package',
            packageTypes: [PackageType.CORE],
            files: [
                {
                    path: 'src/index.ts',
                    template: 'core-index-template',
                    required: true,
                },
                {
                    path: 'src/types.ts',
                    template: 'core-types-template',
                    required: false,
                },
                {
                    path: 'project.json',
                    template: 'core-project-template',
                    required: true,
                },
                {
                    path: 'package.json',
                    template: 'core-package-template',
                    required: true,
                },
            ],
        })

        // Extension package templates
        this.addTemplate({
            id: 'extension-package-structure',
            name: 'Extension Package Structure',
            type: 'package',
            packageTypes: [PackageType.EXTENSION],
            files: [
                {
                    path: 'src/index.ts',
                    template: 'extension-index-template',
                    required: true,
                },
                {
                    path: 'src/adapters/',
                    template: 'extension-adapters-template',
                    required: true,
                },
                {
                    path: 'src/commands/',
                    template: 'extension-commands-template',
                    required: false,
                },
                {
                    path: 'project.json',
                    template: 'extension-project-template',
                    required: true,
                },
            ],
        })

        // Test file templates
        this.addTemplate({
            id: 'test-file-structure',
            name: 'Test File Structure',
            type: 'test',
            packageTypes: [PackageType.CORE, PackageType.EXTENSION, PackageType.SHARED],
            files: [
                {
                    path: 'src/index.test.ts',
                    template: 'test-file-template',
                    required: true,
                },
            ],
        })
    } //<

    async generate(request: GenerationRequest): Promise<GenerationResult> {
        //>
        try {
            // Validate generation request
            const validation = await this.validateRequest(request)
            if (!validation.valid) {
                return {
                    success: false,
                    generatedFiles: [],
                    warnings: [],
                    errors: validation.errors,
                    metadata: { timestamp: new Date(), duration: 0 },
                }
            }

            // Select appropriate generator
            const generator = this.getGenerator(request.type)
            if (!generator) {
                throw new Error(`No generator found for type: ${request.type}`)
            }

            // Generate files
            const startTime = Date.now()
            const generatedFiles = await generator.generate(request)
            const duration = Date.now() - startTime

            // Validate generated files
            const fileValidation = await this.validateGeneratedFiles(generatedFiles, request)

            return {
                success: true,
                generatedFiles,
                warnings: fileValidation.warnings,
                errors: fileValidation.errors,
                metadata: {
                    timestamp: new Date(),
                    duration,
                    template: request.type,
                    packageType: request.packageType,
                },
            }
        } catch (error) {
            return {
                success: false,
                generatedFiles: [],
                warnings: [],
                errors: [
                    {
                        type: 'generation-error',
                        message: error.message,
                        details: error.stack,
                    },
                ],
                metadata: { timestamp: new Date(), duration: 0 },
            }
        }
    } //<

    private async validateGeneratedFiles(
        files: GeneratedFile[],
        request: GenerationRequest
    ): Promise<FileValidationResult> {
        //>
        const warnings: GenerationWarning[] = []
        const errors: GenerationError[] = []

        for (const file of files) {
            // Validate file structure
            if (file.type === 'source' && !this.isValidSourceFile(file)) {
                errors.push({
                    type: 'invalid-source-file',
                    message: `Invalid source file: ${file.path}`,
                    file: file.path,
                })
            }

            // Validate package type compliance
            if (request.packageType === PackageType.CORE && this.hasVSCodeImports(file.content)) {
                errors.push({
                    type: 'architecture-violation',
                    message: `Core package contains VSCode imports: ${file.path}`,
                    file: file.path,
                })
            }

            // Validate test file structure
            if (file.type === 'test' && !this.hasValidTestStructure(file.content)) {
                warnings.push({
                    type: 'test-structure-warning',
                    message: `Test file may not follow proper structure: ${file.path}`,
                    file: file.path,
                })
            }
        }

        return { warnings, errors }
    } //<
}
```

### **2. :: Package Structure Generator**

#### **Package Structure Creation**

```typescript
// Package Structure Generator
class PackageStructureGenerator implements Generator {
    private templateEngine: TemplateEngine
    private fileSystem: FileSystemOperations

    constructor(templateEngine: TemplateEngine, fileSystem: FileSystemOperations) {
        //>
        this.templateEngine = templateEngine
        this.fileSystem = fileSystem
    } //<

    async generate(request: GenerationRequest): Promise<GeneratedFile[]> {
        //>
        const files: GeneratedFile[] = []
        const template = this.getTemplate(request.packageType)

        // Generate directory structure
        await this.createDirectoryStructure(request.context.targetPath, template)

        // Generate files
        for (const fileTemplate of template.files) {
            const filePath = path.join(request.context.targetPath, fileTemplate.path)
            const content = await this.generateFileContent(fileTemplate, request)

            files.push({
                path: filePath,
                content,
                type: this.determineFileType(fileTemplate.path),
                template: fileTemplate.template,
                checksum: this.calculateChecksum(content),
            })
        }

        return files
    } //<

    private async generateFileContent(
        fileTemplate: FileTemplate,
        request: GenerationRequest
    ): Promise<string> {
        //>
        const templateContent = await this.templateEngine.getTemplate(fileTemplate.template)

        const context = {
            packageName: request.name,
            packageDescription: request.description || '',
            packageType: request.packageType,
            workspaceRoot: request.context.workspaceRoot,
            targetPath: request.context.targetPath,
            requirements: request.requirements,
            options: request.options,
            timestamp: new Date().toISOString(),
            version: '1.0.0',
        }

        return await this.templateEngine.render(templateContent, context)
    } //<

    private async createDirectoryStructure(
        targetPath: string,
        template: PackageTemplate
    ): Promise<void> {
        //>
        const directories = new Set<string>()

        // Extract directories from file paths
        for (const fileTemplate of template.files) {
            const dir = path.dirname(fileTemplate.path)
            if (dir !== '.') {
                directories.add(dir)
            }
        }

        // Create directories
        for (const dir of directories) {
            const fullPath = path.join(targetPath, dir)
            await this.fileSystem.ensureDirectory(fullPath)
        }
    } //<

    private getTemplate(packageType: PackageType): PackageTemplate {
        //>
        switch (packageType) {
            case PackageType.CORE:
                return this.getCorePackageTemplate()
            case PackageType.EXTENSION:
                return this.getExtensionPackageTemplate()
            case PackageType.SHARED:
                return this.getSharedPackageTemplate()
            case PackageType.TOOL:
                return this.getToolPackageTemplate()
            case PackageType.PLUGIN:
                return this.getPluginPackageTemplate()
            default:
                throw new Error(`Unknown package type: ${packageType}`)
        }
    } //<

    private getCorePackageTemplate(): PackageTemplate {
        //>
        return {
            id: 'core-package-template',
            packageType: PackageType.CORE,
            files: [
                {
                    path: 'src/index.ts',
                    template: 'core-index-template',
                    required: true,
                },
                {
                    path: 'src/types.ts',
                    template: 'core-types-template',
                    required: false,
                },
                {
                    path: 'project.json',
                    template: 'core-project-template',
                    required: true,
                },
                {
                    path: 'package.json',
                    template: 'core-package-template',
                    required: true,
                },
                {
                    path: 'tsconfig.json',
                    template: 'tsconfig-template',
                    required: true,
                },
            ],
        }
    } //<

    private getExtensionPackageTemplate(): PackageTemplate {
        //>
        return {
            id: 'extension-package-template',
            packageType: PackageType.EXTENSION,
            files: [
                {
                    path: 'src/index.ts',
                    template: 'extension-index-template',
                    required: true,
                },
                {
                    path: 'src/adapters/index.ts',
                    template: 'extension-adapters-template',
                    required: true,
                },
                {
                    path: 'src/commands/index.ts',
                    template: 'extension-commands-template',
                    required: false,
                },
                {
                    path: 'src/configuration.ts',
                    template: 'extension-configuration-template',
                    required: false,
                },
                {
                    path: 'project.json',
                    template: 'extension-project-template',
                    required: true,
                },
                {
                    path: 'package.json',
                    template: 'extension-package-template',
                    required: true,
                },
            ],
        }
    } //<
}
```

### **3. :: Test File Generator**

#### **Test File Generation with Folding Markers**

```typescript
// Test File Generator
class TestFileGenerator implements Generator {
    private templateEngine: TemplateEngine
    private foldingMarkerGenerator: FoldingMarkerGenerator

    constructor(templateEngine: TemplateEngine) {
        //>
        this.templateEngine = templateEngine
        this.foldingMarkerGenerator = new FoldingMarkerGenerator()
    } //<

    async generate(request: GenerationRequest): Promise<GeneratedFile[]> {
        //>
        const files: GeneratedFile[] = []

        if (!request.options.includeTests) {
            return files
        }

        // Generate test files for each source file
        const sourceFiles = await this.findSourceFiles(request.context.targetPath)

        for (const sourceFile of sourceFiles) {
            const testFile = await this.generateTestFile(sourceFile, request)
            files.push(testFile)
        }

        return files
    } //<

    private async generateTestFile(
        sourceFile: SourceFile,
        request: GenerationRequest
    ): Promise<GeneratedFile> {
        //>
        const testFilePath = this.getTestFilePath(sourceFile.path)
        const template = this.getTestTemplate(request.packageType)

        const context = {
            sourceFileName: path.basename(sourceFile.path, '.ts'),
            sourceFilePath: sourceFile.path,
            packageName: request.name,
            packageType: request.packageType,
            exports: sourceFile.exports,
            imports: sourceFile.imports,
            describeName: this.generateDescribeName(sourceFile),
            setupSeparator: this.foldingMarkerGenerator.generateSetupSeparator(sourceFile),
        }

        const content = await this.templateEngine.render(template, context)

        return {
            path: testFilePath,
            content,
            type: 'test',
            template: 'test-file-template',
            checksum: this.calculateChecksum(content),
        }
    } //<

    private getTestTemplate(packageType: PackageType): string {
        //>
        switch (packageType) {
            case PackageType.CORE:
                return this.getCoreTestTemplate()
            case PackageType.EXTENSION:
                return this.getExtensionTestTemplate()
            case PackageType.SHARED:
                return this.getSharedTestTemplate()
            default:
                return this.getDefaultTestTemplate()
        }
    } //<

    private getCoreTestTemplate(): string {
        //>
        return `import { describe, it, expect, afterEach, beforeEach } from 'vitest'

describe('[Top Level Describe]', () => {
    {{setupSeparator}}
    
    // let [exampleManager]: [exampleManagerType]
    // let [exampleManager2]: [exampleManager2Type]
    
    beforeEach(() => { //>
        
    }) //<
    
    afterEach(() => { //>
        
    }) //<
    
    //----<<
    
    describe('[Nested Describe]', () => {

        it('[Test description]', () => { //>
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
        it('[Another Test description]', () => { //>
            
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
        it('[Another Test description]', () => { //>
            
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
    
    })

    describe('[Second Nested Describe]', () => {

        it('[Test description]', () => { //>
            
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
        it('[Another Test description]', () => { //>
            
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
        it('[Another Test description]', () => { //>
            
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
    
    })

})`
    } //<

    private getExtensionTestTemplate(): string {
        //>
        return `import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { mockVSCodeAPI } from '@fux/mock-strategy'

describe('[Top Level Describe]', () => {
    {{setupSeparator}}
    
    // let [exampleManager]: [exampleManagerType]
    // let [exampleManager2]: [exampleManager2Type]
    
    beforeEach(() => { //>
        mockVSCodeAPI()
    }) //<
    
    afterEach(() => { //>
        
    }) //<
    
    //----<<
    
    describe('[Nested Describe]', () => {

        it('[Test description]', () => { //>
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
        it('[Another Test description]', () => { //>
            
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
        it('[Another Test description]', () => { //>
            
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
    
    })

    describe('[Second Nested Describe]', () => {

        it('[Test description]', () => { //>
            
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
        it('[Another Test description]', () => { //>
            
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
        it('[Another Test description]', () => { //>
            
            [Test Contents]
            [Test Contents]
            [Test Contents]
            [Test Contents]
            
        }) //<
    
    })

})`
    } //<
}
```

### **4. :: Configuration Generator**

#### **Build and Package Configuration Generation**

```typescript
// Configuration Generator
class ConfigurationGenerator implements Generator {
    private templateEngine: TemplateEngine
    private workspaceAnalyzer: WorkspaceAnalyzer

    constructor(templateEngine: TemplateEngine, workspaceAnalyzer: WorkspaceAnalyzer) {
        //>
        this.templateEngine = templateEngine
        this.workspaceAnalyzer = workspaceAnalyzer
    } //<

    async generate(request: GenerationRequest): Promise<GeneratedFile[]> {
        //>
        const files: GeneratedFile[] = []

        // Generate project.json
        const projectConfig = await this.generateProjectConfig(request)
        files.push(projectConfig)

        // Generate package.json
        const packageConfig = await this.generatePackageConfig(request)
        files.push(packageConfig)

        // Generate tsconfig.json if needed
        if (this.needsTypeScriptConfig(request)) {
            const tsConfig = await this.generateTypeScriptConfig(request)
            files.push(tsConfig)
        }

        return files
    } //<

    private async generateProjectConfig(request: GenerationRequest): Promise<GeneratedFile> {
        //>
        const template = this.getProjectTemplate(request.packageType)
        const workspaceConfig = await this.workspaceAnalyzer.getWorkspaceConfiguration()

        const context = {
            packageName: request.name,
            packageType: request.packageType,
            workspaceRoot: request.context.workspaceRoot,
            dependencies: request.context.dependencies || [],
            buildTarget: this.getBuildTarget(request.packageType),
            testTarget: this.getTestTarget(request.packageType),
            workspaceConfig,
        }

        const content = await this.templateEngine.render(template, context)

        return {
            path: path.join(request.context.targetPath, 'project.json'),
            content,
            type: 'config',
            template: 'project-template',
            checksum: this.calculateChecksum(content),
        }
    } //<

    private getProjectTemplate(packageType: PackageType): string {
        //>
        switch (packageType) {
            case PackageType.CORE:
                return `{
  "name": "{{packageName}}",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "{{packageName}}/src",
  "projectType": "library",
  "tags": ["type:core", "scope:{{packageName}}"],
  "targets": {
    "build": {
      "executor": "{{buildTarget}}",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/{{packageName}}",
        "main": "{{packageName}}/src/index.ts",
        "tsConfig": "{{packageName}}/tsconfig.lib.json",
        "assets": ["{{packageName}}/*.md"],
        "format": ["esm"],
        "bundle": false,
        "external": ["vscode"]
      }
    },
    "test": {
      "executor": "{{testTarget}}",
      "outputs": ["{options.coverageDirectory}"],
      "options": {
        "passWithNoTests": true,
        "coverageDirectory": "coverage/{{packageName}}"
      }
    }
  }
}`

            case PackageType.EXTENSION:
                return `{
  "name": "{{packageName}}",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "{{packageName}}/src",
  "projectType": "library",
  "tags": ["type:ext", "scope:{{packageName}}"],
  "targets": {
    "build": {
      "executor": "{{buildTarget}}",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/{{packageName}}",
        "main": "{{packageName}}/src/index.ts",
        "tsConfig": "{{packageName}}/tsconfig.lib.json",
        "assets": ["{{packageName}}/*.md"],
        "format": ["cjs"],
        "bundle": true,
        "external": []
      }
    },
    "test": {
      "executor": "{{testTarget}}",
      "outputs": ["{options.coverageDirectory}"],
      "options": {
        "passWithNoTests": true,
        "coverageDirectory": "coverage/{{packageName}}"
      }
    }
  }
}`

            default:
                return this.getDefaultProjectTemplate()
        }
    } //<

    private async generatePackageConfig(request: GenerationRequest): Promise<GeneratedFile> {
        //>
        const template = this.getPackageTemplate(request.packageType)

        const context = {
            packageName: request.name,
            packageDescription: request.description || '',
            packageType: request.packageType,
            version: '1.0.0',
            dependencies: this.getPackageDependencies(request),
            devDependencies: this.getDevDependencies(request.packageType),
        }

        const content = await this.templateEngine.render(template, context)

        return {
            path: path.join(request.context.targetPath, 'package.json'),
            content,
            type: 'config',
            template: 'package-template',
            checksum: this.calculateChecksum(content),
        }
    } //<

    private getPackageTemplate(packageType: PackageType): string {
        //>
        return `{
  "name": "@fux/{{packageName}}",
  "version": "{{version}}",
  "description": "{{packageDescription}}",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "nx build {{packageName}}",
    "test": "nx test {{packageName}}",
    "lint": "nx lint {{packageName}}"
  },
  "keywords": ["focusedux", "{{packageType}}"],
  "author": "FocusedUX Team",
  "license": "MIT",
  "dependencies": {
    {{#each dependencies}}
    "{{name}}": "{{version}}"{{#unless @last}},{{/unless}}
    {{/each}}
  },
  "devDependencies": {
    {{#each devDependencies}}
    "{{name}}": "{{version}}"{{#unless @last}},{{/unless}}
    {{/each}}
  },
  "peerDependencies": {
    {{#if isExtension}}
    "vscode": "^1.74.0"{{/if}}
  }
}`
    } //<
}
```

## **PATTERNS & EXAMPLES**

### **1. :: Complete Code Generation Workflow**

```typescript
// Complete Code Generation Service
class CodeGenerationService {
    private engine: CodeGenerationEngine
    private structureGenerator: PackageStructureGenerator
    private testGenerator: TestFileGenerator
    private configGenerator: ConfigurationGenerator
    private fileSystem: FileSystemOperations

    constructor() {
        //>
        const templateEngine = new TemplateEngine()
        const fileSystem = new FileSystemOperations()
        const workspaceAnalyzer = new WorkspaceAnalyzer()

        this.engine = new CodeGenerationEngine()
        this.structureGenerator = new PackageStructureGenerator(templateEngine, fileSystem)
        this.testGenerator = new TestFileGenerator(templateEngine)
        this.configGenerator = new ConfigurationGenerator(templateEngine, workspaceAnalyzer)
        this.fileSystem = fileSystem
    } //<

    async generatePackage(request: PackageGenerationRequest): Promise<PackageGenerationResult> {
        //>
        try {
            // Step 1: Validate request
            const validation = await this.validatePackageRequest(request)
            if (!validation.valid) {
                return {
                    success: false,
                    errors: validation.errors,
                    warnings: validation.warnings,
                }
            }

            // Step 2: Generate package structure
            const structureRequest: GenerationRequest = {
                type: 'package',
                packageType: request.packageType,
                name: request.name,
                description: request.description,
                requirements: request.requirements,
                options: request.options,
                context: request.context,
            }

            const structureFiles = await this.structureGenerator.generate(structureRequest)

            // Step 3: Generate test files
            const testFiles = await this.testGenerator.generate(structureRequest)

            // Step 4: Generate configuration files
            const configFiles = await this.configGenerator.generate(structureRequest)

            // Step 5: Write files to filesystem
            const allFiles = [...structureFiles, ...testFiles, ...configFiles]
            await this.writeFiles(allFiles, request.context.targetPath)

            // Step 6: Validate generated package
            const packageValidation = await this.validateGeneratedPackage(
                request.context.targetPath,
                request.packageType
            )

            return {
                success: true,
                generatedFiles: allFiles,
                warnings: packageValidation.warnings,
                errors: packageValidation.errors,
                metadata: {
                    packageType: request.packageType,
                    fileCount: allFiles.length,
                    timestamp: new Date(),
                },
            }
        } catch (error) {
            return {
                success: false,
                errors: [
                    {
                        type: 'generation-error',
                        message: error.message,
                        details: error.stack,
                    },
                ],
                warnings: [],
            }
        }
    } //<

    private async writeFiles(files: GeneratedFile[], targetPath: string): Promise<void> {
        //>
        for (const file of files) {
            const fullPath = path.join(targetPath, file.path)
            await this.fileSystem.writeFile(fullPath, file.content)
        }
    } //<

    private async validateGeneratedPackage(
        packagePath: string,
        packageType: PackageType
    ): Promise<PackageValidationResult> {
        //>
        const warnings: string[] = []
        const errors: string[] = []

        // Validate package structure
        const structureValidation = await this.validatePackageStructure(packagePath, packageType)
        errors.push(...structureValidation.errors)
        warnings.push(...structureValidation.warnings)

        // Validate build configuration
        const buildValidation = await this.validateBuildConfiguration(packagePath, packageType)
        errors.push(...buildValidation.errors)
        warnings.push(...buildValidation.warnings)

        // Validate test files
        const testValidation = await this.validateTestFiles(packagePath)
        warnings.push(...testValidation.warnings)

        return { warnings, errors }
    } //<
}
```

### **2. :: Template Engine Implementation**

```typescript
// Template Engine
class TemplateEngine {
  private templates: Map<string, string> = new Map()
  private helpers: Map<string, TemplateHelper> = new Map()

  constructor() { //>
    this.initializeHelpers()
    this.loadTemplates()
  } //<

  async render(template: string, context: any): Promise<string> { //>
    // Simple template engine implementation
    let rendered = template

    // Replace variables
    rendered = rendered.replace(/\{\{([^}]+)\}\}/g, (match, key) => { //>
      const value = this.getNestedValue(context, key.trim())
      return value !== undefined ? String(value) : match
    }) //<

    // Handle conditionals
    rendered = this.processConditionals(rendered, context)

    // Handle loops
    rendered = this.processLoops(rendered, context)

    return rendered
  } //<

  private getNestedValue(obj: any, path: string): any { //>
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  } //<

  private processConditionals(template: string, context: any): string { //>
    return template.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => { //>
      const conditionValue = this.getNestedValue(context, condition.trim())
      return conditionValue ? content : ''
    }) //<
  } //<

  private processLoops(template: string, context: any): string { //>
    return template.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayPath, content) => { //>
      const array = this.getNestedValue(context, arrayPath.trim())
      if (!Array.isArray(array)) {
        return ''
      }

      return array.map((item, index) => { //>
        const itemContext = { ...context, ...item, @index: index, @last: index === array.length - 1 }
        return this.render(content, itemContext)
      }).join('')
    }) //<
  } //<

  async getTemplate(templateId: string): Promise<string> { //>
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`Template not found: ${templateId}`)
    }
    return template
  } //<
}
```

## **ANTI-PATTERNS**

### **❌ Code Generation Anti-Patterns**

- ❌ **Hardcoded Templates** - Templates must be configurable and data-driven
- ❌ **Incomplete Generation** - All required files must be generated for each package type
- ❌ **Missing Validation** - Generated code must be validated against architectural rules
- ❌ **No Customization** - Generation must support customization and overrides
- ❌ **Synchronous Operations** - All generation operations must be asynchronous

### **❌ Template System Anti-Patterns**

- ❌ **Template Fragments** - Templates must be complete and self-contained
- ❌ **Missing Context** - Templates must have access to all necessary context data
- ❌ **No Error Handling** - Template rendering must handle errors gracefully
- ❌ **Hardcoded Values** - Templates must use dynamic values, not hardcoded strings
- ❌ **No Validation** - Template output must be validated before use

### **❌ Test Generation Anti-Patterns**

- ❌ **Missing Folding Markers** - Test files must include proper folding markers
- ❌ **Incomplete Structure** - Test files must follow documented test structure patterns
- ❌ **No Package-Specific Logic** - Test generation must consider package type differences
- ❌ **Missing Imports** - Test files must include all necessary imports
- ❌ **No Mock Strategy** - Test files must use appropriate mock strategies

### **❌ Configuration Generation Anti-Patterns**

- ❌ **Incorrect Build Targets** - Configuration must use correct build targets for package type
- ❌ **Missing Dependencies** - Package dependencies must be correctly specified
- ❌ **Wrong Module Format** - Build configuration must use correct module format (ESM/CJS)
- ❌ **Missing Externalization** - VSCode and Node.js APIs must be externalized appropriately
- ❌ **No Workspace Integration** - Configuration must integrate with workspace settings

## **QUALITY GATES**

### **Quality Gates Checklist**

- [ ] **Code Generation Engine**: Generates code following all architectural patterns
- [ ] **Package Structure Generator**: Creates complete package directory structures
- [ ] **Test File Generator**: Creates test files with proper structure and folding markers
- [ ] **Configuration Generator**: Generates correct build and package configurations
- [ ] **Template System**: Flexible and configurable template system
- [ ] **Validation**: Generated code validates against architectural rules
- [ ] **Performance**: Generation completes within acceptable time limits
- [ ] **Testing**: Unit and integration tests for all generation components

### **Quality Gates**

- [ ] All package types generate correct file structures
- [ ] Test files follow documented formatting rules
- [ ] Build configurations use correct targets and options
- [ ] Generated code passes architectural validation
- [ ] Templates support customization and overrides
- [ ] Error scenarios properly handled and reported
- [ ] Performance requirements met for large packages

## **SUCCESS METRICS**

After implementing Phase 3 Code Generation:

- ✅ **100% Pattern Compliance** - Generated code follows all architectural patterns
- ✅ **Complete Package Generation** - All required files generated for each package type
- ✅ **Proper Test Structure** - Test files include folding markers and correct structure
- ✅ **Correct Configuration** - Build and package configurations are accurate
- ✅ **Fast Generation** - Package generation completes within 5 seconds
- ✅ **Zero Manual Setup** - No manual configuration required after generation

## **PHASE 3 VIOLATION PREVENTION**

### **Natural Stops**

- **MANDATORY**: Hardcoded templates → "Use configurable, data-driven templates"
- **MANDATORY**: Missing validation → "Validate generated code against architectural rules"
- **MANDATORY**: Incomplete generation → "Generate all required files for package type"
- **MANDATORY**: Missing folding markers → "Include proper folding markers in test files"
- **MANDATORY**: Incorrect configuration → "Use correct build targets and module formats"

### **Pattern Recognition**

- Code generation → Determines template system effectiveness
- Package structure → Determines completeness and correctness
- Test generation → Determines formatting compliance
- Configuration generation → Determines build system integration
- Template rendering → Determines flexibility and customization

## **EXECUTION PRIORITY MATRIX**

### **CRITICAL PRIORITY (Execute immediately)**

- Code generation engine implementation
- Template system development
- Package structure generator setup
- Configuration generator implementation

### **HIGH PRIORITY (Execute before proceeding)**

- Test file generator with folding markers
- Validation system implementation
- File system operations
- Error handling implementation

### **MEDIUM PRIORITY (Execute during normal operation)**

- Template customization features
- Performance optimization
- Integration testing
- Generated code validation

### **LOW PRIORITY (Execute when time permits)**

- Advanced template features
- Metrics collection
- Documentation generation
- Workflow automation

## **DYNAMIC MANAGEMENT NOTE**

This Phase 3 implementation document is optimized for AI agent internal processing and may be updated dynamically based on implementation progress, generation quality metrics, and user feedback. The structure prioritizes AI agent effectiveness and architectural compliance over traditional development practices.

