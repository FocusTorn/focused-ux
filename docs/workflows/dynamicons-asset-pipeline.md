# Dynamicons: Icon Asset Workflow

This document outlines the complete workflow for adding new icons to the Dynamicons theme, from initial file placement to final association in the theme manifest. Following these steps ensures that icons are correctly processed, optimized, and integrated into the extension.

The process is divided into three main stages:
1.  **Placement & Naming:** The developer places new SVG files with specific names in a designated source directory.
2.  **Build & Optimization:** An automated script processes these files, optimizing them and placing them in the final asset directory.
3.  **Association:** The developer manually updates a model file to link the new icon to specific file types, filenames, or folder names.

---

### Step 1: Initial Placement & Naming Conventions (Developer Action)

This is the primary entry point for adding new icons. All raw SVG files **MUST** be placed in the following external source directory:

> **Location:** `D:/_dev/!Projects/focused-ux/icons`

The naming of your SVG files in this directory is critical as it determines how they are processed.

#### Naming Rules

*   **File Icons:**
    *   Name the file directly after the icon's purpose. The name should be simple, lowercase, and descriptive.
    *   **Example:** `csharp.svg`, `python.svg`, `webpack-config.svg`

*   **Folder Icons (Closed State):**
    *   The filename **MUST** be prefixed with `folder-`.
    *   **Example:** `folder-src.svg`, `folder-node.svg`, `folder-test.svg`

*   **Folder Icons (Open State):**
    *   The filename **MUST** use the same name as the corresponding closed state icon but with an `-open` suffix.
    *   **Example:** `folder-src-open.svg`, `folder-node-open.svg`, `folder-test-open.svg`

---

### Step 2: The Build & Optimization Pipeline (Automated)

This stage is fully automated. Run the following command from the repository root to trigger the pipeline:

~~~powershell
pnpm nx run @fux/dynamicons-core:build-assets
~~~

This command executes the following sequence of scripts:

1.  **Localization (`build_dynamicon_assets.ts`):**
    *   **Source:** `D:/_dev/!Projects/focused-ux/icons/`
    *   **Action:** Moves all `.svg` files from the source directory to the package's internal staging area.
    *   **Destination:** `packages/dynamicons/core/src/icons/`

2.  **Optimization (`generate_optimized_icons.ts`):**
    *   **Source:** `packages/dynamicons/core/src/icons/`
    *   **Action:** Optimizes the SVGs and sorts them based on their name.
    *   **Destination (Files):** `packages/dynamicons/ext/assets/icons/file_icons/`
    *   **Destination (Folders):** `packages/dynamicons/ext/assets/icons/folder_icons/`

3.  **Manifest Generation (`generate_icon_manifests.ts`):**
    *   **Action:** Scans the final asset directories and the association models to generate the theme files.
    *   **Destination:** `packages/dynamicons/ext/assets/themes/` (updates `base.theme.json` and `dynamicons.theme.json`)

---

### Step 3: Associating Icons with File/Folder Names (Developer Action)

After the build process has successfully placed the optimized icon in the `ext/assets` directory, you must manually create an association rule for it.

*   **Location:**
    *   For **file** icons, edit: `packages/dynamicons/core/src/models/file_icons.model.json`
    *   For **folder** icons, edit: `packages/dynamicons/core/src/models/folder_icons.model.json`

*   **How to Associate:**
    1.  Open the appropriate `.model.json` file.
    2.  Navigate to the `"icons"` array.
    3.  Add a new JSON object for your icon.
    4.  The `"name"` property of your new object **MUST** match the SVG filename (without the `folder-` prefix or `.svg` extension).
    5.  Add file/folder names to the appropriate array (`"fileExtensions"`, `"fileNames"`, or `"folderNames"`).

---

### Example: Adding a "TOML" Icon

1.  **Place the SVG:**
    *   Create your icon and save it as `toml.svg`.
    *   Place the file in `D:/_dev/!Projects/focused-ux/icons/`.

2.  **Run the Build:**
    *   Execute `pnpm nx run @fux/dynamicons-core:build-assets` in your terminal.

3.  **Verify the Output (Optional):**
    *   Check that `toml.svg` now exists in `packages/dynamicons/ext/assets/icons/file_icons/`.

4.  **Associate the Icon:**
    *   Open `packages/dynamicons/core/src/models/file_icons.model.json`.
    *   Add the following entry to the `"icons"` array:
        ~~~json
        { "name": "toml", "fileExtensions": ["toml"] }
        ~~~
    *   *Note: If you were associating with a full filename, you would use the `"fileNames"` array instead.*

After these steps, a final build of the extension (`pnpm nx build @fux/dynamicons-ext`) will package the new icon and its association, making it available in VS Code.