from pathlib import Path

import pytest

from signalcut.editorial import review_claims
from signalcut.models import EvidenceAsset, EvidencePurpose, ProjectBrief, ProjectClaim


def project() -> ProjectBrief:
    return ProjectBrief(
        name="Proof Desk",
        promise="A proof-first demo.",
        audience="Hackathon builders",
        cta="Review the cut",
        max_duration_ms=55_000,
    )


def asset() -> EvidenceAsset:
    return EvidenceAsset(
        id="asset-proof",
        purpose=EvidencePurpose.PROOF,
        filename="proof.png",
        sha256="a" * 64,
        mime_type="image/png",
        width=1440,
        height=900,
        local_path=Path("fixtures/proof.png"),
        claim_ids=["claim-proof"],
    )


def test_claim_review_requires_explicit_known_evidence() -> None:
    ledger = review_claims(
        project(),
        [asset()],
        [
            ProjectClaim(
                id="claim-proof",
                statement="The product has proof.",
                evidence_asset_ids=["asset-proof"],
            ),
            ProjectClaim(id="claim-missing", statement="The product works offline."),
            ProjectClaim(
                id="claim-unknown",
                statement="The product has a mobile app.",
                evidence_asset_ids=["asset-not-real"],
            ),
        ],
    )

    assert ledger.decision == "NEEDS_PROOF"
    assert ledger.linked_claim_count == 1
    assert ledger.missing_evidence_count == 2
    assert ledger.findings[0].status == "evidence_linked"
    assert ledger.findings[1].status == "needs_evidence"
    assert ledger.findings[2].status == "needs_evidence"


def test_claim_review_rejects_duplicate_claim_ids() -> None:
    with pytest.raises(ValueError, match="duplicate claim id"):
        review_claims(
            project(),
            [asset()],
            [
                ProjectClaim(id="same", statement="First."),
                ProjectClaim(id="same", statement="Second."),
            ],
        )
