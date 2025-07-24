# 🛠️ Ghost Writer & Extensions Refactor Plan

## Objective

- **Centralize all business logic** in each package’s `core`.
- **Move all reusable adapters and utilities** to `all-shared`.
- **Ensure extension packages** (e.g., `ghost-writer/ext`) are thin wrappers that only expose core logic to VSCode.

---

## 1. Move Shared Adapters to `all-shared`

**Source:**  
`packages/ghost-writer/ext/src/services/adapters/`

**Destination:**  
`packages/all-shared/src/vscode/adapters/`  
_(Create this directory if it does not exist.)_

**Files to Move:**

- `CommonUtils.adapter.ts`
- `FileSystem.adapter.ts`
- `PathUtils.adapter.ts`
- `Process.adapter.ts`
- `Window.adapter.ts`
- `Workspace.adapter.ts`

---

## 2. Update Imports in All Extension Packages

- Change all imports in `ghost-writer/ext` (and other extensions) from:
    ```ts
    import { FileSystemAdapter } from './services/adapters/FileSystem.adapter'
    ```
    to:
    ```ts
    import { FileSystemAdapter } from '@fux/all-shared/vscode/adapters/FileSystem.adapter'
    ```
- Repeat for all moved adapters and in all extension packages that use similar adapters (e.g., `dynamicons/ext`, `context-cherry-picker/ext`, `project-butler/ext`).

---

## 3. Remove Duplicate Adapter Implementations

- Delete the now-redundant adapter files from all extension packages after updating imports.
- Ensure all extension packages use the shared adapters from `all-shared`.

---

## 4. Ensure Interface Consistency

- Confirm all interfaces implemented by the adapters (`IFileSystem`, `IProcess`, `IWindow`, `IWorkspace`, `ICommonUtilsService`, `IPathUtilsService`) are defined in:
    ```
    packages/all-shared/src/_interfaces/
    ```
- If any interface is duplicated or defined elsewhere, consolidate it into the above directory.

---

## 5. Audit Core Packages

- Review each `core` package (e.g., `ghost-writer/core`) to ensure it contains only business logic and service implementations.
- Move any VSCode/environment-specific logic or adapters out of `core` and into `all-shared` or the appropriate extension package.

---

## 6. Test and Validate

- Build and test all affected packages to ensure:
    - No broken imports
    - No duplicate adapter implementations remain
    - All extension packages function as expected using the shared adapters

---

## 7. Document the Changes

- Update project documentation to reflect the new structure and import paths for adapters and shared utilities.
- Add migration notes for contributors if necessary.
