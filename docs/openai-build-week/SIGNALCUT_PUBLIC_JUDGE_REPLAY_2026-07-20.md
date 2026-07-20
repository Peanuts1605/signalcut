# SignalCut Public Judge Replay

**Checked:** 2026-07-20  
**Public app:** https://peanuts1605.github.io/signalcut/  
**Scope:** fresh public user-path replay, no local source substitution

## Passed interactions

1. **Claim review** opens the release decision and shows `Needs proof` with
   `2 linked · 1 missing`.
2. The deliberate unsupported claim, **The game supports solo play**, is
   visibly marked `Needs evidence` and instructed to stay out of the cut.
3. **Evidence** opens seven source screens with role, dimensions, and short
   hashes.
4. **Receipt** opens the evidence-to-story-to-cut trace; `Show video hash`
   reveals the rendered video SHA-256.
5. **Stories** opens three candidate cuts. Selecting **Proof First** updates
   the active candidate and side-panel candidate hash while correctly retaining
   **Outcome First** as the rendered tie-break winner.

## Judge-first result

A reviewer can reach the product's core truth without narration: unsupported
claims do not turn green, linked sources remain inspectable, and the published
cut has a visible provenance trace.

## Harness limitation, not a product claim

The public replay's DOM states were verified on the normal desktop surface.
The browser harness did not apply its requested 390px viewport override and
timed out capturing a live screenshot, so this pass does not claim a fresh
mobile pixel replay. Existing mobile evidence remains separately recorded in
`docs/openai-build-week/signalcut-claim-review-mobile-390.png`.

## Decision

**PASS_DESKTOP_PUBLIC_REPLAY.** No behavior change is required from this
replay. The next submission action is still the entrant-owned Devpost
declaration and rules acceptance.
