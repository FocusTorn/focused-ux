# Analysis Framework Workspace - Complete Workspace Analysis

## **DOCUMENT PURPOSE**

**Primary Consumer**: AI Agent performing workspace-level analysis
**Objective**: Systematic workspace analysis and health assessment
**Scope**: Complete monorepo understanding, project graph analysis, and workspace health

## **CRITICAL CONTEXT**

### **PROBLEM STATEMENT**

- **Issue**: Workspace-level issues affect all packages and operations
- **Risk**: Missing workspace problems leads to cascading failures
- **Impact**: Build failures, dependency issues, configuration problems

### **SOLUTION APPROACH**

**REFERENCE DOCUMENTS:**

- **Primary**: `docs/Analysis-Framework-Base.md` - Shared validation patterns and criteria
- **Secondary**: `docs/Architecture.md` - Overall architecture context
- **Tertiary**: `docs/Package-Specific-Details.md` - Package pattern reference

**WORKSPACE ANALYSIS GOALS:**

- **Complete Understanding**: All packages and their relationships
- **Health Assessment**: Identify configuration and dependency issues
- **Dependency Mapping**: Clear picture of package interactions
- **Architecture Validation**: Ensure workspace follows established patterns

## **SYSTEMATIC WORKSPACE ANALYSIS PROCESS**

### **STEP 1: WORKSPACE CONTEXT AWARENESS**

**VALIDATION STEP 1.1: Workspace Overview**

- **Input Command**: `nx_workspace`
- **Output**: Complete workspace project graph and configuration
- **Process**: Understand overall workspace architecture and package relationships

**CRITICAL CHECKLIST:**

- [ ] **Project Graph**: All packages and their dependencies identified
- [ ] **Configuration**: Nx configuration and target defaults understood
- [ ] **Errors**: Any project graph errors or configuration issues detected
- [ ] **Dependency Chain**: Build order and dependency relationships mapped
- [ ] **Package Types**: Core, extension, shared, and tool packages identified

**VALIDATION CRITERIA:**
✅ **Complete Graph**: All packages visible in project graph
✅ **No Errors**: No project graph or configuration errors
✅ **Dependency Clarity**: Clear understanding of package relationships
✅ **Architecture Alignment**: Package types match expected patterns

**VALIDATION STEP 1.2: Package Discovery and Classification**

- **Input Command**: `nx_workspace` with package type filters
- **Process**: Identify and classify all packages by type and role
- **Output**: Complete package inventory with classifications

**PACKAGE DISCOVERY PROCESS:**

1. **Core Packages**: `packages/{feature}/core/` - Business logic packages
2. **Extension Packages**: `packages/{feature}/ext/` - VSCode integration packages
3. **Shared Packages**: `libs/shared/` - Utility packages for other packages
4. **Tool Packages**: `libs/tools/{tool-name}/` - Standalone utility packages

**VALIDATION CRITERIA:**
✅ **Complete Inventory**: All packages discovered and classified
✅ **Type Accuracy**: Package types match location patterns
✅ **Dependency Mapping**: All package dependencies identified
✅ **Relationship Understanding**: Clear picture of package interactions

**VALIDATION STEP 1.3: Workspace Health Assessment**

- **Input**: Workspace configuration and project graph
- **Process**: Assess overall workspace health and identify potential issues
- **Output**: Workspace health status and any concerns

**HEALTH ASSESSMENT CRITERIA:**
✅ **Configuration Valid**: No configuration errors or warnings
✅ **Dependency Integrity**: All dependencies properly resolved
✅ **Build Order Valid**: No circular dependencies or build issues
✅ **Package Consistency**: Packages follow established patterns

**VALIDATION STEP 1.4: Additional Context Tools (Optional)**

- **Input**: Specific context needs for the analysis
- **Process**: Use additional nx-mcp tools for enhanced context awareness
- **Output**: Enhanced understanding of workspace and package context

**CONTEXT ENHANCEMENT TOOLS:**

- **`nx_workspace_path`**: Get workspace root path for file operations
- **`nx_generators`**: Discover available generators for package creation/modification
- **`nx_generator_schema`**: Get detailed schema for specific generators
- **`nx_docs`**: Access Nx documentation for specific topics or configurations

**USAGE SCENARIOS:**

