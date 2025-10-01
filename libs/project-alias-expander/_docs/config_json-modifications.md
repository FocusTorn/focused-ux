# Modification Tracker for: config.json

This is a master list of modifications to the PAE config.json and the psudo code ideas/implementation

<!-- ------------------------------------------------------------------------------------------------ -->

## In Progress

### [ ] Testing and Validation <!-- Start Fold -->

Comprehensive testing to ensure all functionality works correctly and no regressions are introduced.

**Sub-tasks:**

- [ ] Test all variant combinations
- [ ] Verify continue execution for echoX
- [ ] Validate environment flag separation
- [ ] Unit tests for all variant combinations
- [ ] Integration tests for continue execution functionality
- [ ] Configuration tests for new `env-setting-flags` section
- [ ] End-to-end tests for complete echo workflow
- [ ] Performance tests to ensure no degradation

---

<!-- Close Fold -->

<!-- ------------------------------------------------------------------------------------------------ -->

## Not started

### [ ] Add a PAE build command that is non powershell module based <!-- Start Fold -->

The direct commands do not need to be in the powershell module, as they are only ever called with a pae prefix

- needs to process the expandable-flags and internal-flags to be able to use flag aliases with the direct command aliases

---

<!-- Close Fold -->

### [ ] Add New Config Object: internal-flags <!-- Start Fold -->

This would increase the functionality and clarity of the codebase and the config file by separating:

- flags that need to be expanded and included with the generated command
- flags that are processed internally and are not included in the generated command

```json
{
    // Accepts templates and expanded(-alias to --flag) > passed with the command
    "expandable-flags": {
        "bail": {
            "defaults": { "bailOn": 1 },

            // Ensure value is an int and a whole number
            "mutation": "Math.round(parseFloat(bailOn) || 0)",

            "template": "--bail {bailOn}"
        }
    },

    // Accepts templates and expanded(-alias to --flag) > processed before command is generated
    "internal-flags": {
        "sto": {
            "defaults": { "time": 10 }, // Can be in seconds or milliseconds

            // Ensures {time} is always in MS format
            "mutation": "time >= 100 ? time : parseInt(time.toString() + '000')",

            "assign": "{time}"
        }
    }
}
```

**Actions**: More than likely this will take no additional processing and would only need to make sure the config object is included in parsing for the flags

---

<!-- Close Fold -->

### [ ] Modify internal flags to use new structure <!-- Start Fold -->

This will help ensure that any non PAE command is not passed an unintentional flag.

```json
"internal-flags": {
    "v"  : "--verbose",
    "d"  : "--debug",
    "echo" : "--pae-echo"
}
```

**Actions**: Change the flag triggers to use the new flags

```json
"internal-flags": {
    "v"  : "--pae-verbose",
    "d"  : "--pae-debug",
    "echo" : "--pae-echo"
}
```

---

<!-- Close Fold -->

### [ ] Add new Key:Value pair: mutation <!-- Start Fold -->

This will allow modification and data validation dynamically without modifying the codebase.

```json
{
    // Accepts templates and expanded(-alias to --flag) > passed with the command
    "expandable-flags": {
        // [General] -alias expands to --flag, accepts templates
        "bail": {
            "defaults": { "bailOn": 1 },

            // Ensure value is an int and a whole number
            "mutation": "Math.round(parseFloat(bailOn) || 0)",

            "template": "--bail {bailOn}"
        }
    },

    // Accepts templates and expanded(-alias to --flag) > processed before command is generated
    "internal-flags": {
        "to": {
            // Can be in seconds or milliseconds
            "defaults": { "time": 10000 },

            // Ensures {time} is always in MS format
            "mutation": "time >= 100 ? time : parseInt(time.toString() + '000')",

            "template": "--pae-execa-timeout={time}"
        }
    }
}
```

**Actions**:

1. Add a `mutation` key that will be used to mutate the input variable prior to expanding the template

This would be a optional key, in which it would only have an effect if it existed in the objects:

- expandable-flags
- expandable-templates

**Example 1**:

EG, in `bail`:

It would:

- use the default if none were passed using the CLI, EG `-bail` would become `--bail 1`
    - It would not need to look for the existance of `mutation`, as the default is being used.
