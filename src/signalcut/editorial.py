from __future__ import annotations

import hashlib
import json
from pathlib import Path

from signalcut.models import (
    ClaimFinding,
    ClaimLedger,
    ClaimStatus,
    ClarityFinding,
    EvidenceAsset,
    EvidencePurpose,
    ProjectBrief,
    ProjectClaim,
    RenderStoryboard,
    SelectionReceipt,
    StoryBeat,
    StoryManifest,
    StoryboardScene,
    StoryStrategy,
)


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

HEADLINES = {
    EvidencePurpose.PAIN: "One weak move can fray the shared pattern.",
    EvidencePurpose.PROMISE: "One shared daily loom.",
    EvidencePurpose.WORKFLOW: "Four moves. One collective choice.",
    EvidencePurpose.PROOF: "The accepted stitch becomes shared state.",
    EvidencePurpose.OUTCOME: "The community weaves one result together.",
}

CLARITY_QUESTIONS = {
    EvidencePurpose.PAIN: "Can a judge identify the customer pain?",
    EvidencePurpose.PROMISE: "Can a judge state the product promise?",
    EvidencePurpose.WORKFLOW: "Can a judge understand how it works?",
    EvidencePurpose.PROOF: "Can a judge see trustworthy product proof?",
    EvidencePurpose.OUTCOME: "Can a judge identify the result?",
    EvidencePurpose.CTA: "Can a judge identify the next step?",
}


def _duration_split(total_ms: int, count: int) -> list[int]:
    base, remainder = divmod(total_ms, count)
    return [base + (1 if index < remainder else 0) for index in range(count)]


def _manifest_hash(strategy: StoryStrategy, beats: list[StoryBeat], total_ms: int) -> str:
    payload = {
        "strategy": strategy.value,
        "beats": [beat.model_dump(mode="json") for beat in beats],
        "total_duration_ms": total_ms,
    }
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def build_candidates(
    project: ProjectBrief,
    assets: list[EvidenceAsset],
) -> list[StoryManifest]:
    assets_by_purpose = {
        purpose: sorted(
            (asset for asset in assets if asset.purpose == purpose),
            key=lambda asset: asset.id,
        )
        for purpose in EvidencePurpose
    }
    total_ms = min(project.max_duration_ms, 55_000)
    candidates: list[StoryManifest] = []

    for strategy in StoryStrategy:
        purposes = [purpose for purpose in STRATEGY_ORDER[strategy] if assets_by_purpose[purpose]]
        if len(purposes) < 4:
            raise ValueError("at least four evidence purposes are required for a valid demo")
        durations = _duration_split(total_ms, len(purposes))
        beats: list[StoryBeat] = []
        for purpose, duration_ms in zip(purposes, durations, strict=True):
            source_assets = assets_by_purpose[purpose]
            if purpose == EvidencePurpose.PROOF:
                source_assets = source_assets[:2]
            else:
                source_assets = source_assets[:1]
            headline = project.cta if purpose == EvidencePurpose.CTA else HEADLINES[purpose]
            beats.append(
                StoryBeat(
                    purpose=purpose,
                    source_asset_ids=[asset.id for asset in source_assets],
                    headline=headline,
                    duration_ms=duration_ms,
                )
            )
        candidates.append(
            StoryManifest(
                strategy=strategy,
                beats=beats,
                total_duration_ms=total_ms,
                manifest_hash=_manifest_hash(strategy, beats, total_ms),
            )
        )
    return candidates


def score_manifest(
    manifest: StoryManifest,
    assets: list[EvidenceAsset],
) -> tuple[int, list[ClarityFinding]]:
    assets_by_id = {asset.id: asset for asset in assets}
    represented: dict[EvidencePurpose, list[str]] = {purpose: [] for purpose in EvidencePurpose}
    for beat in manifest.beats:
        represented[beat.purpose].extend(
            asset_id
            for asset_id in beat.source_asset_ids
            if asset_id in assets_by_id and assets_by_id[asset_id].purpose == beat.purpose
        )
    findings = [
        ClarityFinding(
            question=CLARITY_QUESTIONS[purpose],
            passed=bool(represented[purpose]),
            evidence_asset_ids=represented[purpose],
        )
        for purpose in EvidencePurpose
    ]
    return sum(finding.passed for finding in findings), findings


