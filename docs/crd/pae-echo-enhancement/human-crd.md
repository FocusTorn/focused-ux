# Change Request: PAE - Echo Enhancement with Variants and Continue Execution

## **OVERVIEW**

### **Change Summary**

This change request enhances the PAE (Project Alias Expander) echo functionality by adding variant support and a continue execution option. The enhancement introduces a new `env-setting-flags` configuration section and extends the existing `--pae-echo` functionality with variant support and a new `--pae-echoX` flag that continues execution after displaying the command.

### **Package Information**

- **Package**: pae (Project Alias Expander)
- **Change Type**: Feature Enhancement
- **Priority**: Medium
- **Estimated Effort**: 2-3 days

## **REQUIREMENTS**

### **Non-Negotiables**

- NO backwards compatibility required
- Environment setting flags must be handled separately from other internal flags
- Variant support must be implemented for both echo and echoX flags
- Continue execution functionality must be preserved for echoX

### **Terms and Definitions**

- **lf**: Long-form style alias (e.g., `pae aka b` instead of `aka b`)
- **sf**: Short-form style alias (e.g., `aka b` instead of `pae aka b`)
- **env-setting-flags**: New configuration section for flags that trigger environment variables before expansion/execution
- **variant**: Specific echo output type (short-in, long-in, global-in, short-out, long-out, global-out)

## **DETAILED CHANGES**

### **Change Item 1: Environment Setting Flags Configuration**

Create a new `env-setting-flags` section in the PAE configuration to separate environment-setting flags from other internal flags. This section will contain:

- `"v"`: `"--pae-verbose"`
- `"db"`: `"--pae-debug"`
- `"echo"`: `"--pae-echo"`

These flags trigger environment variables before any expansion or execution happens, so they require separate handling from other internal flags like `sto` and `h`.

### **Change Item 2: Enhanced Echo Functionality with Variants**

Extend the existing `--pae-echo` functionality to support variants and add a new `--pae-echoX` flag:

- **New Flag**: `--pae-echoX` - Shows echo output then continues with command execution
- **Variant Support**: Both `--pae-echo` and `--pae-echoX` support variants via `--pae-echo="{variant}"` or `--pae-echoX="{variant}"`

### **Change Item 3: Pseudo Execution Variants**

Implement six specific echo variants for different command processing stages:

**Command Input Variants:**

- `short-in`: Show only the command that the short-form handler received
- `long-in`: Show only the command that the long-form handler received
- `global-in`: Show only the command that global PAE received

**Command Output Variants:**

- `short-out`: Show only the command that the short-form handler passed on and its target
- `long-out`: Show only the command that the long-form handler passed on and its target
- `global-out`: Show only the command that global PAE executed, exactly as executed

**Default Behavior:**

- Empty variant (`--pae-echo=""`) or no variant shows all 6 variants
- `--pae-echo` exits after display
- `--pae-echoX` continues execution after display

## **CONDENSED**

### **Implementation Checklist**

- [ ] **Configuration Structure**
    - [ ] Create `env-setting-flags` section in PAE config
    - [ ] Move `v`, `db`, `echo` flags to new section
    - [ ] Update flag processing logic to handle new section

- [ ] **Echo Enhancement**
    - [ ] Add `--pae-echoX` flag with continue execution
    - [ ] Implement variant support for both echo flags
    - [ ] Add variant parsing and validation

- [ ] **Pseudo Execution**
    - [ ] Implement 6 echo variants (short-in, long-in, global-in, short-out, long-out, global-out)
    - [ ] Add variant-specific output formatting
    - [ ] Implement default behavior (show all variants)

- [ ] **Testing and Validation**
    - [ ] Test all variant combinations
    - [ ] Verify continue execution for echoX
    - [ ] Validate environment flag separation

## **IMPLEMENTATION DETAILS**

### **Pseudo Execution**

The enhanced echo functionality will work as follows:

1. **Variant Parsing**: Parse `--pae-echo="{variant}"` or `--pae-echoX="{variant}"` to determine output type
2. **Command Processing**: Capture commands at different processing stages (short-in, long-in, global-in, short-out, long-out, global-out)
3. **Output Generation**: Generate formatted output based on variant selection
4. **Execution Control**: Exit after display for `--pae-echo`, continue for `--pae-echoX`

