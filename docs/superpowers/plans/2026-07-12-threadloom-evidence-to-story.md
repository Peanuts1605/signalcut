# Threadloom Evidence-to-Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first SignalCut proof: ingest seven real Threadloom screenshots, create three evidence-linked story manifests, select the clearest valid cut, and emit a receipt.

**Architecture:** A small Python package owns typed evidence, story, and receipt contracts. A deterministic editorial engine builds three fixed strategies and scores them against six judge questions. A Typer CLI reads a public-safe fixture, hashes the source media, writes candidate manifests, and emits the selected decision receipt.

**Tech Stack:** Python 3.11+, Pydantic 2, Pillow, Typer, pytest, Ruff, uv.

## Global Constraints

- Every story beat references at least one real evidence asset.
- SignalCut never generates or invents a product screen.
- Candidate duration must be between 45,000 and 60,000 milliseconds.
- The first slice accepts PNG, JPEG, and WebP evidence only.
- Input evidence is public-safe Threadloom contest material.
- Output is deterministic for identical project and evidence inputs.
- No provider credentials, B2 credentials, or `.env` files enter source control.

---

### Task 1: Package and Typed Contracts

**Files:**
- Create: `pyproject.toml`
- Create: `src/signalcut/__init__.py`
- Create: `src/signalcut/models.py`
- Create: `tests/test_models.py`

**Interfaces:**
- Produces: `EvidencePurpose`, `StoryStrategy`, `EvidenceAsset`, `ProjectBrief`, `StoryBeat`, `StoryManifest`, `ClarityFinding`, and `SelectionReceipt`.
- Consumes: no earlier application interfaces.

- [ ] **Step 1: Write the package configuration**

```toml
[project]
name = "signalcut"
version = "0.1.0"
description = "Proof-first editorial demo pipeline"
requires-python = ">=3.11"
dependencies = [
  "pillow>=11.0,<13",
  "pydantic>=2.10,<3",
  "typer>=0.15,<1",
]

[project.scripts]
signalcut = "signalcut.cli:app"

[dependency-groups]
dev = [
  "pytest>=8.3,<9",
  "ruff>=0.9,<1",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.pytest.ini_options]
pythonpath = ["src"]
testpaths = ["tests"]

[tool.ruff]
line-length = 100
target-version = "py311"
```

- [ ] **Step 2: Write failing model validation tests**

```python
from pathlib import Path

import pytest
from pydantic import ValidationError

from signalcut.models import EvidenceAsset, EvidencePurpose, ProjectBrief, StoryBeat


def test_project_duration_must_fit_demo_window() -> None:
    with pytest.raises(ValidationError):
        ProjectBrief(
            name="Threadloom",
            promise="One shared daily loom.",
            audience="Reddit communities",
            cta="Play today",
            max_duration_ms=61_000,
        )


def test_story_beat_requires_evidence() -> None:
    with pytest.raises(ValidationError):
        StoryBeat(
            purpose=EvidencePurpose.PROOF,
            source_asset_ids=[],
            headline="Same board after reload.",
            duration_ms=7_000,
        )


def test_evidence_asset_keeps_source_facts() -> None:
    asset = EvidenceAsset(
        id="asset-1",
        purpose=EvidencePurpose.WORKFLOW,
        filename="how-to.jpg",
        sha256="a" * 64,
        mime_type="image/jpeg",
        width=1440,
        height=900,
        local_path=Path("fixtures/how-to.jpg"),
        claim_ids=["claim-how"],
    )
    assert asset.width == 1440
    assert asset.claim_ids == ["claim-how"]
```

- [ ] **Step 3: Run tests and verify they fail**

Run: `uv run pytest tests/test_models.py -v`

Expected: FAIL because `signalcut.models` does not exist.

- [ ] **Step 4: Implement the typed contracts**

