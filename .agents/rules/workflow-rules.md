# Project Workflow & Execution Rules

## 1. Request Analysis & Mandatory Skill Check
- Before performing any work or writing code, systematically review and activate the most relevant downloaded skills:
  - **Design & UI changes**: MUST use `design-system-consistency`, `ui-ux-pro-max`, and `frontend-design`. Follow established design tokens (Editorial Runner Paper), never add breaking styles or heavy 3D/animation effects without approval.
  - **New features / Architecture**: Use `brainstorming`.
  - **Bugs / Unexpected behavior**: Use `systematic-debugging`.
  - **Credentials & API handling**: Use `security-and-hardening` and `credentials`.

## 2. Step-by-Step Execution Plan
- Clearly formulate the step-by-step approach before executing.
- Test and verify builds (`npm run build`) after modifying code.

## 3. Git Commit Protocol (Strict User Approval Required)
- Structure changes into clean, atomic commits.
- **NEVER execute `git commit` without explicit prior user approval.**
- Always propose the commit message and list of files to the user first.
- Write all commit messages in **simple English** (e.g., `feat: add shoe rotator with images`, `fix: adjust map zoom on current activity`).
- Wait for user validation before running `git commit`.
