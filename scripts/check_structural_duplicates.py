from __future__ import annotations

from pathlib import Path
import hashlib
import re


ROOT = Path(__file__).resolve().parents[1]

SCAN_ROOTS = [
    ROOT / "apps" / "desktop-ui" / "src",
    ROOT / "crates",
]

EXTENSIONS = {".ts", ".tsx", ".rs"}
MIN_LINES = 220


def normalize(text: str) -> str:
    text = re.sub(r"//.*?$", "", text, flags=re.MULTILINE)
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
    text = re.sub(r"\"[^\"\\]*(?:\\.[^\"\\]*)*\"", '"<S>"', text)
    text = re.sub(r"'[^'\\]*(?:\\.[^'\\]*)*'", "'<S>'", text)
    text = re.sub(r"\d+", "N", text)
    text = re.sub(r"\s+", "", text)
    return text


def file_lines(path: Path) -> int:
    return path.read_text(encoding="utf-8").count("\n") + 1


def should_scan(path: Path) -> bool:
    if path.suffix not in EXTENSIONS:
        return False
    if path.name.endswith(".data.ts"):
        return False
    if path.name.endswith(".schema.ts"):
        return False
    if path.name.endswith(".generated.ts"):
        return False
    if ".test." in path.name:
        return False
    if "node_modules" in path.parts or "target" in path.parts or "dist" in path.parts:
        return False
    return True


def main() -> int:
    buckets: dict[str, list[Path]] = {}

    for scan_root in SCAN_ROOTS:
        for path in scan_root.rglob("*"):
            if not path.is_file() or not should_scan(path):
                continue
            if file_lines(path) < MIN_LINES:
                continue
            normalized = normalize(path.read_text(encoding="utf-8"))
            digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
            buckets.setdefault(digest, []).append(path)

    violations = [group for group in buckets.values() if len(group) > 1]
    if violations:
        print("Structural duplicate code clusters detected:")
        for group in violations:
            print(" - cluster")
            for path in sorted(group):
                print(f"   - {path.relative_to(ROOT)}")
        return 1

    print("Structural duplicate check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
