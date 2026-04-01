from __future__ import annotations

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]

FORBIDDEN_PATHS = [
    ROOT / "apps" / "desktop-ui" / "src" / "features" / "ui-plus",
    ROOT / "apps" / "desktop-ui" / "src" / "features" / "pcp" / "catalog",
    ROOT / "crates" / "engine-industrial",
]


def check() -> int:
    violations: list[str] = []
    for path in FORBIDDEN_PATHS:
        if path.exists():
            violations.append(str(path.relative_to(ROOT)))

    if violations:
        print("Generated bloat paths detected:")
        for violation in violations:
            print(f" - {violation}")
        print("\nRemove generated runtime bloat before merging.")
        return 1

    print("Generated bloat check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(check())
