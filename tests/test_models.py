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
