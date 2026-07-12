# SignalCut MVP Design

Date: 2026-07-12
Owner: Orion_L
Decision: BUILD_PROOF_FIRST

## Product Thesis

SignalCut turns a product evidence pack into a short, judge-readable demo video
with a verifiable production receipt.

It is not a general video editor and it does not fabricate product behavior.
Real screenshots, recordings, links, and proof claims remain the spine of every
cut. Generative media may add narration, sound, or connective material, but it
must never replace evidence of the product actually working.

The first audience is small teams shipping hackathon entries, product launches,
and internal prototypes. Their problem is not a lack of editing software. It is
deciding what deserves screen time, what order makes the product understandable,
and whether the final demo proves its claims.

## Approaches Considered

### 1. AI screen recorder and editor

Capture a workflow, add zooms, captions, and voice automatically. This is useful
but crowded by Descript, Supademo, and similar products. It also starts too late:
the user must already know what story to record.

### 2. Prompt-to-demo generator

Generate an entire product demo from text or mockups. This is visually tempting
but weak for judging because it can invent screens or behavior that never existed.

### 3. Proof-first editorial pipeline

Ingest real evidence, build candidate stories, generate only supporting media,
render a deterministic cut, score judge clarity, and preserve provenance. This
is the selected approach because it solves the decision problem and makes
Backblaze B2 plus Genblaze central to the workflow.

## Core Workflow

The application opens directly into a working editorial surface.

1. **Evidence**
   The user adds product screenshots, short recordings, the product promise, the
   audience, the CTA, a maximum duration, and proof claims. SignalCut hashes each
   source and rejects unsupported file types or missing claims.

2. **Story**
   SignalCut proposes three beat sheets: Outcome First, Workflow First, and Proof
   First. Each beat names the source evidence it uses, on-screen copy, narration,
   and duration. A beat without evidence is visibly marked unsupported and cannot
   enter the final cut.

3. **Cut**
   The selected story passes through a Genblaze pipeline for generated narration
   and optional ambient audio. Remotion combines those assets with the real product
   evidence into a deterministic MP4. The UI streams progress by step.

4. **Receipt**
   SignalCut uploads sources, generated assets, the final MP4, and provenance
   manifests to Backblaze B2. The receipt shows source hashes, provider and model,
   prompts, run lineage, output hash, duration, clarity score, and verification.

## First Proof: Threadloom Cut

The first proof uses only public-safe Threadloom contest evidence already created
on this machine.

Inputs:

- The public-feed screenshot.
- The How to Play screenshot.
- The accepted-stitch screenshot.
- The reload-persistence screenshot.
- The second-view screenshot.
- Woven and Frayed mobile screenshots.
- The product promise and public playtest CTA.

Expected output:

- One Story Manifest with seven or fewer beats.
- A final duration between 45 and 60 seconds.
- Every beat references at least one hashed source.
- One generated narration track or an explicit silent-cut fallback.
- One MP4 with no blank frames and readable 1080p text.
- One Genblaze manifest that verifies successfully.
- Durable B2 URLs for the final video and its receipt.

The existing hand-built Threadloom demo is the control. SignalCut passes only if
its cut is at least as understandable in a silent 60-second review and its receipt
is materially stronger.

## Architecture

### Web client

React, TypeScript, and Vite provide a quiet editorial workspace:

- Left rail: evidence and proof claims.
- Center: beat-sheet timeline and cut preview.
- Right rail: duration, clarity findings, provenance, and receipt status.
- Top step control: Evidence, Story, Cut, Receipt.

The workspace uses a restrained paper, ink, coral, teal, and mustard palette. It
does not use a marketing landing page, decorative gradients, glass panels, or
card-on-card layouts.

### Application API

FastAPI owns projects, evidence metadata, story manifests, render jobs, and
receipts. It never exposes provider or B2 credentials to the browser. Pydantic
models define every cross-process contract.

### Editorial engine

The engine validates claims against evidence, creates candidate beat sheets, and
scores six judge questions:

1. What problem exists?
2. Who has it?
3. What does the product do?
4. What changed because of the product?
5. What proof is visible?
6. What should the viewer do next?

Scoring is advisory. The renderer follows the selected manifest, not free-form
model output.

### Media pipeline

