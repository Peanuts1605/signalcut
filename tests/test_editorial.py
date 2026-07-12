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
