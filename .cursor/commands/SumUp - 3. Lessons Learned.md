# Extract - Lessons Learned

## Command Purpose

Extract key learning patterns, solutions, and insights from the current conversation and format them as actionable lessons for future reference.

## Execution Instructions

### When to Use

- After completing a complex debugging session
- When new testing patterns or solutions are discovered
- When architectural decisions or best practices emerge
- When troubleshooting reveals undocumented patterns

### Command Format

```
/extract-lessons
```

### What to Extract

#### 1. **Learning Patterns**

For each significant discovery, extract:

- **Learning**: What was discovered or learned
- **Pattern**: The specific technique, approach, or solution
- **Implementation**: How it was implemented (if applicable)
- **Benefit**: Why this approach is better
- **Not documented**: What gaps exist in current documentation

#### 2. **Categories to Focus On**

- **Testing Patterns**: New testing techniques, mocking strategies, coverage approaches
- **Architecture Decisions**: Package structure, build configurations, dependency management
- **Troubleshooting Solutions**: Error resolution, debugging techniques, common pitfalls
- **Documentation Gaps**: Missing patterns, undocumented behaviors, knowledge gaps
- **Tool Integration**: New tool usage patterns, configuration discoveries

#### 3. **Format Template**

```
**Category Name**
Learning: [What was discovered]
Pattern: [The specific technique or approach]
Implementation: [How it was implemented] (if applicable)
Benefit: [Why this approach is better]
Not documented: [What gaps exist in current documentation]
```

#### 4. **Context Requirements**

- Reference the specific conversation context
- Include file paths, line numbers, or code snippets when relevant
- Mention the problem that led to the discovery
- Note any tools, commands, or processes used

#### 5. **Quality Criteria**

- Each lesson should be actionable and reusable
- Focus on patterns that could apply to similar situations
- Prioritize discoveries that aren't already documented
- Include both the "what" and the "why"

### Example Output Format

```
## Lessons Learned from [Context/Conversation]

### Global Mock Placement for Node.js Built-ins
Learning: Moving node:child_process mock to global setup (globals.ts) resolves ESLint errors and provides better consistency
Pattern: Global mocks in globals.ts for Node.js built-ins that multiple tests need
Benefit: Eliminates require() statements in tests that cause ESLint violations
Not documented: While the docs mention global mocks, they don't specifically address this ESLint issue with require() statements

### Environment Variable Control for Shell Output
Learning: PowerShell and Bash scripts can be controlled via environment variables to suppress output during tests
Pattern: Wrap shell script output commands with conditional checks based on ENABLE_TEST_CONSOLE environment variable
Implementation: Both PowerShell (Write-Host) and Bash (echo) commands need conditional wrapping
Not documented: The docs don't mention controlling shell script output during tests
```

### Execution Notes

- Review the entire conversation for patterns and discoveries
- Focus on solutions that required multiple iterations to solve
- Extract both successful patterns and failed approaches that provided learning
- Include any "aha moments" or breakthrough insights
- Note any tools or techniques that were particularly effective

### Output Location

- Delete existing `.cursor/ADHOC/_Extracted-Lessons.md` file
- Save extracted lessons to `.cursor/ADHOC/_Extracted-Lessons.md`
- Display the extracted lessons in the chat
- Format for easy copy-paste into documentation or knowledge bases

### Final Display Format

After saving to file, display a markdown code block with the lessons formatted as:

```markdown
# [Lesson Category Name]

- Learning: [What was discovered]
- Pattern: [The specific technique or approach]
- Implementation: [How it was implemented] (if applicable)
- Benefit: [Why this approach is better]
- Not documented: [What gaps exist in current documentation]

- **Response**: ✏️❓❌⚠️✅ No action required

---

# [Next Lesson Category Name]

- Learning: [What was discovered]
- Pattern: [The specific technique or approach]
- Implementation: [How it was implemented] (if applicable)
- Benefit: [Why this approach is better]
- Not documented: [What gaps exist in current documentation]

- **Response**: ✏️❓❌⚠️✅ No action required

---
```

**Note**: The response lines with icons are only for the summary display block, NOT for the saved markdown file. The saved file should contain only the lesson content without response lines.

### Response Icon System

Each lesson in the summary display block includes a response line with icons that represent different types of feedback:

- ✅ **No action required**: Lesson is complete and documented, no further action needed
- ✏️ **Change made by user**: Description of change made by the user to implement the lesson
- ❓ **Question asked**: Question asked that requires an answer from the AI agent
- ⚠️ **Action required by AI Agent**: Specific action that needs to be taken by the AI agent
- ❌ **Problem with implementation**: Description of problem with correction implementation that needs to be reviewed

**Usage**: When providing feedback on lessons in the summary display block, replace "No action required" with the appropriate icon and description. This allows the AI agent to understand what type of response is needed for each lesson. The saved markdown file should NOT contain these response lines.

### Execution Steps

1. **Clear existing file**: Delete `.cursor/ADHOC/_Extracted-Lessons.md` file
2. **Extract lessons**: Review entire conversation for patterns and discoveries
3. **Format lessons**: Use the template format for each lesson
4. **Save to file**: Write to `.cursor/ADHOC/_Extracted-Lessons.md`
5. **Display summary**: Show formatted lessons in markdown code block

