reco:plugin
@fux/recommended:plugin:add-app
would ceate a new standalone application style plugin
- would take an argument for the application name (and default to ./plugins) 
  - if name already exists in ./plugins say so, and exit, else generate the plugin structure



@fux/recommended:plugin:add-executor
@fux/recommended:plugin:add-generator
- would take an argument for the plugin name (and default to ./plugins) 
  - if name already exists in ./plugins say so, and exit, else generate the plugin structure
- would take an argument for the added functionalies name
  - if name already exists in the plugin say so, and exit, else generate the plugin structure
- would be great (if even possible):
  - scaffold and stage for multiple variations(eg audit structure)

- the tsconfig.json would be a duplicate of plugins/vpack/tsconfig.json, 
- the project.json would be a duplicate of plugins/vpack/project.json, 
  - except for the pathing references the correct name






























## Test Structure

📁 __tests__
    📁 __mocks__
        📄 _readme.md
        📄 globals.ts
        📄 helpers.ts
        📄 mock-scenario-builder.ts
    📁 _reports
        📁 coverage
    📁 coverage-tests
        📄 _readme.md
        📄 trial-coverage-test.test-cov.ts
    📁 functional-tests
        📄 _readme.md
    📁 isolated-tests
        📄 _readme.md
    📄 README.md
    
    
    
The _readme will contain details as to the tests inside, but at the beginning of each it should explain the purpose of the test directory

- mocks shared mocking, not 100% needed for one off single mocks needed by a test file
- coverage-tests are soley to increase the coverage report % covered
- functional-tests are the main vitest test suites, and can be broken down into sub folders if test suite gets to large
- isolated-tests are ADHOC one off tests that are not ran when running the main tests

