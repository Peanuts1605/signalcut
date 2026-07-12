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