```python
from __future__ import annotations

from enum import StrEnum
from pathlib import Path

from pydantic import BaseModel, ConfigDict, Field, model_validator


class EvidencePurpose(StrEnum):
    PAIN = "pain"
    PROMISE = "promise"
    WORKFLOW = "workflow"
    PROOF = "proof"
    OUTCOME = "outcome"
    CTA = "cta"


class StoryStrategy(StrEnum):
    OUTCOME_FIRST = "outcome_first"
    WORKFLOW_FIRST = "workflow_first"
    PROOF_FIRST = "proof_first"


class EvidenceAsset(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    purpose: EvidencePurpose
    filename: str
    sha256: str = Field(pattern=r"^[0-9a-f]{64}$")
    mime_type: str
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    local_path: Path
    claim_ids: list[str] = Field(min_length=1)


class ProjectBrief(BaseModel):
    model_config = ConfigDict(frozen=True)

    name: str = Field(min_length=1)
    promise: str = Field(min_length=1)
    audience: str = Field(min_length=1)
    cta: str = Field(min_length=1)
    max_duration_ms: int = Field(ge=45_000, le=60_000)


class StoryBeat(BaseModel):
    model_config = ConfigDict(frozen=True)

    purpose: EvidencePurpose
    source_asset_ids: list[str] = Field(min_length=1)
    headline: str = Field(min_length=1, max_length=100)
    narration: str | None = Field(default=None, max_length=240)
    duration_ms: int = Field(ge=3_000, le=12_000)


class StoryManifest(BaseModel):
    model_config = ConfigDict(frozen=True)

    strategy: StoryStrategy
    beats: list[StoryBeat] = Field(min_length=1, max_length=7)
    total_duration_ms: int
    manifest_hash: str = Field(pattern=r"^[0-9a-f]{64}$")

    @model_validator(mode="after")
    def duration_matches_beats(self) -> StoryManifest:
        if self.total_duration_ms != sum(beat.duration_ms for beat in self.beats):
            raise ValueError("total_duration_ms must match beat durations")
        if not 45_000 <= self.total_duration_ms <= 60_000:
            raise ValueError("story duration must fit the demo window")
        return self


class ClarityFinding(BaseModel):
    model_config = ConfigDict(frozen=True)

    question: str
    passed: bool
    evidence_asset_ids: list[str]


class SelectionReceipt(BaseModel):
    model_config = ConfigDict(frozen=True)

    project_name: str
    selected_strategy: StoryStrategy
    selected_manifest_hash: str
    evidence_hashes: dict[str, str]
    clarity_score: int = Field(ge=0, le=6)
    findings: list[ClarityFinding] = Field(min_length=6, max_length=6)
    decision: str
```

- [ ] **Step 5: Run tests and commit**

Run: `uv run pytest tests/test_models.py -v`

Expected: 3 passed.

Run: `git add pyproject.toml src/signalcut tests/test_models.py && git commit -m "feat: define SignalCut editorial contracts"`

---

### Task 2: Evidence Ingestion

**Files:**
- Create: `src/signalcut/evidence.py`
- Create: `tests/test_evidence.py`
- Create: `tests/fixtures/evidence/sample.png`

**Interfaces:**
- Consumes: `EvidenceAsset` and `EvidencePurpose` from Task 1.
- Produces: `sha256_file(path: Path) -> str` and `ingest_image(path: Path, purpose: EvidencePurpose, claim_ids: list[str]) -> EvidenceAsset`.

- [ ] **Step 1: Add a 32x24 PNG fixture**

Generate it once with Pillow:

```bash
uv run python -c 'from pathlib import Path; from PIL import Image; p=Path("tests/fixtures/evidence/sample.png"); p.parent.mkdir(parents=True, exist_ok=True); Image.new("RGB", (32, 24), "#247f79").save(p)'
```

- [ ] **Step 2: Write failing ingestion tests**

