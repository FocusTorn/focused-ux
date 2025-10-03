# Create Command Direct

## Purpose

Creates a directive command that forces the AI Coding Agent to execute any given task without stopping for progress summaries, commentary, or intermediate reporting. The AI agent must iterate continuously until the task is completely fulfilled, only stopping for critical decisions requiring user feedback.

## Usage

```
/Create- Command- Direct
```

Followed by any task description.

## Command Behavior

**MANDATORY EXECUTION PROTOCOL**:

1. **No Progress Summaries**: The AI agent MUST NOT provide summaries of progress, status updates, or intermediate reports
2. **No General Commentary**: The AI agent MUST NOT offer general observations, thoughts, or commentary during execution
3. **Continuous Iteration**: The AI agent MUST iterate continuously (run tests → fix failures → run tests → fix failures) until completion
4. **Only Two Stop Conditions**:
    - **Task Complete**: When the request has been completely fulfilled
    - **Critical Decision**: When a high-risk critical decision requires user feedback to proceed

## Command Structure

When this command is invoked, the AI agent receives the following mandatory directive:

```markdown
## CRITICAL EXECUTION DIRECTIVE

**AI Agent Directive**: You have been assigned a task that requires complete fulfillment without interruption.

**MANDATORY EXECUTION PROTOCOL**:

1. **NO STOPPING CONDITIONS**: You must NOT stop for:
    - Progress summaries
    - Status updates
    - Intermediate reporting
    - General commentary
    - Explanatory text
    - Meta-discussion about the work

2. **ONLY ACCEPTABLE STOPPING CONDITIONS**:
    - Task is completely fulfilled and finished
    - Critical high-risk decision requiring user input to proceed

3. **EXECUTION METHOD**:
    - Analyze the task
    - Begin execution immediately
    - Iterate continuously until completion
    - Fix failures as they arise
    - Run tests/fix/tests/fix until all green
    - Complete the task fully

**VIOLATION PENALTY**: Any deviation from this directive constitutes a critical failure. You must complete the assigned task through continuous iteration without any form of progress reporting or commentary.

**TASK**: [User's actual task description inserted here]
```

## Examples

### Example 1: Test Fixing

```
/Create- Command- Direct

Fix the tests in project-alias-expander. Iterate until all tests are green, EG... run tests, fix failures, run tests, fix failures etc
```

**AI Agent Behavior**: Runs tests → identifies failures → fixes code → runs tests → fixes remaining failures → continues until all tests pass → reports completion only.

### Example 2: Feature Implementation

```
/Create- Command- Direct

Implement user authentication in the ghost-writer package with JWT tokens and password hashing
```

**AI Agent Behavior**: Analyzes requirements → implements authentication service → adds JWT handling → implements password hashing → adds tests → fixes test failures → runs builds → fixes build issues → continues until feature is complete and tested → reports completion only.

### Example 3: Architecture Refactoring

```
/Create- Command- Direct

Refactor the dynamicons package to follow core/ext architecture pattern with proper separation of concerns
```

**AI Agent Behavior**: Analyzes current structure → creates core package → creates ext package → moves business logic → creates adapters → updates builds → fixes configuration → runs tests → fixes failures → continues until architecture is properly implemented → reports completion only.

## Implementation Requirements

### For AI Agent

1. **Immediate Analysis**: Analyze the task and begin execution immediately
2. **Continuous Iteration**: Maintain continuous work flow without stopping for explanations
3. **Failure Recovery**: When failures occur, fix them and continue working
4. **Completion Criteria**: Only stop when the task is completely fulfilled
5. **No Meta-Chat**: Do not discuss the process, methodology, or approach during execution

### For User

1. **Clear Task Definition**: Provide specific, actionable task descriptions
2. **Critical Decision Awareness**: Understand that AI may only stop for critical high-risk decisions
3. **Completion Recognition**: Acknowledge when AI reports completion
4. **Feedback Provisions**: Be prepared to provide guidance if critical decisions are needed

## Critical Decision Triggers

The AI agent may only stop and request user input for:

- **High-Risk Choices**: Decisions that could significantly impact system architecture
- **Breaking Changes**: Modifications that could affect other packages or users
- **Security Concerns**: Security-related decisions requiring expert human judgment
- **Configuration Conflicts**: When multiple valid approaches exist and choice affects future maintenance
- **Resource Allocation**: Decisions about performance vs. complexity trade-offs that require business input

## Completion Reporting

When the task is complete, the AI agent must provide:

```markdown
## TASK COMPLETED

[Brief description of what was accomplished]

Task has been fully implemented and all requirements have been satisfied.
```

## Error Handling

If the AI agent encounters errors during execution:

1. **Fix Immediately**: Address the error and proceed
2. **No Explanation**: Do not explain what went wrong or what was fixed
3. **Continue Iteration**: Maintain the continuous work flow
4. **Complete Task**: Ensure the original task requirements are still met

## Violations

**CRITICAL VIOLATIONS** that constitute protocol failure:

- Providing progress summaries or status updates
- Offering general commentary on the work being done
- Explaining methodology or approaches during execution
- Stopping for non-critical decisions
- Providing intermediate reports or check-ins
- Any form of meta-discussion about the task

## Benefits

- **Uninterrupted Focus**: AI agent maintains continuous focus on task completion
- **Efficient Execution**: No time spent on progress reporting or commentary
- **Iterative Problem Solving**: Continuous test/fix cycles until completion
- **Clear Completion Criteria**: Only stops when task is actually complete
- **User Control**: User maintains control over critical high-risk decisions

## Use Cases

**Perfect for tasks requiring:**

- Test fixing (run tests → fix → repeat)
- Bug resolution (identify → fix → test → repeat)
- Feature implementation (analyze → implement → test → refine → repeat)
- Architecture changes (refactor → test → fix → repeat)
- Performance optimization (measure → optimize → test → repeat)
- Documentation generation (analyze → write → validate → repeat)

**Not suitable for:**

- Exploratory tasks requiring user input at multiple decision points
- Creative tasks where iterative feedback is essential
- Tasks with high uncertainty requiring frequent clarification
- Learning exercises where user wants to understand the process

## Command Syntax

The command template creates a directive with this exact format:

> **AI Agent**: You have been assigned the following task. You must execute it completely without providing progress summaries, commentary, or stopping for non-critical decisions. Only stop when the task is complete or you need user input for a critical high-risk decision.
>
> **TASK**: [User's task description]
>
> Begin execution immediately and iterate until completion.

This directive ensures the AI agent maintains strict focus on task completion while preserving user control over critical decisions.
