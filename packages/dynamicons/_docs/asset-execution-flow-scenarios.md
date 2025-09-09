# Asset Generation Execution Flow Scenarios

This document outlines all possible execution flow scenarios for the Dynamicons asset generation workflow, showing how different change detection conditions affect which processors run or skip.

## **Documented Scenarios**

### **Scenario 1: No Changes Detected (All Skip)**

- New icons found in external source: false
- File icon model changes: false
- Folder icon model changes: false
- Language icon model changes: false
- Preview images exist: true

```
Icons Processor:   SKIP (no new icons)
Audit Models:      SKIP (no model changes)
Themes Processor:  SKIP (no model changes)
Audit Themes:      SKIP (no theme changes)
Preview Processor: SKIP (no icon changes)
```

### **Scenario 2: Model Changes Only**

- New icons found in external source: false
- File icon model changes: true
- Folder icon model changes: true
- Language icon model changes: true
- Preview images exist: true

```
Icons Processor:   SKIP (no new icons)
Audit Models:      RUN  (model changes detected)
Themes Processor:  RUN  (model changes detected)
Audit Themes:      RUN  (themes were generated)
Preview Processor: SKIP (no icon changes)
```

### **Scenario 3: Icon Changes Only**

- New icons found in external source: true
- File icon model changes: false
- Folder icon model changes: false
- Language icon model changes: false
- Preview images exist: true

```
Icons Processor:   RUN  (new icons detected)
Audit Models:      SKIP (no model changes)
Themes Processor:  SKIP (no model changes)
Audit Themes:      SKIP (no theme changes)
Preview Processor: RUN  (icon changes detected)
```

### **Scenario 4: Both Icon and Model Changes**

- New icons found in external source: true
- File icon model changes: true
- Folder icon model changes: true
- Language icon model changes: true
- Preview images exist: true

```
Icons Processor:   RUN  (new icons detected)
Audit Models:      RUN  (model changes detected)
Themes Processor:  RUN  (model changes detected)
Audit Themes:      RUN  (themes were generated)
Preview Processor: RUN  (icon changes detected)
```

### **Scenario 5: Theme Files Missing (Force Generation)**

- New icons found in external source: false
- File icon model changes: false
- Folder icon model changes: false
- Language icon model changes: false
- Theme files missing: true
- Preview images exist: true

```
Icons Processor:   SKIP (no new icons)
Audit Models:      RUN  (theme files missing)
Themes Processor:  RUN  (theme files missing)
Audit Themes:      RUN  (themes were generated)
Preview Processor: SKIP (no icon changes)
```

### **Scenario 6: Preview Images Missing (Force Generation)**

- New icons found in external source: false
- File icon model changes: false
- Folder icon model changes: false
- Language icon model changes: false
- Preview images missing: true

```
Icons Processor:   SKIP (no new icons)
Audit Models:      SKIP (no model changes)
Themes Processor:  SKIP (no model changes)
Audit Themes:      SKIP (no theme changes)
Preview Processor: RUN  (preview images missing)
```

### **Scenario 7: Model Validation Errors (Stop on Failure)**

- New icons found in external source: true
- File icon model changes: true
- Folder icon model changes: true
- Language icon model changes: true
- Model validation errors: true

```
Icons Processor:   RUN  (new icons detected)
Audit Models:      FAIL (model validation errors)
Themes Processor:  SKIP (model validation failed)
Audit Themes:      SKIP (model validation failed)
Preview Processor: SKIP (model validation failed)
```

### **Scenario 8: Theme Generation Errors (Stop on Failure)**

- New icons found in external source: true
- File icon model changes: true
- Folder icon model changes: true
- Language icon model changes: true
- Theme generation errors: true

```
Icons Processor:   RUN  (new icons detected)
Audit Models:      RUN  (model changes detected)
Themes Processor:  FAIL (theme generation failed)
Audit Themes:      SKIP (theme generation failed)
Preview Processor: SKIP (theme generation failed)
```

### **Scenario 9: Preview Generation Errors (Stop on Failure)**

- New icons found in external source: true
- File icon model changes: false
- Folder icon model changes: false
- Language icon model changes: false
- Preview generation errors: true

```
Icons Processor:   RUN  (new icons detected)
Audit Models:      SKIP (no model changes)
Themes Processor:  SKIP (no model changes)
Audit Themes:      SKIP (no theme changes)
Preview Processor: FAIL (preview generation failed)
```

## **Additional Scenarios**

### **Scenario 10: External Source Unavailable**

- External source directory: inaccessible
- Model changes detected: true
- Critical error: external source required for icon processing

```
Icons Processor:   FAIL (critical error - external source unavailable)
Audit Models:      SKIP (critical error - stopping execution)
Themes Processor:  SKIP (critical error - stopping execution)
Audit Themes:      SKIP (critical error - stopping execution)
Preview Processor: SKIP (critical error - stopping execution)
```

### **Scenario 11: Mixed Changes with Partial Failures**

- New icons found in external source: true
- File icon model changes: true
- Folder icon model changes: true
- Language icon model changes: true
- Theme audit failure: true
- Rollback required: true

```
Icons Processor:   RUN  (new icons detected)
Audit Models:      RUN  (model changes detected)
Themes Processor:  RUN  (model changes detected)
Audit Themes:      FAIL (theme audit failed - rolling back)
Preview Processor: SKIP (rollback in progress)
```

