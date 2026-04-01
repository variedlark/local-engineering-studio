from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RUNTIME_DIRS = [
    ROOT / "apps" / "desktop-ui" / "src",
    ROOT / "crates",
]

FILE_EXTENSIONS = {".ts", ".tsx", ".rs"}
MAX_LINES = 1700

PER_FILE_LIMITS = {
    Path("apps/desktop-ui/src/features/ui-store.ts"): 1200,
}


def line_count(path: Path) -> int:
    return path.read_text(encoding="utf-8").count("\n") + 1


def should_scan(path: Path) -> bool:
    if path.suffix not in FILE_EXTENSIONS:
        return False
    if ".test." in path.name:
        return False
    if "target" in path.parts or "dist" in path.parts or "node_modules" in path.parts:
        return False
    return True


def main() -> int:
    violations: list[tuple[Path, int]] = []
    for runtime_dir in RUNTIME_DIRS:
        for path in runtime_dir.rglob("*"):
            if not path.is_file() or not should_scan(path):
                continue
            count = line_count(path)
            rel = path.relative_to(ROOT)
            limit = PER_FILE_LIMITS.get(rel, MAX_LINES)
            if count > limit:
                violations.append((path, count))

    if violations:
        print("File size limit exceeded:")
        for path, count in sorted(violations, key=lambda entry: entry[1], reverse=True):
            rel = path.relative_to(ROOT)
            limit = PER_FILE_LIMITS.get(rel, MAX_LINES)
            print(f" - {rel}: {count} (limit {limit})")
        return 1

    print("File size check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
