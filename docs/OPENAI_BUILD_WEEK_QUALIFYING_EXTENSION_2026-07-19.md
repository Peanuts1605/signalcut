# SignalCut Build Week Qualifying Extension

## Product truth

Hackathon builders can assemble a beautiful demo from real screenshots and still
make claims the evidence does not support. SignalCut Review Mode keeps the
claim, its attached source, and its publishing decision in one place before the
cut goes public.

## New behavior added on July 19

1. Project input can declare named publishing claims and their exact evidence
   asset IDs.
2. The editorial engine creates a `claim-ledger.json` with an explicit outcome
   for every claim: `evidence_linked` or `needs_evidence`.
3. A claim with no source or an unknown source never passes. The publishing
   decision becomes `NEEDS_PROOF` until every declared claim is linked.
4. The Review Desk adds a Claim Review screen where a builder can inspect the
   claim, decision, source filenames, and a clear reason before publishing.

## Truth boundary

SignalCut verifies explicit evidence linkage. It does not claim to infer that
an image semantically proves a statement. The human reviewer sees the source
and makes that final judgment.

## Judge test

1. Run `uv run pytest -q` from the repository root.
2. Run `uv run signalcut story fixtures/threadloom/project.json --out artifacts/threadloom`.
3. Run `npm run check` from `review/signalcut-desk`.
4. Open the Review Desk, choose **Claim review**, and confirm that the
   deliberately unsupported solo-play claim is marked **Needs evidence**.

## Build Week evidence

The baseline proof-first editorial pipeline was built before Build Week. This
claim-review feature, its tests, UI, and qualifying documentation are the
post-July-13 extension to evaluate.