- **Path Context**: Use `nx_workspace_path` when working with file paths
- **Generator Context**: Use `nx_generators` when creating new packages or components
- **Schema Context**: Use `nx_generator_schema` when configuring generators
- **Documentation Context**: Use `nx_docs` when needing Nx-specific guidance

### **STEP 2: DEPENDENCY ANALYSIS**

**VALIDATION STEP 2.1: Dependency Chain Mapping**

- **Input**: Project graph from `nx_workspace`
- **Process**: Map all package dependencies and build order
- **Output**: Complete dependency chain with build order

**DEPENDENCY ANALYSIS CRITERIA:**
✅ **Complete Mapping**: All dependencies identified and mapped
✅ **Build Order Valid**: No circular dependencies detected
✅ **Dependency Types**: Distinguish between build and runtime dependencies
✅ **Shared Package Usage**: Identify all consumers of shared packages

**VALIDATION STEP 2.2: Circular Dependency Detection**

- **Input**: Dependency graph from workspace analysis
- **Process**: Identify any circular dependencies or build issues
- **Output**: List of circular dependencies or build problems

**CIRCULAR DEPENDENCY CRITERIA:**
✅ **No Circular Dependencies**: All dependencies form a valid DAG
✅ **Build Order Valid**: Packages can be built in dependency order
✅ **No Self-References**: No package depends on itself
✅ **Valid Import Patterns**: All imports follow architectural patterns

**VALIDATION STEP 2.3: Shared Package Impact Analysis**

- **Input**: Shared package dependencies and consumers
- **Process**: Analyze impact of shared package changes
- **Output**: Impact assessment for shared package modifications

**SHARED PACKAGE CRITERIA:**
✅ **Consumer Identification**: All consumers of shared packages identified
✅ **Impact Assessment**: Changes to shared packages affect all consumers
✅ **Version Compatibility**: Shared package versions are compatible
✅ **Breaking Change Analysis**: Potential breaking changes identified

### **STEP 3: CONFIGURATION VALIDATION**

**VALIDATION STEP 3.1: Nx Configuration Analysis**

- **Input**: nx.json configuration and target defaults
- **Process**: Validate Nx configuration against best practices
- **Output**: Configuration validation results

**CONFIGURATION VALIDATION CRITERIA:**
✅ **Target Defaults Valid**: All target defaults properly configured
✅ **Cache Configuration**: Caching properly configured for all targets
✅ **Input/Output Mapping**: Input and output files properly mapped
✅ **Dependency Configuration**: Build dependencies properly configured

**VALIDATION STEP 3.2: Package Manager Configuration**

- **Input**: pnpm-workspace.yaml and package.json configurations
- **Process**: Validate package manager configuration
- **Output**: Package manager configuration validation

**PACKAGE MANAGER CRITERIA:**
✅ **Workspace Configuration**: pnpm workspace properly configured
✅ **Package.json Valid**: All package.json files are valid
✅ **Dependency Resolution**: Dependencies resolve correctly
✅ **Version Consistency**: Package versions are consistent

**VALIDATION STEP 3.3: Build Tool Configuration**

- **Input**: Build tool configurations (esbuild, vite, etc.)
- **Process**: Validate build tool configurations
- **Output**: Build tool configuration validation

**BUILD TOOL CRITERIA:**
✅ **Esbuild Configuration**: Esbuild properly configured for all packages
✅ **Vite Configuration**: Vite properly configured for testing
✅ **TypeScript Configuration**: TypeScript properly configured
✅ **External Dependencies**: Dependencies properly externalized

### **STEP 4: ARCHITECTURE VALIDATION**

**VALIDATION STEP 4.1: Package Type Validation**

- **Input**: Package locations and configurations
- **Process**: Validate package types match location patterns
- **Output**: Package type validation results

**PACKAGE TYPE VALIDATION CRITERIA:**
✅ **Location Patterns**: Package locations follow established patterns
✅ **Type Consistency**: Package types match their architectural role
✅ **Dependency Patterns**: Dependencies match package type requirements
✅ **Build Configuration**: Build configuration matches package type

**VALIDATION STEP 4.2: Architectural Pattern Compliance**

- **Input**: Package configurations and source code structure
- **Process**: Validate packages follow architectural patterns
- **Output**: Architectural compliance validation

