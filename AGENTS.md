# Agent Instructions & Guidelines

## 1. In-Context Memory (ICM) Navigation
- Before performing sweeping refactors or structural additions, inspect the architecture graph in `Documents/ObsidianVault/CodeMaps/<project-name>/` or query with `graphify query "<topic>"`.
- Do not brute-force grep raw dependencies; leverage the existing class/function relational maps to minimize context consumption.
- Keep the architecture notes updated whenever you introduce a new core service or module.

## 2. Design & Frontend Implementation (Taste-Skill)
- Adhere strictly to the `design-taste-frontend` rules.
- Avoid repetitive AI card patterns; craft deliberate visual hierarchies with balanced bento compositions.
- Ensure typographic balance: enforce `max-w-prose` on paragraphs and apply `tabular-nums` on all metrics.
- All interactive controls must implement accessible focus states and smooth spring micro-interactions.
