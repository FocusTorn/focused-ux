& {
$desc = "Generate config files: Nx plugin"
$plugName = "recommended"
$genName = "PackageConfig: lib: " # Test TS Proj

$genParts = $genName -split ': '
$usePath = "plugins/$plugName/src/generators/" + ($genParts -join '/') + '/' + $genParts[-1]
$useName = $genName
$command = "npx nx generate @nx/plugin:generator --description=`"$desc`" --path=`"$usePath`" --name=`"$useName`" --skipLintChecks=true --unitTestRunner=vitest"


# Echo with line breaks for readability
# echo "npx nx generate @nx/plugin:generator"
# echo "--description=`"$desc`""
# echo "--path=`"$usePath`""
# echo "--name=`"$useName`""
# echo "--skipLintChecks=true"
# echo "--unitTestRunner=vitest"

Invoke-Expression $command
}





They are all "smart" and will detect which type of package based on the target provided

all pathing is a variable that correctly generates to the correct package paths


1. **Nx Plugin** (`plugins/{plugin-name}`)
   - For the time being just provide a message of, "Not Implemented"

2. **Direct TSX Executed** (`libs/tools/{utility-name}`)
   - For the time being just provide a message of, "Not Implemented"
   
3. **Consumable Package: Shared Utility** (`libs/{utility-name}`)
   - For the time being just provide a message of, "Not Implemented"
  
4. **Consumable Package: Feature Utility Logic** (`packages/{feature-name}/{utility-name}`)
   - For the time being just provide a message of, "Not Implemented"
   
---   

5. **Consumable Package: Core Extension Feature Logic** (`packages/{feature-name}/core`)










paths are added to:
- packages/project-butler/core/


- PackageConfig
  - This is an orchestrator that will run all of the below 

- PackageConfig: Feat: Core: Test
  - **Generates a duplicate of**: 
    - vitest.config.ts
    - vitest.coverage.config.ts

- PackageConfig Feat: Core: TS
  - **Generates a duplicate of**: 
    - tsconfig.config.ts

- PackageConfig:project
  - **Generates a duplicate of**: 
    - project.json



---    
   
1. **Pre-Packaged Extension: Single Feature** (`packages/{feature-name}/ext`)

- pRootConfig:test
  - **Generates a duplicate of**: 
    - packages/project-butler/ext/vitest.config.ts
    - packages/project-butler/ext/vitest.coverage.config.ts
    
- PackageConfig:ts
  - **Generates a duplicate of**: 
    - packages/project-butler/ext/tsconfig.config.ts

- PackageConfig:project
  - **Generates a duplicate of**: 
    - packages/project-butler/ext/project.json

- PackageConfig:all basically an alias for just PackageConfig
  - This is an orchestrator that will run all of the above 






{feature-name}/
│
├─ _docs/
│  ├─ _{feature-name}_Actions-Log.md
│  └─ _{feature-name}_Task-Tracker.md
│
├─ core/
│  ├─ src/
│  │  ├─ _config/
│  │  │  └─ constants.ts
│  │  ├─ _interfaces/
│  │  ├─ services/
│  │  └─ index.ts
│  ├─ CHANGELOG.md
│  ├─ package.json
│  ├─ project.json
│  ├─ tsconfig.json
│  ├─ vitest.config.ts
│  └─ vitest.coverage.config.ts
│
└─ ext/
    ├─ assets/
    ├─ src/
    │  ├─ adapters/
    │  └─ index.ts
    ├─ CHANGELOG.md
    ├─ LICENSE.txt
    ├─ package.json
    ├─ project.json -> Config: Project 
    ├─ tsconfig.json -> Config: TS 
    ├─ vitest.config.ts -> Config: Vitest
    └─ vitest.coverage.config.ts -> Config: Vitest 





Each "name" in the drop down has the general format by tier of nesting: EG. Feat: Core: Config: Test

Feat (short for feature, generates the entire feature, both core and ext intial scaffold)
├─ Core (Generates all of the below, the entire core package)
│  ├─ Config (Generates all of the below)
│  │  ├─ Vitest 
│  │  ├─ Project
│  │  └─ TS
│  ├─ Test
│  │  ├─ 
│  │  ├─ Project
│  │  └─ TS
│









core's initial package.json
{
    "name": "@fux/dynamicons-core",
    "version": "0.1.0",
    "private": true,
    "main": "./dist/index.js",
    "module": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "exports": {
        ".": {
            "types": "./dist/index.d.ts",
            "import": "./dist/index.js",
            "default": "./dist/index.js"
        }
    },
    "dependencies": { },
    "devDependencies": { }
}




# vitest.config.ts

``` typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from '../../../vitest.functional.base'

export default mergeConfig(
    baseConfig,
    defineConfig({
        test: {
            setupFiles: ['./__tests__/__mocks__/globals.ts'],
            include: [
                './__tests__/functional-tests/**/*.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
            ]
        },
    }),
)
```


# vitest.coverage.config.ts

``` typescript
import { defineConfig, mergeConfig } from 'vitest/config'
import functionalConfig from './vitest.config'
import baseCoverageConfig from '../../../vitest.coverage.base'

export default mergeConfig(
    mergeConfig(functionalConfig, baseCoverageConfig),
    defineConfig({
        // Any package-specific overrides for coverage can go here
    }),
)
```
