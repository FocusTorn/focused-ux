# F-UX: Ghost Writer

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/NewRealityDesigns.ghost-writer?style=flat-square&label=Marketplace)](https://marketplace.visualstudio.com/items?itemName=NewRealityDesigns.ghost-writer)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/NewRealityDesigns.ghost-writer?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=NewRealityDesigns.ghost-writer)

Ghost Writer is a VS Code extension designed to accelerate your development workflow by automating the generation of common, repetitive code snippets like import statements and console logs.

## Features

-   **Smart Import Generation**: Store a reference to a class, function, or variable in one file and generate a relative import statement for it in another.
-   **Contextual Logging**: Instantly generate detailed `console.log` statements for any selected variable, automatically including the enclosing class and function name for easier debugging.
-   **Seamless Workflow**: All commands are available directly in the editor's context menu for quick access without interrupting your flow.

---

## Usage

### 1. Store & Import

This two-step process eliminates the need to manually type out import paths.

**A. `[F-UX] Ghost Writer: Store Code Fragment`**

-   **How**: Select the code you want to import later (e.g., a class name) and right-click to select the command from the context menu.
-   **What it does**: Ghost Writer stores the selected text and the path of the current file in its clipboard.

**B. `[F-UX] Ghost Writer: Insert Import Statement`**

-   **How**: In the destination file, right-click where you want the import and select the command.
-   **What it does**: It generates a relative import statement for the stored fragment and inserts it at the cursor's position. The Ghost Writer clipboard is cleared after use.

**Example:**

1.  In `src/services/MyService.ts`, you select `MyService` and run **Store Code Fragment**.
2.  In `src/controllers/MyController.ts`, you run **Insert Import Statement**.
3.  Ghost Writer inserts: `import { MyService } from '../services/MyService.js';`

### 2. Log Selected Variable

**`[F-UX] Ghost Writer: Log Selected Variable`**

-   **How**: Select a variable or property in your code, right-click, and select the command.
-   **What it does**: It generates a `console.log` statement on the line below the selection, providing clear, contextual information about where the log is coming from.

**Example:**

Selecting `user.name` and running the command might produce:

```typescript
// Output with default settings
console.log('MyClass ► myMethod ► user.name: ', user.name);
```

---

## Extension Settings

You can customize the logger's output via your VS Code settings (`settings.json`).

-   **`fux-ghost-writer.consoleLogger.includeClassName`**:
    -   Type: `boolean`
    -   Default: `true`
    -   Description: Include the enclosing class name in the log message.

-   **`fux-ghost-writer.consoleLogger.includeFunctionName`**:
    -   Type: `boolean`
    -   Default: `true`
    -   Description: Include the enclosing function name in the log message.

---

## Release Notes

See the [CHANGELOG.md](./CHANGELOG.md) for detailed release notes.