```python
from pathlib import Path

import pytest

from signalcut.evidence import ingest_image, sha256_file
from signalcut.models import EvidencePurpose


FIXTURE = Path("tests/fixtures/evidence/sample.png")


def test_sha256_is_stable() -> None:
    assert sha256_file(FIXTURE) == sha256_file(FIXTURE)
    assert len(sha256_file(FIXTURE)) == 64


def test_ingest_reads_dimensions_and_mime() -> None:
    asset = ingest_image(FIXTURE, EvidencePurpose.WORKFLOW, ["claim-workflow"])
    assert (asset.width, asset.height) == (32, 24)
    assert asset.mime_type == "image/png"
    assert asset.id.startswith("asset-")


def test_ingest_rejects_unsupported_files(tmp_path: Path) -> None:
    bad = tmp_path / "notes.txt"
    bad.write_text("not an image")
    with pytest.raises(ValueError, match="unsupported evidence type"):
        ingest_image(bad, EvidencePurpose.PROOF, ["claim-proof"])
```

- [ ] **Step 3: Run tests and verify they fail**

Run: `uv run pytest tests/test_evidence.py -v`

Expected: FAIL because `signalcut.evidence` does not exist.

- [ ] **Step 4: Implement evidence ingestion**

```python
from __future__ import annotations

import hashlib
from pathlib import Path

from PIL import Image

from signalcut.models import EvidenceAsset, EvidencePurpose


MIME_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ingest_image(
    path: Path,
    purpose: EvidencePurpose,
    claim_ids: list[str],
) -> EvidenceAsset:
    resolved = path.resolve()
    mime_type = MIME_TYPES.get(resolved.suffix.lower())
    if mime_type is None:
        raise ValueError(f"unsupported evidence type: {resolved.suffix}")
    with Image.open(resolved) as image:
        width, height = image.size
    digest = sha256_file(resolved)
    return EvidenceAsset(
        id=f"asset-{digest[:12]}",
        purpose=purpose,
        filename=resolved.name,
        sha256=digest,
        mime_type=mime_type,
        width=width,
        height=height,
        local_path=resolved,
        claim_ids=claim_ids,
    )
```

- [ ] **Step 5: Run tests and commit**

Run: `uv run pytest tests/test_evidence.py -v`

Expected: 3 passed.

Run: `git add src/signalcut/evidence.py tests && git commit -m "feat: ingest hashed image evidence"`

---

### Task 3: Deterministic Editorial Strategies

**Files:**
- Create: `src/signalcut/editorial.py`
- Create: `tests/test_editorial.py`

**Interfaces:**
- Consumes: `ProjectBrief`, `EvidenceAsset`, `StoryBeat`, `StoryManifest`, and enums from Task 1.
- Produces: `build_candidates(project: ProjectBrief, assets: list[EvidenceAsset]) -> list[StoryManifest]`, `score_manifest(manifest: StoryManifest, assets: list[EvidenceAsset]) -> tuple[int, list[ClarityFinding]]`, and `select_candidate(project: ProjectBrief, assets: list[EvidenceAsset], candidates: list[StoryManifest]) -> SelectionReceipt`.

- [ ] **Step 1: Write failing editorial tests**

