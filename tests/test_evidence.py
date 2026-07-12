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