**ARCHITECTURAL COMPLIANCE CRITERIA:**
✅ **Core Package Patterns**: Core packages follow self-contained patterns
✅ **Extension Package Patterns**: Extension packages follow VSCode integration patterns
✅ **Shared Package Patterns**: Shared packages follow utility patterns
✅ **Tool Package Patterns**: Tool packages follow standalone patterns

**VALIDATION STEP 4.3: Integration Pattern Validation**

- **Input**: Package integration patterns and adapter usage
- **Process**: Validate integration patterns follow established conventions
- **Output**: Integration pattern validation

**INTEGRATION PATTERN CRITERIA:**
✅ **Adapter Usage**: VSCode integration uses local adapters
✅ **Type Imports**: Core packages use type imports only
✅ **Service Instantiation**: Services instantiated directly, no DI containers
✅ **Bundle Configuration**: Extension packages bundled as CommonJS

### **STEP 6: WORKSPACE SCALABILITY ANALYSIS**

**VALIDATION STEP 6.1: Workspace Growth Planning**

- **Input**: Workspace growth patterns and package addition strategies
- **Process**: Analyze how the workspace scales with new packages
- **Output**: Workspace growth planning assessment

**WORKSPACE GROWTH CRITERIA:**
✅ **Growth Strategy**: Clear strategy for adding new packages
✅ **Package Templates**: Templates available for new package types
✅ **Naming Conventions**: Consistent naming conventions for new packages
✅ **Documentation Standards**: Standards for new package documentation
✅ **Integration Guidelines**: Guidelines for integrating new packages
✅ **Quality Gates**: Quality gates for new package acceptance
✅ **Review Process**: Review process for new package additions

**VALIDATION STEP 6.2: Build Time Scaling Analysis**

- **Input**: Build time metrics and package count analysis
- **Process**: Assess build time as packages are added
- **Output**: Build time scaling assessment

**BUILD TIME SCALING CRITERIA:**
✅ **Build Time Monitoring**: Build times are monitored and tracked
✅ **Performance Baselines**: Performance baselines are established
✅ **Optimization Strategies**: Strategies for build time optimization
✅ **Parallel Execution**: Builds utilize parallel execution effectively
✅ **Cache Optimization**: Build cache is optimized for large workspaces
✅ **Incremental Builds**: Incremental builds are efficient
✅ **Build Splitting**: Large builds are split into manageable chunks

**VALIDATION STEP 6.3: Dependency Complexity Analysis**

- **Input**: Dependency graph complexity and growth patterns
- **Process**: Analyze dependency graph complexity growth
- **Output**: Dependency complexity assessment

**DEPENDENCY COMPLEXITY CRITERIA:**
✅ **Graph Complexity**: Dependency graph complexity is manageable
✅ **Circular Dependency Prevention**: Mechanisms prevent circular dependencies
✅ **Dependency Documentation**: Dependencies are well-documented
✅ **Impact Analysis**: Tools for analyzing dependency impact
✅ **Refactoring Support**: Support for dependency refactoring
✅ **Visualization Tools**: Tools for visualizing dependency relationships
✅ **Complexity Monitoring**: Dependency complexity is monitored

**VALIDATION STEP 6.4: Tool Performance Analysis**

- **Input**: Tool performance metrics and workspace size analysis
- **Process**: Assess tool performance as workspace grows
- **Output**: Tool performance assessment

**TOOL PERFORMANCE CRITERIA:**
✅ **IDE Performance**: IDE performance remains acceptable
✅ **Build Tool Performance**: Build tools perform well at scale
✅ **Test Tool Performance**: Test tools perform efficiently
✅ **Linting Performance**: Linting tools perform well
✅ **Documentation Tool Performance**: Documentation tools are efficient
✅ **Analysis Tool Performance**: Analysis tools perform adequately
✅ **Performance Monitoring**: Tool performance is monitored

### **STEP 7: OPERATIONAL EXCELLENCE ANALYSIS**

**VALIDATION STEP 7.1: CI/CD Integration Analysis**

- **Input**: CI/CD pipeline configuration and integration
- **Process**: Analyze workspace-level CI/CD pipeline integration
- **Output**: CI/CD integration assessment

**CI/CD INTEGRATION CRITERIA:**
✅ **Pipeline Configuration**: CI/CD pipeline is properly configured
✅ **Build Integration**: Build process is integrated with CI/CD
✅ **Test Integration**: Test process is integrated with CI/CD
✅ **Deployment Integration**: Deployment process is integrated with CI/CD
✅ **Quality Gates**: Quality gates are implemented in pipeline
✅ **Pipeline Performance**: Pipeline performance is optimized
✅ **Pipeline Monitoring**: Pipeline is monitored and maintained

