# Project Onboarding Command (Prime)

**Purpose**: Run this when starting a new coding session to quickly understand the project’s standards, plan, and structure so you can begin implementation immediately.

## Instructions

Execute the following steps in order:

1) Read AI Documentation in `ai_docs/`
- `ai_docs/docs/` (patterns and standards):
  - `01-handbook.md`
  - `02-playbooks-and-templates.md`
  - `CHANGE_SPEC.md`
- `ai_docs/phases/` (phased implementation roadmap):
  - `phase1.md` → `phase7.md`
- `ai_docs/spec/` (true specifications over the application):
  - `prd.md`
  - `system_architecture_and_api.md`
  - `generation_engine_and_external_service.md`
  - `data_and_storage.md`
  - `ops_runbook.md`, `testing_and_quality_minimal.md`, `ux_ui.md`, `config_and_plans.md`

2) Explore the project tree (robust, no-setup options)
- Preferred (zero-install via npx):
  ```bash
  npx --yes tree-cli -L 2 -I "node_modules|.next|.git|dist|build|coverage|.turbo"
  ```
- Alternative (if the above fails):
  ```bash
  npx --yes -p tree-node-cli treee -L 2 -I "node_modules|.next|.git|dist|build|coverage|.turbo"
  ```
- Deeper view when needed:
  ```bash
  npx --yes tree-cli -L 3 -I "node_modules|.next|.git|dist|build|coverage|.turbo"
  ```
- macOS-safe fallback (no extra packages):
  ```bash
  find . -E \
    -not -path './node_modules/*' \
    -not -path './.git/*' \
    -not -path './.next/*' \
    -not -path './dist/*' \
    -not -path './build/*' \
  | awk -F/ 'NF<=3' | sed 's|^\./||' | sort
  ```

3) Get ready to implement
- Skim top-level domains after the tree to anchor your mental model: `app/`, `components/`, `libs/`, `migrations/`, `types/`, `public/`, `ai_docs/`.
- With this understanding, proceed directly to the next implementation task.

## Expected Outcome

After completing these steps, you should have:
- Clear grasp of patterns/standards, phased plan, and true specs in `ai_docs/`
- Practical overview of the repository structure with noisy folders ignored
- Shared vocabulary for fast execution on subsequent implementation tasks