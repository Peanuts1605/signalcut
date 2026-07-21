# SignalCut Public Review URL Fix - 2026-07-21

## Decision

`ACCEPTED_AND_DEPLOYED`

SignalCut's judge-facing **Show review link** control now shows the active
deployment root instead of a hard-coded local development address.

## Why it mattered

The public Review Desk previously rendered `http://127.0.0.1:4173` after a
judge clicked **Show review link**. That address is correct only during local
development and reads as a broken handoff on the public GitHub Pages build.

## Change

`review/signalcut-desk/src/App.tsx` derives the displayed address from the
Vite base path and `window.location.origin`.

- Local Vite: the local root remains visible during local development.
- GitHub Pages: `https://peanuts1605.github.io/signalcut/` is displayed.

No review logic, claim ledger, evidence bundle, video, or submission copy
changed.

## Verification

Local checks:

```text
uv run pytest -q                 12 passed
uv run ruff check .              passed
review/signalcut-desk npm check  passed
VITE_BASE_PATH=/signalcut/ npm run build  passed
render/threadloom-preview npm test + npm run lint  passed
```

Live replay at https://peanuts1605.github.io/signalcut/ verified:

1. Desktop and 390px mobile Claim review show `Needs proof`, `2 linked`, and
   `1 missing` for the deliberately unsupported solo-play claim.
2. The 390px layout has no horizontal overflow.
3. Evidence, Stories, Claim review, Preview, and Receipt tabs render.
4. Story selection, video play/pause, cue seek, unmute, and receipt hash
   controls change state as intended.
5. **Show review link** now displays
   `https://peanuts1605.github.io/signalcut/`.
6. Browser console reported no warnings or errors during the replay.

## Deployment

- Commit: `bb1631ab24bbe17c2090e61455c3e898eab05f2a`
- GitHub Actions run: https://github.com/Peanuts1605/signalcut/actions/runs/29792333890
- GitHub Pages deployment: passed

## Submission state

SignalCut remains a Devpost draft pending only the entrant's truthful personal
declarations, rule acceptance, and final Submit action. The saved `/feedback`
reference remains the exact Claim Review task:
`019ee0dc-d43c-7160-82ca-0cf8120952a8`.
