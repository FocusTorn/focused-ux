# Extract - Lessons Learned

## Command Purpose

Extract key learning patterns, solutions, and insights from the current conversation and format them as actionable lessons for future reference.

## Usage Description

When you receive the output from this command, the **Response** lines indicate how you should interact with each lesson. The AI Agent will use these exact icons and descriptions:

### Response Icon Meanings

**✏️ {My description}**
This icon represents that I made the proposed changes, and that the AI should peer review the changes made to ensure it is done so the best way possible and there are no other issues.

**❓ {My question}**
This is a direct question, any other item is not to be addressed, and all questions should be answered one at a time. If there are more than one question in the document, the AI is to fully answer the first question only. I will state something along the lines of, "ok next question", etc. when it is time to move on to the next question.

**❌ {My redirection}**
This is when the AI's understanding is wrong, and I am providing the corrected understanding. The AI is then to re-evaluate what was implemented/changed in regards to this lesson, and ensure that changes are correct according to the new understanding.

**⚠️ {Directive for AI to address}**
AI is to implement the changes described - execute the specific implementation instructions provided.

**✅ No action required**
The AI is to do nothing and there is no action that is to be taken for this item.

## Execution Instructions

### When to Use

- After completing a complex debugging session
- When new testing patterns or solutions are discovered
- When architectural decisions or best practices emerge
- When troubleshooting reveals undocumented patterns

### Command Format

```
/SumUp - 3. Lessons Learned
```

### What to Extract

#### 1. **Learning Patterns**

For each significant discovery, extract:

- **Learning**: [What was discovered or learned] Note: MANDATORY - Describe the key insight or discovery made during the work session
- **Pattern**: [The specific technique, approach, or solution] Note: MANDATORY - Document the exact method, strategy, or approach that was used to solve the problem
- **Implementation**: [How it was implemented (if applicable else "None")] Note: Include this section when specific implementation details are relevant to the lesson
- **Benefit**: [Why this approach is better] Note: MANDATORY - Explain the specific advantages, improvements, or positive outcomes achieved
- **Mistake/Assumption**: [What was wrong or incorrectly assumed] _Note: MANDATORY - Include this section for every lesson where the AI made errors, wrong assumptions, or incorrect implementations during the work session_
- **Correction**: [How it was fixed] _Note: MANDATORY - Include this section whenever Mistake/Assumption is included - describe exactly how the mistake was corrected_
- **Not documented**: [What gaps exist in current documentation (if applicable else "None")] Note: MANDATORY - Identify what knowledge, patterns, or processes are missing from current documentation

#### 2. **Categories to Focus On**

- **Testing Patterns**: New testing techniques, mocking strategies, coverage approaches
- **Architecture Decisions**: Package structure, build configurations, dependency management
- **Troubleshooting Solutions**: Error resolution, debugging techniques, common pitfalls
- **Documentation Gaps**: Missing patterns, undocumented behaviors, knowledge gaps
- **Tool Integration**: New tool usage patterns, configuration discoveries
- **Migration Strategies**: Legacy code removal, format transitions, architectural refactoring patterns
- **Error Correction Patterns**: Mistakes made, incorrect assumptions, failed approaches, and how they were corrected

#### 3. **Format Template**

```markdown
## [Lesson Category Name]

Learning: [What was discovered]
Pattern: [The specific technique or approach]
Implementation: [How it was implemented]

Benefit: [Why this approach is better]

**Not Documented**: [What gaps exist in current documentation]

**Mistake/Assumption**: [What was wrong or incorrectly assumed]
**Correction**: [How it was fixed] (if mistake/assumption exists)

- **Recommendation**:
    - [First recommended action to be taken to prevent this issue in the future]
    - [Second recommended action to be taken to prevent this issue in the future]

- **Response**: ✏️❓❌⚠️✅ No action required

---
```

#### 4. **Context Requirements**

- Reference the specific conversation context
- Include file paths, line numbers, or code snippets when relevant
- Mention the problem that led to the discovery
- Note any tools, commands, or processes used

#### 5. **Quality Criteria**