```python
from pathlib import Path

from signalcut.editorial import build_candidates, select_candidate
from signalcut.models import EvidenceAsset, EvidencePurpose, ProjectBrief, StoryStrategy


def asset(identifier: str, purpose: EvidencePurpose) -> EvidenceAsset:
    return EvidenceAsset(
        id=identifier,
        purpose=purpose,
        filename=f"{identifier}.jpg",
        sha256=(identifier[-1] * 64),
        mime_type="image/jpeg",
        width=1440,
        height=900,
        local_path=Path(f"fixtures/{identifier}.jpg"),
        claim_ids=[f"claim-{identifier}"],
    )


def test_builds_three_valid_deterministic_candidates() -> None:
    project = ProjectBrief(
        name="Threadloom",
        promise="One shared daily loom.",
        audience="Reddit communities",
        cta="Play on Reddit",
        max_duration_ms=55_000,
    )
    assets = [
        asset("asset-1", EvidencePurpose.PAIN),
        asset("asset-2", EvidencePurpose.PROMISE),
        asset("asset-3", EvidencePurpose.WORKFLOW),
        asset("asset-4", EvidencePurpose.PROOF),
        asset("asset-5", EvidencePurpose.PROOF),
        asset("asset-6", EvidencePurpose.OUTCOME),
        asset("asset-7", EvidencePurpose.CTA),
    ]
    first = build_candidates(project, assets)
    second = build_candidates(project, assets)
    assert [item.strategy for item in first] == list(StoryStrategy)
    assert [item.manifest_hash for item in first] == [item.manifest_hash for item in second]
    assert all(45_000 <= item.total_duration_ms <= 55_000 for item in first)
    assert all(beat.source_asset_ids for item in first for beat in item.beats)


def test_selection_prefers_full_six_question_coverage() -> None:
    project = ProjectBrief(
        name="Threadloom",
        promise="One shared daily loom.",
        audience="Reddit communities",
        cta="Play on Reddit",
        max_duration_ms=55_000,
    )
    assets = [
        asset("asset-1", EvidencePurpose.PAIN),
        asset("asset-2", EvidencePurpose.PROMISE),
        asset("asset-3", EvidencePurpose.WORKFLOW),
        asset("asset-4", EvidencePurpose.PROOF),
        asset("asset-5", EvidencePurpose.OUTCOME),
        asset("asset-6", EvidencePurpose.CTA),
    ]
    candidates = build_candidates(project, assets)
    receipt = select_candidate(project, assets, candidates)
    assert receipt.clarity_score == 6
    assert receipt.decision == "READY"
```

- [ ] **Step 2: Run tests and verify they fail**

Run: `uv run pytest tests/test_editorial.py -v`

Expected: FAIL because `signalcut.editorial` does not exist.

- [ ] **Step 3: Implement candidate generation and selection**

Implement fixed strategy orders:

```python
STRATEGY_ORDER = {
    StoryStrategy.OUTCOME_FIRST: [
        EvidencePurpose.OUTCOME,
        EvidencePurpose.PAIN,
        EvidencePurpose.PROMISE,
        EvidencePurpose.WORKFLOW,
        EvidencePurpose.PROOF,
        EvidencePurpose.CTA,
    ],
    StoryStrategy.WORKFLOW_FIRST: [
        EvidencePurpose.PAIN,
        EvidencePurpose.WORKFLOW,
        EvidencePurpose.PROOF,
        EvidencePurpose.OUTCOME,
        EvidencePurpose.PROMISE,
        EvidencePurpose.CTA,
    ],
    StoryStrategy.PROOF_FIRST: [
        EvidencePurpose.PROOF,
        EvidencePurpose.PAIN,
        EvidencePurpose.PROMISE,
        EvidencePurpose.WORKFLOW,
        EvidencePurpose.OUTCOME,
        EvidencePurpose.CTA,
    ],
}
```

Use one beat per purpose except `PROOF`, which may use up to two assets. Divide
`min(project.max_duration_ms, 55_000)` across the resulting beats, serialize each
candidate with sorted JSON keys, and compute `manifest_hash` with SHA-256. Headlines
come from a fixed purpose map and CTA uses `project.cta`.

Score one point for each of the six purposes represented by at least one source
asset. Select the highest score, breaking ties in this order: Outcome First,
Workflow First, Proof First. Emit `READY` only for a score of six; otherwise emit
`REVIEW`.

- [ ] **Step 4: Run editorial and full tests**

Run: `uv run pytest tests/test_editorial.py -v`

Expected: 2 passed.

Run: `uv run pytest -q`

Expected: 8 passed.

- [ ] **Step 5: Commit**

Run: `git add src/signalcut/editorial.py tests/test_editorial.py && git commit -m "feat: build evidence-linked story candidates"`

---

### Task 4: Threadloom Fixture and CLI Proof

