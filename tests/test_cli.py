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
    evidence = json.loads((tmp_path / "evidence-manifest.json").read_text())
    assert all(not Path(item["local_path"]).is_absolute() for item in evidence)
    storyboard = json.loads((tmp_path / "storyboard.json").read_text())
    assert storyboard["strategy"] == "outcome_first"
    assert storyboard["total_duration_ms"] == 55_000
    assert len(storyboard["scenes"]) == 6
    assert all(scene["source_paths"] for scene in storyboard["scenes"])
    assert all(
        not Path(path).is_absolute()
        for scene in storyboard["scenes"]
        for path in scene["source_paths"]
    )
    claim_ledger = json.loads((tmp_path / "claim-ledger.json").read_text())
    assert claim_ledger["decision"] == "NEEDS_PROOF"
    assert claim_ledger["linked_claim_count"] == 2
    assert claim_ledger["missing_evidence_count"] == 1
    assert claim_ledger["findings"][2]["id"] == "solo-play"
    assert claim_ledger["findings"][2]["status"] == "needs_evidence"
    assert (tmp_path / "DECISION.md").exists()
    assert (tmp_path / "PUBLISHING_DECISION.md").exists()