def select_candidate(
    project: ProjectBrief,
    assets: list[EvidenceAsset],
    candidates: list[StoryManifest],
) -> SelectionReceipt:
    ranked: list[tuple[int, int, StoryManifest, list[ClarityFinding]]] = []
    strategy_rank = {strategy: index for index, strategy in enumerate(StoryStrategy)}
    for candidate in candidates:
        score, findings = score_manifest(candidate, assets)
        ranked.append((score, -strategy_rank[candidate.strategy], candidate, findings))
    score, _, selected, findings = max(ranked, key=lambda item: (item[0], item[1]))
    return SelectionReceipt(
        project_name=project.name,
        selected_strategy=selected.strategy,
        selected_manifest_hash=selected.manifest_hash,
        evidence_hashes={asset.id: asset.sha256 for asset in sorted(assets, key=lambda a: a.id)},
        clarity_score=score,
        findings=findings,
        decision="READY" if score == len(EvidencePurpose) else "REVIEW",
    )


def review_claims(
    project: ProjectBrief,
    assets: list[EvidenceAsset],
    claims: list[ProjectClaim],
) -> ClaimLedger:
    """Require explicit source attachments before a publishing claim can pass."""

    asset_ids = {asset.id for asset in assets}
    seen_claim_ids: set[str] = set()
    findings: list[ClaimFinding] = []

    for claim in claims:
        if claim.id in seen_claim_ids:
            raise ValueError(f"duplicate claim id: {claim.id}")
        seen_claim_ids.add(claim.id)
        linked = [asset_id for asset_id in claim.evidence_asset_ids if asset_id in asset_ids]
        unknown = sorted(set(claim.evidence_asset_ids) - asset_ids)
        if linked and not unknown:
            findings.append(
                ClaimFinding(
                    id=claim.id,
                    statement=claim.statement,
                    status=ClaimStatus.EVIDENCE_LINKED,
                    evidence_asset_ids=linked,
                    note="Evidence linked. Review the source before publishing.",
                )
            )
        else:
            detail = "No source attached." if not unknown else f"Unknown source: {', '.join(unknown)}."
            findings.append(
                ClaimFinding(
                    id=claim.id,
                    statement=claim.statement,
                    status=ClaimStatus.NEEDS_EVIDENCE,
                    evidence_asset_ids=linked,
                    note=f"{detail} Keep this claim out of the cut until proof is attached.",
                )
            )

    linked_claim_count = sum(
        finding.status == ClaimStatus.EVIDENCE_LINKED for finding in findings
    )
    missing_evidence_count = len(findings) - linked_claim_count
    return ClaimLedger(
        project_name=project.name,
        findings=findings,
        linked_claim_count=linked_claim_count,
        missing_evidence_count=missing_evidence_count,
        decision="PUBLISH_READY" if missing_evidence_count == 0 else "NEEDS_PROOF",
    )


def build_storyboard(
    project: ProjectBrief,
    receipt: SelectionReceipt,
    candidates: list[StoryManifest],
    asset_paths: dict[str, Path],
) -> RenderStoryboard:
    selected = next(
        (
            candidate
            for candidate in candidates
            if candidate.manifest_hash == receipt.selected_manifest_hash
        ),
        None,
    )
    if selected is None:
        raise ValueError("selected manifest is missing from story candidates")
    scenes = [
        StoryboardScene(
            purpose=beat.purpose,
            source_asset_ids=beat.source_asset_ids,
            source_paths=[asset_paths[asset_id] for asset_id in beat.source_asset_ids],
            headline=beat.headline,
            duration_ms=beat.duration_ms,
        )
        for beat in selected.beats
    ]
    return RenderStoryboard(
        project_name=project.name,
        strategy=selected.strategy,
        manifest_hash=selected.manifest_hash,
        total_duration_ms=selected.total_duration_ms,
        scenes=scenes,
    )