**VALIDATION STEP 7.2: Deployment Strategy Analysis**

- **Input**: Deployment strategies and release management
- **Process**: Assess workspace deployment and release management
- **Output**: Deployment strategy assessment

**DEPLOYMENT STRATEGY CRITERIA:**
✅ **Release Strategy**: Clear release strategy is defined
✅ **Version Management**: Version management is systematic
✅ **Deployment Process**: Deployment process is streamlined
✅ **Rollback Strategy**: Rollback strategy is defined
✅ **Environment Management**: Environment management is effective
✅ **Deployment Monitoring**: Deployment is monitored
✅ **Release Documentation**: Release documentation is comprehensive

**VALIDATION STEP 7.3: Monitoring and Alerting Analysis**

- **Input**: Monitoring and alerting systems and configurations
- **Process**: Analyze workspace-level monitoring and alerting
- **Output**: Monitoring and alerting assessment

**MONITORING AND ALERTING CRITERIA:**
✅ **System Monitoring**: System health is monitored
✅ **Performance Monitoring**: Performance metrics are monitored
✅ **Error Monitoring**: Errors and failures are monitored
✅ **Alert Configuration**: Alerts are properly configured
✅ **Alert Response**: Alert response procedures are defined
✅ **Monitoring Coverage**: Monitoring covers all critical areas
✅ **Monitoring Documentation**: Monitoring is well-documented

**VALIDATION STEP 7.4: Disaster Recovery Analysis**

- **Input**: Disaster recovery procedures and backup strategies
- **Process**: Assess workspace backup and recovery procedures
- **Output**: Disaster recovery assessment

**DISASTER RECOVERY CRITERIA:**
✅ **Backup Strategy**: Backup strategy is comprehensive
✅ **Recovery Procedures**: Recovery procedures are defined
✅ **Recovery Testing**: Recovery procedures are tested
✅ **Data Protection**: Data is protected appropriately
✅ **Business Continuity**: Business continuity plan is in place
✅ **Recovery Documentation**: Recovery procedures are documented
✅ **Recovery Monitoring**: Recovery process is monitored

### **STEP 8: WORKSPACE HEALTH ASSESSMENT**

**VALIDATION STEP 8.1: Overall Health Score**

- **Input**: All validation results from previous steps
- **Process**: Calculate overall workspace health score
- **Output**: Workspace health assessment

**HEALTH SCORE CRITERIA:**
✅ **Configuration Health**: All configurations valid and optimized
✅ **Dependency Health**: All dependencies properly resolved
✅ **Build Health**: All packages can be built successfully
✅ **Test Health**: All packages can be tested successfully
✅ **Architecture Health**: All packages follow architectural patterns

**VALIDATION STEP 8.2: Issue Prioritization**

- **Input**: All issues identified during analysis
- **Process**: Prioritize issues by impact and urgency
- **Output**: Prioritized issue list with remediation plans

**ISSUE PRIORITIZATION CRITERIA:**
✅ **Critical Issues**: Issues that prevent builds or tests
✅ **High Priority**: Issues that affect multiple packages
✅ **Medium Priority**: Issues that affect single packages
✅ **Low Priority**: Issues that are cosmetic or minor

**VALIDATION STEP 8.3: Remediation Planning**

- **Input**: Prioritized issue list
- **Process**: Create remediation plans for each issue
- **Output**: Complete remediation plan

**REMEDIATION PLANNING CRITERIA:**
✅ **Issue Understanding**: Root cause of each issue identified
✅ **Solution Design**: Appropriate solution designed for each issue
✅ **Impact Assessment**: Impact of fixes on other packages assessed
✅ **Implementation Plan**: Clear implementation plan for each fix

## **WORKSPACE AUDIT CHECKLIST**

### **PRE-AUDIT PREPARATION**

- [ ] **Reference Documents**: Review `docs/Analysis-Framework-Base.md` for shared patterns
- [ ] **Tool Availability**: Ensure all nx-mcp tools are available
- [ ] **Context Understanding**: Understand workspace purpose and scope
- [ ] **Documentation Review**: Review existing architecture documentation

### **AUDIT EXECUTION**

