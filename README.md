# Focused UX (F-UX) Monorepo

This repository is a monorepo containing a suite of Visual Studio Code extensions designed to enhance developer productivity and provide a more focused user experience. The project is managed using [Nx](https://nx.dev) and [pnpm workspaces](https://pnpm.io/workspaces).

## Packages

This monorepo contains the following primary VS Code extensions:

| Package                   | Description                                                           |
| :------------------------ | :-------------------------------------------------------------------- |
| **Context Cherry Picker** | A standalone extension for advanced context selection and formatting. |
| **Dynamicons**            | A dynamic and customizable icon theme for a focused user experience.  |
| **Ghost Writer**          | Dynamically generate frequently used code.                            |
| **Project Butler**        | A decoupled collection of project management utilities.               |

It also includes shared internal libraries:

- `@fux/services`: Shared, framework-agnostic services.
- `@fux/tools`: Shared, framework-agnostic utility functions.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [pnpm](https://pnpm.io/installation)

### Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/FocusTorn/focused-ux.git
    cd focused-ux
    ```

2.  **Install dependencies:**
    This project uses pnpm workspaces. Install all dependencies from the root of the monorepo.

    ```bash
    pnpm install
    ```

3.  **Build a Package:**
    You can build a specific extension package using Nx. For example, to build the _Context Cherry Picker_ extension:

    ```bash
    pnpm nx build @fux/context-cherry-picker-ext
    ```

    The `dependsOn: ["^build"]` configuration in the package's `project.json` ensures that all its local dependencies are built first.

4.  **Run an Extension:**
    This repository is pre-configured for debugging in VS Code.
    - Open the repository root in VS Code.
    - Go to the "Run and Debug" view (Ctrl+Shift+D).
    - Select the extension you want to run from the dropdown menu (e.g., `Context Cherry Picker`).
    - Press F5 or click the "Start Debugging" button.

    This will launch a new VS Code window (the "Extension Development Host") with the selected extension installed and running. The `preLaunchTask` in `.vscode/launch.json` will automatically build the necessary package before launching.

## License

This project is licensed under the MIT License. See the [LICENSE.txt](LICENSE.txt) file for details.
