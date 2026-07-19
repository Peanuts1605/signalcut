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


class ClaimStatus(StrEnum):
    EVIDENCE_LINKED = "evidence_linked"
    NEEDS_EVIDENCE = "needs_evidence"


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


class ProjectClaim(BaseModel):
    """A publishing claim with the evidence the user explicitly attaches."""

    model_config = ConfigDict(frozen=True)

    id: str = Field(min_length=1)
    statement: str = Field(min_length=1, max_length=180)
    evidence_asset_ids: list[str] = Field(default_factory=list)


class ClaimFinding(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    statement: str
    status: ClaimStatus
    evidence_asset_ids: list[str]
    note: str


class ClaimLedger(BaseModel):
    model_config = ConfigDict(frozen=True)

    project_name: str
    findings: list[ClaimFinding]
    linked_claim_count: int = Field(ge=0)
    missing_evidence_count: int = Field(ge=0)
    decision: str


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


class StoryboardScene(BaseModel):
    model_config = ConfigDict(frozen=True)

    purpose: EvidencePurpose
    source_asset_ids: list[str] = Field(min_length=1)
    source_paths: list[Path] = Field(min_length=1)
    headline: str = Field(min_length=1, max_length=100)
    duration_ms: int = Field(ge=3_000, le=12_000)

    @model_validator(mode="after")
    def source_paths_are_portable(self) -> StoryboardScene:
        if any(path.is_absolute() for path in self.source_paths):
            raise ValueError("storyboard source paths must be project-relative")
        return self


class RenderStoryboard(BaseModel):
    model_config = ConfigDict(frozen=True)

    project_name: str = Field(min_length=1)
    strategy: StoryStrategy
    manifest_hash: str = Field(pattern=r"^[0-9a-f]{64}$")
    total_duration_ms: int = Field(ge=45_000, le=60_000)
    scenes: list[StoryboardScene] = Field(min_length=1, max_length=7)

    @model_validator(mode="after")
    def duration_matches_scenes(self) -> RenderStoryboard:
        if self.total_duration_ms != sum(scene.duration_ms for scene in self.scenes):
            raise ValueError("total_duration_ms must match storyboard scenes")
        return self