- or the passed flag value, EG `-bail=5` would:
    1. If the `mutation` key does not exist, skip to 3.
    2. If the `mutation` key does exist, use the value:string to mutate the variable
    3. Expand the template.

Since this is in `expandable-flags` it would be included in the executed command so

After expansion the complete flag passed with the command would be `--bail 5`

**Example 2**:

EG, in `to`:

It would do either:

- Use the default if none were passed using the CLI, EG `-to` would become `--pae-execa-timeout=10000`
    - It would not need to look for the existance of `mutation`, as the default is being used.
- Use the passed flag value, EG `-to=5` would:
    1. If the `mutation` key exists use the value:string to mutate the variable
    2. If the `mutation` key does not exist, do nothing
    3. Expand the template.

Since this is in `internal-flags` it would be processed by PAE and not included in the executed command, so:

After expansion the complete flag that is sent to PAE would be, `--pae-execa-timeout=10000`

---

<!-- Close Fold -->

<!-- ------------------------------------------------------------------------------------------------ -->

## Future Enhancement

### [ ] Add alias specific help <!-- Start Fold -->

**Request**: Implement a alias specific help.

**Description**: Running `pae pbc -h` should show the available aliases, based upon which alises map to a existant executable. It would need to check what exists as a target flag as well as what flags are applicable.

**Notes**: If this causes to much overhead, may need to evauate ore efficient ways to structure.

---

<!-- Close Fold -->

 <!-- ------------------------------------------------------------------------------------------------ -->

## Completed

### [x] Create a standardized --help flag <!-- Start Fold -->

**Request**: The primary flag to view the help output needs to be `--help`

**Description**: Running:

1. `pae help` would be depreciated and would show an error stating such
2. `pae --help` would directly trigger main PAE help output
3. `pae -h` would expand due to the `"h"  : "--help",` within `internal-flags`

**Resolution**:

- ✅ Implemented `--help` flag as primary help trigger
- ✅ Added `-h` flag support via internal-flags expansion
- ✅ Added deprecation warning for `pae help` command
- ✅ Updated help text to show new flag options
- ✅ Fixed duplicate help display issue
- ✅ Enhanced fallback help with detailed error information

---

<!-- Close Fold -->

### [x] Investigate the possibilitiy of duplicate execution <!-- Start Fold -->

**Request**: Need to investigate the possbilitiy of any duplicate execution calls, or any other unintentional issues with command execution flow.

**Description**:

1. The time from the inital cli execution to when the command starts seems longer than it should.
2. Errors intermittantly pop up with the config.json object not being processed correctly even though the configuration key:value is aligned with the syntax and structure required.

Both of these point to bugs in how the execution flows from one portion to another.

**Resolution**:

- ✅ Fixed duplicate configuration loading - config was being loaded twice causing performance issues
- ✅ Fixed recursive command execution issue where 'aka help' tried to run non-existent nx target
- ✅ Optimized execution flow to reduce time from CLI execution to command start
- ✅ Added special handling for help command with package aliases
- ✅ Implemented standardized --help flag with deprecation warning for pae help
- ✅ Enhanced fallback help with detailed error information and troubleshooting steps

---

<!-- Close Fold -->

### [x] env-setting-flags Configuration Structure <!-- Start Fold -->

Create a new `env-setting-flags` section in the PAE configuration to separate environment-setting flags from other internal flags. This section will contain:

- `"v"`: `"--pae-verbose"`
- `"db"`: `"--pae-debug"`
- `"echo"`: `"--pae-echo"`

These flags trigger environment variables before any expansion or execution happens, so they require separate handling from other internal flags like `sto` and `h`.

**Sub-tasks:**

- [x] Create `env-setting-flags` section in PAE config
- [x] Move `v`, `db`, `echo` flags to new section
- [x] Update flag processing logic to handle new section

---

<!-- Close Fold -->

### [x] Echo Enhancement <!-- Start Fold -->

Extend the existing `--pae-echo` functionality to support variants and add a new `--pae-echoX` flag:

- **New Flag**: `--pae-echoX` - Shows echo output then continues with command execution
- **Variant Support**: Both `--pae-echo` and `--pae-echoX` support variants via `--pae-echo="{variant}"` or `--pae-echoX="{variant}"`

**Sub-tasks:**

- [x] Add `--pae-echoX` flag with continue execution
- [x] Implement variant support for both echo flags
- [x] Add variant parsing and validation

---

<!-- Close Fold -->

### [x] Pseudo Execution Variants <!-- Start Fold -->

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

**Sub-tasks:**

- [x] Implement 6 echo variants (short-in, long-in, global-in, short-out, long-out, global-out)
- [x] Add variant-specific output formatting
- [x] Implement default behavior (show all variants)


---

**Discussion**:

if I run aka b -echo

and get 

[short-in] -> nx run @fux/project-alias-expander:build
[long-in] -> nx run @fux/project-alias-expander:build
[global-in] -> nx run @fux/project-alias-expander:build
[short-out] -> nx run @fux/project-alias-expander:build
[long-out] -> nx run @fux/project-alias-expander:build
[global-out] -> nx run @fux/project-alias-expander:build


[short-in] -> nx run @fux/project-alias-expander:build
would mean that the alias gets expanded before even getting to the shorthand profile function

[long-in] -> nx run @fux/project-alias-expander:build
would mean that the alias at some poiunt was processed by the using the pae call

[global-in] -> nx run @fux/project-alias-expander:build
would mean that the alias at some poiunt was already expanded whenit was passed to the global

[short-out] -> nx run @fux/project-alias-expander:build
would mean that the alias was expanded by the shorthand profile function

[long-out] -> nx run @fux/project-alias-expander:build
would mean that the alias was expanded by the pae function call

[global-out] -> nx run @fux/project-alias-expander:build
This is correct


Truthfully, since the long for is the same as the global... since when you call it using the pae you are actually calling directly to the global, we can remove all instances of the longin and long out.

and

when the --pae-echo since it is a using an env variable, the messaging would be inline with the execution

Each of the output statements needs to occur at the time the are recieved and generated/executed not an estimation of what they SHOULD be...

When you type aka b:

**Chain**: `aka b` → `PowerShell alias → Invoke-aka → pae aka b` → `PAE CLI` → `Nx build`

1. PowerShell resolves `aka` to `Invoke-aka` via the alias specific profile function
   - at this point it should output the 
     - [short-in] -> aka {arguments passed}
     - because aka was recieved as the incoming alias by the shorthand profile function
    
2. Invoke-aka runs with $Arguments = ['b'] and calls `pae aka {arguments}` → pae aka b
   - at this point it should output the 
     - [short-out] -> {literal-command-sent-to-pae}
     - This shows what the actual profile function creates as the call that is sent to the global pae

3. The PAE CLI recieves the command `pae aka b` that was sent from the profile function
   - at this point it should output the 
     - [global-in] -> {literal-command-recieved-by-pae}
     - This shows what the actual cli recieved as the call

4. The PAE CLI processes the alias `pae aka b` and runs the `nx run @fux/project-alias-expander:build`
   - at this point it should output the 
     - [global-out] -> nx run @fux/project-alias-expander:build
     - This shows what the actual cli expanded the alias to in order to execute

for instance

`aka b --pae-echo="short-in"` would show `[short-in] -> aka b` then exit
`aka b --pae-echo="short-out"` would show `[short-out] -> aka b` then exit

`aka b --pae-echo="global-in"` would show `[global-in] -> aka b` then exit
`aka b --pae-echo="global-out"` would show `[global-out] -> nx run @fux/project-alias-expander:build` then exit 
 
`aka b --pae-echo` or `aka b --pae-echo=''` would show all 6 then exit



`pae aka b --pae-echo="short-in"` would show `[short-in] -> aka b` then exit
`pae aka b --pae-echo="short-out"` would show `[short-out] -> aka b` then exit
 
`pae aka b --pae-echo="global-in"` would show `[global-in] -> aka b` then exit
`pae aka b --pae-echo="global-out"` would show `[global-out] -> nx run @fux/project-alias-expander:build` then exit 
 
`aka b --pae-echo` or `aka b --pae-echo=''` would show all 6 then exit



---

<!-- Close Fold -->