### **Examples**

**Short-form Input:**

```bash
aka b --pae-echo="short-in"
# Output: short(in): aka b
# Exits after display
```

**Short-form Output:**

```bash
aka b --pae-echo="short-out"
# Output: short(out): aka b -> Destination: global pae
# Exits after display
```

**Long-form Input:**

```bash
aka b --pae-echo="long-in"
# Output: long(in): aka b
# Exits after display
```

**Long-form Output:**

```bash
aka b --pae-echo="long-out"
# Output: long(out): aka b -> Destination: global pae
# Exits after display
```

**Global Input:**

```bash
aka b --pae-echo="global-in"
# Output: global(in): aka b
# Exits after display
```

**Global Output:**

```bash
aka b --pae-echo="global-out"
# Output: global(out) [Executing]: nx run @fux/project-alias-expander:build
# Exits after display
```

**All Variants (Default):**

```bash
aka b --pae-echo
# Output:
# short(in): aka b
# long(in): aka b
# global(in): aka b
# short(out): aka b -> Destination: global pae
# long(out): aka b -> Destination: global pae
# global(out) [Executing]: nx run @fux/project-alias-expander:build
# Exits after display
```

**Continue Execution:**

```bash
aka b --pae-echoX="global-out"
# Output: global(out) [Executing]: nx run @fux/project-alias-expander:build
# Continues to execute: nx run @fux/project-alias-expander:build
```

## **ACCEPTANCE CRITERIA**

### **Functional Requirements**

- [ ] `env-setting-flags` section created and functional
- [ ] `--pae-echoX` flag implemented with continue execution
- [ ] All 6 echo variants working correctly
- [ ] Variant parsing supports both `--pae-echo="{variant}"` and `--pae-echoX="{variant}"`
- [ ] Default behavior shows all variants when no variant specified
- [ ] Environment flags properly separated from other internal flags

### **Testing Requirements**

- [ ] Unit tests for all variant combinations
- [ ] Integration tests for continue execution functionality
- [ ] Configuration tests for new `env-setting-flags` section
- [ ] End-to-end tests for complete echo workflow
- [ ] Performance tests to ensure no degradation

## **IMPACT ANALYSIS**

### **Affected Components**

- PAE configuration system
- Flag processing logic
- Echo functionality
- Command execution pipeline
- Environment variable handling

### **Dependencies**

- Existing PAE flag system
- Command processing pipeline
- Environment variable management
- Output formatting system

## **IMPLEMENTATION PLAN**

### **Phase 1: Configuration Restructure**

- Create `env-setting-flags` section
- Move existing flags to new section
- Update flag processing logic
- Test configuration changes

### **Phase 2: Echo Enhancement**

- Implement `--pae-echoX` flag
- Add variant support for both echo flags
- Implement variant parsing and validation
- Test enhanced echo functionality

### **Phase 3: Pseudo Execution**

- Implement 6 echo variants
- Add variant-specific output formatting
- Implement default behavior
- Test all variant combinations

### **Phase 4: Testing and Validation**

- Write comprehensive test suite
- Perform integration testing
- Validate performance
- Complete documentation

## **RISK ASSESSMENT**

### **Technical Risks**

- **Configuration Complexity**: Risk of breaking existing flag processing
    - _Mitigation_: Thorough testing and gradual rollout
- **Variant Parsing**: Risk of incorrect variant interpretation
    - _Mitigation_: Strict validation and clear error messages
- **Performance Impact**: Risk of echo functionality slowing down execution
    - _Mitigation_: Performance testing and optimization

### **Timeline Risks**

- **Scope Creep**: Risk of additional requirements during implementation
    - _Mitigation_: Clear scope definition and change control
- **Testing Complexity**: Risk of extensive testing requirements
    - _Mitigation_: Automated testing and incremental validation

## **APPROVAL**

### **Stakeholders**

- **Requester**: User
- **Technical Lead**: TBD
- **Product Owner**: TBD

### **Approval Status**

- [ ] Technical Review
- [ ] Product Review
- [ ] Implementation Approval
- [ ] Testing Approval

---

**Created**: 2025-01-30 08:08:00
**Status**: Draft
**Assignee**: TBD
**Priority**: Medium
