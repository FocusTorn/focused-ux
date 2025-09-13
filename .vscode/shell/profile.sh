# FocusedUX Git Bash profile
# Loads Project Alias Expander (PAE) functions and sets the FUX prompt

# Prevent double-loading
if [ -n "$FUX_BASH_PROFILE_LOADED" ]; then
    return 0
fi
export FUX_BASH_PROFILE_LOADED=1

# Locate workspace root by finding nx.json
_fux_find_workspace_root() {
    local dir
    dir="$(pwd)"
    while [ "$dir" != "/" ] && [ ! -f "$dir/nx.json" ]; do
        local parent
        parent="$(dirname "$dir")"
        [ "$parent" = "$dir" ] && break
        dir="$parent"
    done
    if [ -f "$dir/nx.json" ]; then
        echo "$dir"
    else
        echo ""
    fi
}

FUX_WORKSPACE_ROOT="$(_fux_find_workspace_root)"

# Setup PAE CLI path if we're inside the workspace
if [ -n "$FUX_WORKSPACE_ROOT" ]; then
    PAE_CLI_PATH="$FUX_WORKSPACE_ROOT/libs/project-alias-expander/dist/cli.js"
fi

# Define a pae shim so pae works even if not installed globally
pae() {
    if [ -n "$PAE_CLI_PATH" ] && [ -f "$PAE_CLI_PATH" ]; then
        node "$PAE_CLI_PATH" "$@"
    else
        command pae "$@"
    fi
}

# Helper to invoke pae alias directly (for shorthand functions)
_invoke_pae_alias() {
    local alias_name="$1"; shift
    if [ -z "$FUX_WORKSPACE_ROOT" ]; then
        echo "Could not find workspace root (nx.json not found)" 1>&2
        return 1
    fi
    if [ ! -f "$PAE_CLI_PATH" ]; then
        echo "PAE CLI not found at: $PAE_CLI_PATH" 1>&2
        echo "Run 'nx build project-alias-expander' to generate the module" 1>&2
        return 1
    fi
    node "$PAE_CLI_PATH" "$alias_name" "$@"
}

# Dynamically create shorthand functions for all configured aliases
_fux_define_pae_alias_functions() {
    [ -z "$FUX_WORKSPACE_ROOT" ] && return 0
    local aliases
    aliases=$(node -e '
        const fs = require("fs");
        const path = require("path");
        let dir = process.cwd();
        while (dir && !fs.existsSync(path.join(dir, "nx.json"))) {
            const parent = path.dirname(dir);
            if (parent === dir) break;
            dir = parent;
        }
        try {
            const cfg = JSON.parse(fs.readFileSync(path.join(dir, "libs/project-alias-expander/config.json"), "utf8"));
            const list = Object.keys(cfg.packages || {});
            process.stdout.write(list.join(" "));
        } catch (e) { /* ignore */ }
    ' 2>/dev/null)

    for a in $aliases; do
        eval "${a}() { _invoke_pae_alias $a \"\$@\"; }"
    done
}

_fux_define_pae_alias_functions

# Friendly startup messages (match PowerShell style)
printf "\e[32mFocusedUX project profile loaded.\e[0m\n"
if [ -n "$FUX_WORKSPACE_ROOT" ] && [ -f "$PAE_CLI_PATH" ]; then
    printf "\e[32m  - Module loaded: PAE aliases \e[0m\n"
fi

# Prompt: show FUX + relative path when inside the workspace
_fux_update_prompt() {
    local cwd rel
    cwd="$(pwd)"
    if [ -n "$FUX_WORKSPACE_ROOT" ] && [[ "$cwd" == "$FUX_WORKSPACE_ROOT"* ]]; then
        rel="${cwd#"$FUX_WORKSPACE_ROOT"}"
        if [ -z "$rel" ]; then
            PS1="\[\e[38;5;45m\]FUX />\[\e[0m\] "
        else
            PS1="\[\e[38;5;45m\]FUX $rel />\[\e[0m\] "
        fi
    else
        # Default bash-like prompt when outside the workspace
        PS1='\u@\h \w \$ '
    fi
}

PROMPT_COMMAND=_fux_update_prompt