- Each lesson should be actionable and reusable
- Focus on patterns that could apply to similar situations
- Include both the "what" and the "why"

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

After saving to file, display the lessons in a markdown code block. The AI should output the entire summary wrapped in ```markdown code block tags with the content formatted as:

<!-- MANDATORY: Always start with this usage section -->

## Usage - Response Icon Meanings

**✏️ {My description}**
This icon represents that I made the proposed changes, and that the AI should peer review the changes made to ensure it is done so the best way possible and there are no other issues.

**❓ {My question}**
This is a direct question, any other item is not to be addressed, and all questions should be answered one at a time. If there are more than one question in the document, the AI is to fully answer the first question only. I will state something along the lines of, "ok next question", etc. when it is time to move on to the next question.

**❌ {My redirection}**
This is when the AI's understanding is wrong, and I am providing the corrected understanding. The AI is then to re-evaluate what was implemented/changed in regards to this lesson, and ensure that changes are correct according to the new understanding.

**⚠️ {Directive for AI to address}**
AI is to implement the changes described - execute the specific implementation instructions provided.

**✅ No action required**
The AI is to do nothing and there is no action that is to be taken for this item.

---

# [Lesson Category Name]

- Learning: [What was discovered]
- Pattern: [The specific technique or approach]
- Implementation: [How it was implemented] (if applicable)
- Benefit: [Why this approach is better]

- **Not documented**: [What gaps exist in current documentation]

- **Mistake/Assumption**: [What was wrong or incorrectly assumed]
- **Correction**: [How it was fixed] _Note: Only if Mistake/Assumption is displayed_

- **Recommendation**:
    - [AI Agent provides specific remediation recommendations to prevent this pitfall in the future]
    - [AI Agent provides specific remediation recommendations to prevent this pitfall in the future]

- **Response**: ✏️❓❌⚠️✅ No action required

---

# [Next Lesson Category Name]

- Learning: [What was discovered]
- Pattern: [The specific technique or approach]
- Implementation: [How it was implemented] (if applicable)
- Benefit: [Why this approach is better]
  
- **Not documented**: [What gaps exist in current documentation]

- **Mistake/Assumption**: [What was wrong or incorrectly assumed]
- **Correction**: [How it was fixed] _Note: Only if Mistake/Assumption is displayed_

- **Recommendation**:
    - [AI Agent provides specific remediation recommendations to prevent this pitfall in the future]
    - [AI Agent provides specific remediation recommendations to prevent this pitfall in the future]

- **Response**: ✏️❓❌⚠️✅ No action required

---

````

**CRITICAL OUTPUT REQUIREMENT**: The AI must wrap the entire output above in ```markdown code block tags so it can be copy-pasted directly. The output should start with ```markdown and end with ```.

**Note**: The response lines with icons are only for the summary display block, NOT for the saved markdown file. The saved file should contain only the lesson content without response lines.

**CRITICAL**: The **Response** line MUST be EXACTLY `- **Response**: ✏️❓❌⚠️✅ No action required`

### Recommendation Section

The **Recommendation** section is provided by the AI Agent executing the command and should contain specific remediation recommendations to prevent the documented pitfall from occurring in the future. This is where the AI Agent suggests proactive measures, process improvements, or documentation updates.

### Response Icon System

Each lesson in the summary display block includes a response line with icons that represent different types of feedback:

- ✅ **No action required**: Lesson is complete and documented, no further action needed
- ✏️ **Change made by user**: Description of change made by the user to implement the lesson
- ❓ **Question asked**: Question asked that requires an answer from the AI agent
- ⚠️ **Action required by AI Agent**: Specific action that needs to be taken by the AI agent
- ❌ **Problem with implementation**: Description of problem with correction implementation that needs to be reviewed

### Execution Steps

1. **Clear existing file**: Delete `.cursor/ADHOC/_Extracted-Lessons.md` file
2. **Extract lessons**: Review entire conversation for patterns and discoveries
3. **Format lessons**: Use the template format for each lesson
4. **Save to file**: Write to `.cursor/ADHOC/_Extracted-Lessons.md`
5. **Display summary**: Show formatted lessons in markdown code block

````

