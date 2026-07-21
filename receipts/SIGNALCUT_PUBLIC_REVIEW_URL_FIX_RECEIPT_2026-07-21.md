# SignalCut Public Review URL Fix Receipt - 2026-07-21

- Agent: ORION_L
- Status: `ACCEPTED_AND_DEPLOYED`
- Scope: judge-facing public Review Desk repair only
- Decision: replace the hard-coded local review address with the active
  deployment root.

## Artifact

- Decision note:
  `docs/openai-build-week/SIGNALCUT_PUBLIC_REVIEW_URL_FIX_2026-07-21.md`
- Source patch:
  `review/signalcut-desk/src/App.tsx`
- Public Review Desk: https://peanuts1605.github.io/signalcut/
- Repository commit: `bb1631ab24bbe17c2090e61455c3e898eab05f2a`

## Checks

```text
uv run pytest -q                              12 passed
uv run ruff check .                           passed
review/signalcut-desk npm run check           passed
VITE_BASE_PATH=/signalcut/ npm run build      passed
render/threadloom-preview npm test            passed
render/threadloom-preview npm run lint        passed
GitHub Pages Actions run 29792333890           passed
public desktop + 390px mobile replay          passed
```

The live post-deploy replay confirmed that **Show review link** displays
`https://peanuts1605.github.io/signalcut/`, not the local Vite address.

## Shared Proof Reconciliation

- Drive mirror: pending
- Notion pointer: pending
- Reconciled receipt mirror: pending

## Blockers

None for the repair. Devpost finalization still requires the entrant's true
personal declarations and legal rule acceptance; no final submission was made.
