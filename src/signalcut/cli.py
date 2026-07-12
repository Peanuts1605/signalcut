from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import typer

from signalcut.editorial import build_candidates, select_candidate
from signalcut.evidence import ingest_image
from signalcut.models import EvidencePurpose, ProjectBrief


app = typer.Typer(no_args_is_help=True, pretty_exceptions_show_locals=False)


@app.callback()
def main() -> None:
    """SignalCut proof-first editorial tools."""


def _write_json(path: Path, payload: Any) -> None:
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")


@app.command()
def story(
    project_file: Path = typer.Argument(..., exists=True, dir_okay=False, readable=True),
    out: Path = typer.Option(..., "--out", file_okay=False),
) -> None:
    """Build and select evidence-linked demo stories."""
    source = json.loads(project_file.read_text())
    project = ProjectBrief(
        name=source["name"],
        promise=source["promise"],
        audience=source["audience"],
        cta=source["cta"],
        max_duration_ms=source["max_duration_ms"],
    )
    base = project_file.resolve().parent
    assets = [
        ingest_image(
            base / item["path"],
            EvidencePurpose(item["purpose"]),
            item["claim_ids"],
        )
        for item in source["evidence"]
    ]
    candidates = build_candidates(project, assets)
    receipt = select_candidate(project, assets, candidates)

    out.mkdir(parents=True, exist_ok=True)
    _write_json(
        out / "evidence-manifest.json",
        [asset.model_dump(mode="json") for asset in assets],
    )
    _write_json(
        out / "story-candidates.json",
        [candidate.model_dump(mode="json") for candidate in candidates],
    )
    _write_json(out / "selection-receipt.json", receipt.model_dump(mode="json"))
    (out / "DECISION.md").write_text(
        "\n".join(
            [
                f"# {project.name} SignalCut Decision",
                "",
                f"**Decision:** {receipt.decision}",
                f"**Selected story:** {receipt.selected_strategy.value}",
                f"**Judge clarity:** {receipt.clarity_score}/6",
                f"**Manifest hash:** `{receipt.selected_manifest_hash}`",
                "",
                "The selected story is evidence-linked from start to finish. "
                "Every beat names at least one source image, and the same inputs "
                "produce the same result.",
                "",
            ]
        )
    )
    typer.echo(
        f"{receipt.decision} {receipt.selected_strategy.value} "
        f"{receipt.selected_manifest_hash}"
    )


if __name__ == "__main__":
    app()