**Files:**
- Create: `src/signalcut/cli.py`
- Create: `fixtures/threadloom/project.json`
- Create: `fixtures/threadloom/evidence/` with seven public-safe screenshots
- Create: `tests/test_cli.py`
- Create at runtime: `artifacts/threadloom/evidence-manifest.json`
- Create at runtime: `artifacts/threadloom/story-candidates.json`
- Create at runtime: `artifacts/threadloom/selection-receipt.json`
- Create at runtime: `artifacts/threadloom/DECISION.md`

**Interfaces:**
- Consumes: ingestion and editorial interfaces from Tasks 2 and 3.
- Produces: Typer command `signalcut story <project.json> --out <directory>`.

- [ ] **Step 1: Copy the seven public-safe Threadloom screenshots**

Copy these existing files into `fixtures/threadloom/evidence/` with stable names:

```text
live-feed.jpg
how-to.jpg
accepted-stitch.jpg
persisted-feed.jpg
second-view.jpg
mobile-woven.png
mobile-frayed.png
```

- [ ] **Step 2: Create the Threadloom project fixture**

```json
{
  "name": "Threadloom",
  "promise": "One shared daily loom for an entire subreddit.",
  "audience": "Reddit communities that enjoy daily cooperative games",
  "cta": "Play on r/threadloom_daily_dev",
  "max_duration_ms": 55000,
  "evidence": [
    {"path": "evidence/mobile-frayed.png", "purpose": "pain", "claim_ids": ["shared-risk"]},
    {"path": "evidence/live-feed.jpg", "purpose": "promise", "claim_ids": ["shared-board"]},
    {"path": "evidence/how-to.jpg", "purpose": "workflow", "claim_ids": ["four-moves"]},
    {"path": "evidence/accepted-stitch.jpg", "purpose": "proof", "claim_ids": ["accepted-stitch"]},
    {"path": "evidence/second-view.jpg", "purpose": "proof", "claim_ids": ["shared-state"]},
    {"path": "evidence/mobile-woven.png", "purpose": "outcome", "claim_ids": ["woven-result"]},
    {"path": "evidence/persisted-feed.jpg", "purpose": "cta", "claim_ids": ["public-playtest"]}
  ]
}
```

- [ ] **Step 3: Write a failing CLI integration test**

```python
import json
from pathlib import Path

from typer.testing import CliRunner

from signalcut.cli import app


def test_threadloom_story_proof(tmp_path: Path) -> None:
    result = CliRunner().invoke(
        app,
        ["story", "fixtures/threadloom/project.json", "--out", str(tmp_path)],
    )
    assert result.exit_code == 0, result.output
    receipt = json.loads((tmp_path / "selection-receipt.json").read_text())
    assert receipt["project_name"] == "Threadloom"
    assert receipt["clarity_score"] == 6
    assert receipt["decision"] == "READY"
    assert (tmp_path / "DECISION.md").exists()
```

- [ ] **Step 4: Implement the CLI**

The command must:

1. Parse `project.json`.
2. Resolve evidence paths relative to that file.
3. Ingest and hash every image.
4. Build three candidates.
5. Select the winning candidate.
6. Write all four outputs using sorted, indented JSON and a concise Markdown
   decision note.
7. Print `READY <selected_strategy> <selected_manifest_hash>`.

- [ ] **Step 5: Run the integration test and real proof**

Run: `uv run pytest tests/test_cli.py -v`

Expected: 1 passed.

Run: `uv run signalcut story fixtures/threadloom/project.json --out artifacts/threadloom`

Expected output begins with `READY` and names the selected strategy.

- [ ] **Step 6: Verify and commit**

Run: `uv run pytest -q`

Expected: 9 passed.

Run: `uv run ruff check .`

Expected: All checks passed.

Run: `git add src fixtures tests artifacts pyproject.toml uv.lock && git commit -m "feat: prove Threadloom evidence-to-story flow"`

## Completion Gate

The slice is complete only when:

- Nine tests pass.
- Ruff passes.
- Three deterministic story candidates exist.
- The selected candidate scores six of six.
- Every beat names real evidence.
- The local artifact, decision, receipt, verified Drive mirror, Notion pointer,
  and reconciled receipt close under a new shared-proof receipt ID.