- [ ] **Workspace Overview**: Complete workspace project graph analysis
- [ ] **Package Discovery**: Identify and classify all packages
- [ ] **Health Assessment**: Assess overall workspace health
- [ ] **Dependency Analysis**: Map all dependencies and build order
- [ ] **Configuration Validation**: Validate all configurations
- [ ] **Architecture Validation**: Validate architectural patterns
- [ ] **Workspace Scalability Analysis**: Analyze workspace scaling characteristics
- [ ] **Operational Excellence Analysis**: Analyze operational processes and CI/CD
- [ ] **Issue Identification**: Identify all issues and problems
- [ ] **Remediation Planning**: Create plans for issue resolution

### **POST-AUDIT VALIDATION**

- [ ] **Health Score**: Calculate overall workspace health score
- [ ] **Issue Prioritization**: Prioritize all identified issues
- [ ] **Documentation Update**: Update relevant documentation
- [ ] **Implementation Planning**: Plan implementation of fixes
- [ ] **Follow-up Validation**: Plan follow-up validation after fixes

### **BASE FRAMEWORK INTEGRATION**

**REFERENCE BASE FRAMEWORK SECTIONS:**

- [ ] **Documentation Quality Assessment**: Reference `docs/Analysis-Framework-Base.md` Steps 1-4
- [ ] **Monitoring & Observability**: Reference `docs/Analysis-Framework-Base.md` Steps 5-8
- [ ] **Future-Proofing Analysis**: Reference `docs/Analysis-Framework-Base.md` Steps 9-11
- [ ] **Performance Analysis Depth**: Reference `docs/Analysis-Framework-Base.md` Steps 12-14
- [ ] **Testing Strategy Depth**: Reference `docs/Analysis-Framework-Base.md` Steps 15-18
- [ ] **Performance Analysis**: Reference `docs/Analysis-Framework-Base.md` Steps 23-24
- [ ] **Quality Assurance**: Reference `docs/Analysis-Framework-Base.md` Steps 25
- [ ] **Maintenance and Operations**: Reference `docs/Analysis-Framework-Base.md` Steps 26
- [ ] **Configuration Management**: Reference `docs/Analysis-Framework-Base.md` Steps 27-30

**WORKSPACE-SPECIFIC INTEGRATION PROTOCOL:**

1. **Complete Workspace Analysis**: Execute all workspace-specific analysis steps first
2. **Apply Base Framework**: Apply relevant base framework sections to workspace context
3. **Workspace Context Adaptation**: Adapt base framework criteria to workspace-level requirements
4. **Cross-Package Assessment**: Evaluate base framework criteria across all packages
5. **Unified Workspace Report**: Combine workspace-specific and universal quality assessments

## **DECISION POINTS**

### **CONTINUATION CRITERIA**

- **IF** workspace is healthy **THEN** proceed to package-specific analysis
- **IF** all configurations valid **THEN** proceed to detailed package analysis
- **IF** dependencies properly mapped **THEN** proceed to implementation

### **BLOCKING CRITERIA**

- **IF** workspace has errors **THEN** resolve before proceeding
- **IF** circular dependencies found **THEN** fix before proceeding
- **IF** configuration issues detected **THEN** fix before proceeding
- **IF** architectural violations found **THEN** fix before proceeding

### **ESCALATION CRITERIA**

- **IF** critical issues found **THEN** escalate for immediate attention
- **IF** multiple high-priority issues **THEN** prioritize and address systematically
- **IF** architectural violations **THEN** consult architecture documentation

## **OUTPUT FORMAT**

### **WORKSPACE AUDIT REPORT**

**Executive Summary:**

- Overall workspace health score
- Number of packages analyzed
- Critical issues identified
- Recommendations for improvement

**Detailed Analysis:**

- Package inventory with classifications
- Dependency mapping and build order
- Configuration validation results
- Architectural compliance assessment
- Issue prioritization and remediation plans

**Implementation Plan:**

- Prioritized list of fixes
- Estimated effort for each fix
- Dependencies between fixes
- Timeline for implementation

## **CONCLUSION**

This workspace audit process ensures complete understanding of the monorepo structure, identifies potential issues, and provides a clear path forward for maintaining workspace health and architectural compliance.

**Remember**: Always perform workspace-level analysis before diving into package-specific details, and update this process when new patterns or issues are discovered.
