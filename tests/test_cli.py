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
