# FocusedUX Plugins Guidelines

## Plugin Types Overview

Nx plugins can contain different types of functionality. See the detailed guides:

- **[Plugin Executors](./plugins/plugin-executor.md)** - Task execution (build, test, lint, deploy)
- **[Plugin Generators](./plugins/plugin-generator.md)** - Code generation and project creation
- **[Plugin Applications](./plugins/plugin-application.md)** - Standalone applications and services

## Plugin Generation Best Practices

### **Generator Usage**

- **DO NOT use the generator UI** - Running the command directly allows the AI agent to see any issues with the generation
- **DO NOT use the generator for linting or testing** - There are global targets that will be added to the plugin's project.json after the fact
- **Use standalone project.json** - Have the generation use a standalone project.json file instead of a nested nx object within the package.json

### **Quick Reference Commands**

#### Generate New Plugin

```bash
npx nx g @nx/plugin:plugin plugins/{plugin-name} \
  --directory=plugins \
  --importPath=@fux/{plugin-name} \
  --linter=none \
  --unitTestRunner=none \
  --useProjectJson=true \
  --tags={relevant-tags}
```

#### Generate Executor in Plugin

```bash
npx nx generate @nx/plugin:executor plugins/{plugin-name}/src/executors/{executor-name}
```

#### Generate Generator in Plugin

```bash
npx nx generate @nx/plugin:generator plugins/{plugin-name}/src/generators/{generator-name}
```

#### Generate Application Plugin

```bash
npx nx g @nx/plugin:plugin plugins/{application-name} \
  --directory=plugins \
  --importPath=@fux/{application-name} \
  --linter=none \
  --unitTestRunner=none \
  --useProjectJson=true \
  --tags=application,{relevant-tags}
```

### **Recommended Generator Command Pattern**

```bash
npx nx g @nx/plugin:plugin {plugin-name} \
  --directory=plugins \
  --importPath=@fux/{plugin-name} \
  --linter=none \
  --unitTestRunner=none \
  --useProjectJson=true \
  --tags={relevant-tags}
```

### **Post-Generation Setup**

After generation, the following will be added automatically:

1. **Global Linting Configuration** - ESLint rules from workspace configuration
2. **Global Testing Configuration** - Vitest configuration from workspace setup
3. **Build Configuration** - ESBuild configuration following workspace patterns
4. **Dependency Management** - Proper dependency externalization

### **Plugin Architecture Patterns**

- **Follow Package Archetypes** - See [Package Archetypes](./_Package-Archetypes.md) for classification
- **Use Core/Ext Pattern** - For VSCode extensions, separate business logic from VSCode integration
- **Self-Contained Packages** - Each plugin should be independently testable and buildable
- **Documentation Integration** - Plugins should integrate with the MCP documentation system

### **Plugin Development Workflow**

1. **Generate Plugin** - Use CLI command with minimal configuration
2. **Add Global Targets** - Linting, testing, and build configurations
3. **Implement Functionality** - Follow architectural patterns
4. **Test Integration** - Ensure proper integration with workspace
5. **Document Usage** - Add to plugin documentation

### **Plugin Type Selection**

Choose the appropriate plugin type based on functionality:

- **Executors** - For build, test, lint, deploy, or other task execution
- **Generators** - For creating new files, projects, or modifying existing code
- **Applications** - For standalone services, servers, or external integrations

### **Integration Points**

- **Workspace Configuration** - Integrate with nx.json and global settings
- **Documentation System** - Connect with MCP documentation server
- **Package Management** - Follow workspace dependency patterns
- **Build Pipeline** - Integrate with global build targets
