# SignalCut - Devpost Submission Copy

## Title

SignalCut

## Tagline

Proof before publish for product demos.

## Short description

SignalCut helps builders turn real product evidence into a short demo cut
without giving unsupported claims a false green light.

## Full description

Polished demos can be built from real screenshots and still say more than the
screenshots support. That leaves a reviewer or judge with a frustrating job:
they have to guess which release claims are grounded and which are only
confident-sounding copy.

SignalCut's Claim Review makes that decision visible before a demo goes public.
A project declares a claim and the exact evidence assets it relies on. The
engine produces a deterministic claim ledger, then the Review Desk shows each
claim beside its linked source filenames. If a claim has no source, the project
does not get a green light: it receives `Needs proof`.

The live Threadloom demo contains two linked claims and one deliberate gap:
"The game supports solo play." Because that claim has no attached evidence,
SignalCut returns `NEEDS_PROOF`. This is intentional. The product is meant to
prevent a polished demo from quietly turning missing proof into a passing
release decision.

The original evidence-to-story pipeline predates OpenAI Build Week. The
meaningful Build Week extension is Claim Review: the claim model and review
engine, deterministic claim ledger, public Review Desk, responsive reviewer
state, adversarial tests, and qualifying-extension documentation were added on
July 19, 2026.

SignalCut does not claim that an image model can determine whether a screenshot
semantically proves a statement. It verifies declared links, exposes gaps, and
keeps the final visual judgment with the human reviewer.

## Judge path

1. Open the live Review Desk.
2. Select **Claim review**.
3. See `Needs proof` with `2 linked - 1 missing`.
4. Inspect the unsupported solo-play claim.
5. Open **Evidence** and **Receipt** to inspect the sources and render record.

## Links

- Live app: https://peanuts1605.github.io/signalcut/
- Source repository: https://github.com/Peanuts1605/signalcut
- Demo video: upload `signalcut-openai-build-week-demo.mp4` to public YouTube,
  then paste its URL here and in Devpost.
- Build Week `/feedback` session ID: add the returned ID here and in Devpost.

## Build notes

- Built with Codex and GPT-5.6 during OpenAI Build Week. Codex was used to
  shape the claim/evidence contract, implement the engine and Review Desk,
  develop the adversarial tests, and verify the public deployment.
- The required `/feedback` session ID will be entered from the project task
  where the core Claim Review extension was built.
- Public app deployment rebuilds the proof bundle, renders the preview, verifies
  the render, builds the Review Desk, and publishes GitHub Pages from one
  workflow.
- The video demo is 65.52 seconds, below the contest's three-minute limit.
