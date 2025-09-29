# Modification Tracker for: config.json

This is a master list of modifications to the PAE config.json and the psudo code ideas/implementation

<!-- ------------------------------------------------------------------------------------------------ -->

## In Progress

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
