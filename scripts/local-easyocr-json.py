from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path


def resolve_image_path(value: str) -> Path:
    candidate = Path(value)
    if candidate.exists():
        return candidate

    if value.startswith("D:/fd/") or value.startswith("D:\\fd\\"):
        normalized = Path(value.replace("/", "\\"))
        if normalized.exists():
            return normalized

    filename = candidate.name or value
    roots = [Path("D:/fd/chm-extract"), Path("D:/fd/data/staged/staging")]
    matches: list[Path] = []
    for root in roots:
        matches.extend(root.glob(f"**/{filename}"))
    unique = list(dict.fromkeys(matches))
    if len(unique) > 1:
        preferred = [match for match in unique if "图包" in match.parts]
        if len(preferred) == 1:
            return preferred[0]
    if len(unique) != 1:
        raise FileNotFoundError(f"Could not uniquely resolve image path for {value!r}: {unique}")
    return unique[0]


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: python scripts/local-easyocr-json.py <image-path-or-basename>", file=sys.stderr)
        return 1

    image_path = resolve_image_path(sys.argv[1])
    script_path = Path("D:/fd/tmp/run-local-paddleocr.py")
    temp_dir = Path("D:/Users/chenshang/AppData/Local/Temp/opencode/paddleocr")
    temp_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run([sys.executable, str(script_path), str(temp_dir), str(image_path)], check=True)
    output_path = temp_dir / f"{image_path.stem}.json"
    print(output_path.read_text(encoding="utf-8"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
