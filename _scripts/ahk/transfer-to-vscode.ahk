#Requires AutoHotkey v2.0

class AiCodeTransfer {
    SEPARATOR := "---FUX_AI_AGENT_SEPARATOR---"

    ; This is the main entry point for the hotkey.
    TransferFromAiInterface() {
        ; 1. Extract the breadcrumb and code from your AI's UI.
        ;    This part is specific to your AI interface.
        local breadcrumb := this.GetBreadcrumbFromUI()
        local code := this.GetCodeBlockFromUI()

        if (breadcrumb = "" or code = "") {
            MsgBox "Failed to extract breadcrumb or code."
            return
        }

        ; 2. Serialize the data into a single payload string.
        local payload := breadcrumb . this.SEPARATOR . code

        ; 3. URL-encode the payload to make it safe for a URI.
        local encodedPayload := this.EncodeUriComponent(payload)

        ; 4. Construct the full vscode:// URI.
        local publisher := "NewRealityDesigns"
        local extensionId := "ai-agent-interactor"
        local command := "transfer"
        local uri := "vscode://" . publisher . "." . extensionId . "/" . command . "?data=" . encodedPayload

        ; 5. Execute the URI. This is the only action needed.
        ;    Windows will route this to the running VS Code instance.
        Run(uri)
    }

    ; --- UI-Specific Helpers (You must adapt these) ---

    GetBreadcrumbFromUI() {
        ; This is a placeholder for your logic from _ExtractDataFromAIInterface
        ; It should grab the line like: 〖REPLACE〗path/to/file.ext 🔸 MyClass ► myMethod
        MouseGetPos(&mX, &mY)
        Click(2)
        Sleep(50)
        SendInput("+{End}")
        Sleep(100)
        local originalClipboard := A_ClipboardAll
        A_Clipboard := ""
        SendInput("^c")
        ClipWait(1)
        local breadcrumb := A_Clipboard
        A_Clipboard := originalClipboard
        MouseMove(mX, mY)
        return Trim(breadcrumb)
    }

    GetCodeBlockFromUI() {
        ; This is a placeholder for your logic to get the code.
        ; It might involve clicking a "copy" button on the code block.
        MouseGetPos(&mX, &mY)
        local originalClipboard := A_ClipboardAll
        A_Clipboard := ""
        MouseClick("Left", 191, mY - 60, 1, 0) ; Your original coordinates
        ClipWait(3)
        local code := A_Clipboard
        A_Clipboard := originalClipboard
        MouseMove(mX, mY)
        return code
    }

    ; --- URI Encoding Helper ---

    EncodeUriComponent(str) {
        local result := ""
        Loop CStr(str) {
            local char := A_LoopChar
            if RegExMatch(char, "[0-9a-zA-Z-_.!~*'()]") {
                result .= char
            } else {
                result .= Format("%{:02X}", Ord(char))
            }
        }
        return result
    }
}

; === Example Hotkey ===
; F1:: {
;     static transferAgent := AiCodeTransfer()
;     transferAgent.TransferFromAiInterface()
; }