Genblaze orchestrates narration and supporting media, records retry and provider
lineage, and produces canonical manifests. Its AgentLoop may refine narration or
pacing until the clarity evaluator passes or the run reaches a strict cost and
iteration cap.

Remotion renders the final composition from the validated Story Manifest. This
keeps timing, typography, transitions, and source placement deterministic.

### Storage

Backblaze B2 is the durable system of record for evidence, generated media,
rendered cuts, thumbnails, and receipts. Content-addressable keys deduplicate
unchanged evidence; hierarchical run keys preserve each editorial attempt.

No secret is stored in source control. Local development uses environment
variables and a checked-in `.env.example` containing names only.

## Data Contracts

### EvidenceAsset

- `id`: stable UUID
- `kind`: image, video, audio, or document
- `filename`: original display name
- `sha256`: source content hash
- `mime_type`: validated media type
- `width`, `height`, `duration_ms`: media facts when applicable
- `claim_ids`: claims this source supports
- `local_uri`: development-only source reference
- `b2_uri`: durable source reference after upload

### StoryBeat

- `id`: stable UUID
- `purpose`: pain, promise, workflow, proof, outcome, or CTA
- `source_asset_ids`: one or more evidence references
- `headline`: on-screen copy
- `narration`: optional spoken copy
- `duration_ms`: bounded scene duration
- `crop`: contain, cover, or focal rectangle
- `unsupported`: true when no evidence supports the beat

### CutReceipt

- `project_id`, `run_id`, and `parent_run_id`
- source asset hashes
- selected Story Manifest hash
- Genblaze canonical manifest hash and verification result
- provider, model, prompt, parameters, attempts, and cost when available
- rendered MP4 hash, duration, dimensions, and B2 URI
- clarity score with six question-level findings
- final decision: READY, REVIEW, or REJECT

## Failure Behavior

- Missing evidence blocks only the unsupported beat, not the entire project.
- Provider failure falls back to a silent captioned cut when the story remains
  understandable without generated audio.
- Expensive media retries use a conservative policy and a maximum of two attempts.
- Render failure preserves the story, generated assets, logs, and parent run so
  the user can retry without regenerating successful steps.
- B2 failure leaves the local artifact intact and marks the receipt `REVIEW` until
  durable storage and manifest verification succeed.

## Verification

Automated tests cover schema validation, evidence hashing, claim linkage, duration
budgets, unsupported beats, deterministic render props, receipt decisions, and
provider/storage failure fallbacks.

The first browser QA covers 1440x900 and 390x844, text clipping, keyboard access,
empty/loading/error states, a nonblank video preview, and every primary control.

The first end-to-end acceptance test is:

```text
Threadloom evidence pack
  -> three candidate stories
  -> selected seven-beat manifest
  -> Genblaze narration run
  -> Remotion MP4
  -> B2 asset and manifest storage
  -> verified READY receipt
```

## MVP Boundary

Included:

- One project at a time.
- Image evidence and short MP4 evidence.
- Three fixed editorial strategies.
- One narration provider plus silent fallback.
- One Remotion composition family.
- Genblaze provenance and B2 storage.
- A downloadable cut and receipt.

Excluded:

- Timeline-level manual video editing.
- Team collaboration.
- Social scheduling.
- Avatars, talking heads, or synthetic product screens.
- A template marketplace.
- Billing.
- Mobile editing.

## Contest Fit

The Backblaze Generative Media Hackathon requires a functional app, a repository,
meaningful Genblaze and B2 usage, and a short demo. SignalCut uses Genblaze for the
media run, refinement lineage, and manifest; B2 is the durable evidence and output
store rather than a final-file dump.

The judging thesis is:

- **Real-world utility:** shipping teams repeatedly need short product demos.
- **Production readiness:** deterministic rendering, fallbacks, bounded retries,
  source validation, and resumable runs.
- **B2 orchestration:** evidence, generated assets, final cuts, and receipts use
  intentional key strategies and durable URLs.
- **Genblaze:** providers, AgentLoop refinement, manifests, verification, retries,
  and run lineage are visible in the product.

## Sources

- https://backblaze-generative-media.devpost.com/
- https://www.backblaze.com/docs/cloud-storage-genblaze-developer-guide
- https://github.com/backblaze-labs/genblaze
- https://www.descript.com/video-editing
- https://supademo.com/