### **Scenario 12: Force Regeneration Mode**

- Force regeneration: true
- All processors: forced to run
- Bypass change detection: true

```
Icons Processor:   RUN  (force mode)
Audit Models:      RUN  (force mode)
Themes Processor:  RUN  (force mode)
Audit Themes:      RUN  (force mode)
Preview Processor: RUN  (force mode)
```

### **Scenario 13: Icons Only with Model Validation Errors**

- New icons found in external source: true
- File icon model changes: false
- Folder icon model changes: false
- Language icon model changes: false
- Model validation errors: true
- Preview images exist: true

```
Icons Processor:   RUN  (new icons detected)
Audit Models:      FAIL (model validation errors)
Themes Processor:  SKIP (model validation failed)
Audit Themes:      SKIP (model validation failed)
Preview Processor: RUN  (icon changes detected)
```

### **Scenario 14: Model Changes with Preview Generation Errors**

- New icons found in external source: false
- File icon model changes: true
- Folder icon model changes: true
- Language icon model changes: true
- Preview generation errors: true

```
Icons Processor:   SKIP (no new icons)
Audit Models:      RUN  (model changes detected)
Themes Processor:  RUN  (model changes detected)
Audit Themes:      RUN  (themes were generated)
Preview Processor: FAIL (preview generation failed)
```

### **Scenario 15: External Source with Model Changes**

- External source directory: accessible
- New icons found in external source: true
- File icon model changes: true
- Folder icon model changes: true
- Language icon model changes: true
- Preview images exist: true

```
Icons Processor:   RUN  (external source available)
Audit Models:      RUN  (model changes detected)
Themes Processor:  RUN  (model changes detected)
Audit Themes:      RUN  (themes were generated)
Preview Processor: RUN  (icon changes detected)
```

## **Change Detection Logic**

### **Icons Processor**

- **RUN**: New SVG files in external source directory
- **SKIP**: No new icons in external source
- **FAIL**: External source inaccessible or processing errors

### **Audit Models**

- **RUN**: Model files modified since last theme generation OR theme files missing
- **SKIP**: No model changes detected
- **FAIL**: Model validation errors (syntax, structure, assignments)

### **Themes Processor**

- **RUN**: Model files modified since last theme generation OR theme files missing
- **SKIP**: No model changes detected
- **FAIL**: Theme generation errors (deletion, generation, verification)

### **Audit Themes**

- **RUN**: Themes were generated (depends on Themes Processor success)
- **SKIP**: No theme changes or themes not generated
- **FAIL**: Theme validation errors (existence, structure, assignments)

### **Preview Processor**

- **RUN**: Icon changes detected OR preview images missing
- **SKIP**: No icon changes AND preview images exist
- **FAIL**: Preview generation errors (deletion, generation, verification)

## **Dependency Chain**

### **Primary Dependencies**

1. **Icons** → **Previews** (previews depend on icon changes)
2. **Models** → **Themes** → **Audit Themes** (themes depend on model changes)
3. **Audit Models** runs when models change (validation step)

### **Cascade Logic**

- **Failure Cascade**: When a processor fails, dependent processors are skipped
- **Skip Cascade**: When a processor skips, dependent processors may still run if their own conditions are met
- **Change Cascade**: Changes in one area can trigger changes in dependent areas

## **Execution Rules**

### **Stop on Failure**

- **Default**: Stop execution on first processor failure
- **Very Verbose Mode**: Continue execution even after failures (for debugging)

### **Change Detection Priority**

1. **External Source Changes** (highest priority)
2. **Model File Changes** (medium priority)
3. **Missing Output Files** (lowest priority)

### **Validation Requirements**

- **Model Validation**: Must pass before theme generation
- **Theme Validation**: Must pass before theme auditing
- **Icon Validation**: Must pass before preview generation

## **Status Indicators**

### **RUN Status**

- ✅ **Success**: Processor completed successfully
- ❌ **Failed**: Processor encountered errors
- ⚠️ **Warning**: Processor completed with warnings

### **SKIP Status**

- ● **Skipped**: Processor skipped due to no changes detected
- ● **Dependency Skipped**: Processor skipped due to dependency failure

### **FAIL Status**

- ❌ **Validation Failed**: Input validation errors
- ❌ **Processing Failed**: Core processing errors
- ❌ **Verification Failed**: Output verification errors

## **Usage Examples**

### **Typical Development Workflow**

```bash
# Scenario 2: Model changes only
# Developer modifies model files
dca generate-assets
# Result: Icons skip, Models/Themes/Audit run, Previews skip
```

### **Icon Addition Workflow**

```bash
# Scenario 3: Icon changes only
# Developer adds new icons to external source
dca generate-assets
# Result: Icons run, Models/Themes skip, Previews run
```

### **Complete Regeneration**

```bash
# Scenario 12: Force regeneration
dca generate-assets --force
# Result: All processors run regardless of change detection
```

### **Debug Mode**

```bash
# Scenario 7: Model validation errors
dca generate-assets --very-verbose
# Result: Continue execution even after failures for debugging
```

---

_This document provides comprehensive coverage of all possible execution flow scenarios for the Dynamicons asset generation workflow, enabling developers to understand and predict system behavior under various conditions._
