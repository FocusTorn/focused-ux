# 1. Create from main

    git checkout main
    git pull origin main
    git checkout -b feature/dca/expand-nx-caching-usage

# Commit early and often - small, focused commits

    git add .
    git commit -m "feat: add initial implementation"
    git commit -m "test: add unit tests"
    git commit -m "fix: resolve edge case"

git branch

# Push feature branch (safe - won't affect main)

    git push origin feature/your-feature-name

### Pre-Merge Checklist

# Verify Current Status

git status
git branch --show-current

# Ensure All Changes Are Committed and Pushed

    git add .
    git commit -m "Final changes before merge"
    git push origin feature/dca/expand-nx-caching-usage

### Merge via Pull Request (Recommended)

# Create Pull Request

    Go to your Git hosting platform (GitHub, GitLab, etc.)
    Create a pull request from feature/dca/expand-nx-caching-usage to main
    Add a descriptive title and description
    Request code review if applicable

# Review and Merge

    Review the changes in the PR interface
    Run any CI/CD checks
    Merge when approved

### Direct Merge (Local)

# Switch to Main Branch

git checkout main
git pull origin main

# Merge Feature Branch

git merge feature/dca/expand-nx-caching-usage

# Push Changes

git push origin main

# Clean Up Feature Branch

git branch -d feature/dca/expand-nx-caching-usage
git push origin --delete feature/dca/expand-nx-caching-usage

Squash and Merge - If you want a clean history and the feature is complete
Create Merge Commit - If you want to preserve the development process
Rebase and Merge - If you want clean history but keep individual commits

Creating Pull Requests in VSCode
Method 1: GitHub Extension
Install "GitHub Pull Requests and Issues" extension
Sign in to GitHub
Use Command Palette (Ctrl+Shift+P)
Type "GitHub: Create Pull Request"
Follow the prompts
Method 2: Git Graph Extension
Install "Git Graph" extension
Open Git Graph view
Right-click on your feature branch
Select "Create Pull Request"
Method 3: Command Palette
Ctrl+Shift+P
Type "Git: Create Pull Request"
Select your branches
Add title and description
What VSCode Can't Do
Merge the PR (usually requires going to the web interface)
Advanced PR settings (like auto-merge, specific reviewers)
CI/CD status (though you can see basic status)
Best Workflow
Use VSCode for creating the PR and initial setup
Use web interface for final review and merge
Use VSCode for post-merge cleanup

git checkout main

git pull origin main

### Post-Merge Steps

git log --oneline -10

# 4. Create pull request

# Create PR from feature branch to main

# This allows review before merging

# Main branch remains protected

# 5. Merge via PR

# Option 1: Squash merge (recommended)

# Combines all commits into single commit

# Clean history, easy to revert

# Option 2: Regular merge

# Preserves commit history

# Creates merge commit

# 6. Clean up

git checkout main
git pull origin main
git branch -d feature/my-feature
git push origin --delete feature/my-feature
